
import "server-only";
import type { PrismaClient } from "@prisma/client";

type QueryArgs = Record<string, unknown>;

const apiUrl = process.env.CONTABO_API_URL?.replace(/\/+$/, "");
const apiToken = process.env.CONTABO_API_TOKEN;

async function queryDatabase(
  model: string,
  method: string,
  args: QueryArgs = {}
) {
  if (!apiUrl || !apiToken) {
    throw new Error(
      "Missing CONTABO_API_URL or CONTABO_API_TOKEN environment variables."
    );
  }

  const response = await fetch(`${apiUrl}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ model, method, args }),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : `Database API request failed (${response.status}).`
    );
  }

  return payload.result;
}

const models = {
  user: ["findUnique", "findMany", "create"],
  evidence: ["findMany", "findUnique", "create", "delete", "groupBy"],
} as const;

const proxy = new Proxy({} as PrismaClient, {
  get(_target, modelProperty) {
    if (
      typeof modelProperty !== "string" ||
      !Object.prototype.hasOwnProperty.call(models, modelProperty)
    ) {
      return undefined;
    }

    const model = modelProperty as keyof typeof models;

    return new Proxy(
      {},
      {
        get(_modelTarget, methodProperty) {
          if (
            typeof methodProperty !== "string" ||
            !(models[model] as readonly string[]).includes(methodProperty)
          ) {
            return undefined;
          }

          return (args: QueryArgs = {}) =>
            queryDatabase(model, methodProperty, args);
        },
      }
    );
  },
});

export const prisma = proxy;
