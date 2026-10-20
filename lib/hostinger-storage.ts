import path from "node:path";
import { Transform, type Readable } from "node:stream";
import SftpClient from "ssh2-sftp-client";

export function hostingerStorageConfigured() {
  return Boolean(
    process.env.HOSTINGER_SFTP_HOST &&
      process.env.HOSTINGER_SFTP_USER &&
      (process.env.HOSTINGER_SFTP_PASSWORD || process.env.HOSTINGER_SFTP_PRIVATE_KEY) &&
      process.env.HOSTINGER_EVIDENCE_DIR
  );
}

function config() {
  if (!hostingerStorageConfigured()) {
    throw new Error("Hostinger SFTP storage is not configured.");
  }

  return {
    host: process.env.HOSTINGER_SFTP_HOST!,
    port: Number(process.env.HOSTINGER_SFTP_PORT || "22"),
    username: process.env.HOSTINGER_SFTP_USER!,
    password: process.env.HOSTINGER_SFTP_PASSWORD,
    privateKey: process.env.HOSTINGER_SFTP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    readyTimeout: 20000,
  };
}

function remotePath(relativePath: string) {
  if (!relativePath || relativePath.startsWith("/") || relativePath.includes("..")) {
    throw new Error("Invalid Hostinger evidence path.");
  }
  return path.posix.join(process.env.HOSTINGER_EVIDENCE_DIR!, relativePath);
}

export async function putEvidence(
  relativePath: string,
  content: Buffer | Readable,
  totalBytes: number,
  onProgress?: (percentage: number) => void,
  onConnected?: () => void,
) {
  const client = new SftpClient();
  const fullPath = remotePath(relativePath);
  try {
    await client.connect(config());
    await client.mkdir(path.posix.dirname(fullPath), true);
    onConnected?.();
    if (Buffer.isBuffer(content)) {
      await client.put(content, fullPath);
      onProgress?.(100);
    } else {
      let uploadedBytes = 0;
      const progressStream = new Transform({
        transform(chunk, encoding, callback) {
          uploadedBytes += chunk.length;
          onProgress?.(Math.min(100, Math.floor((uploadedBytes / totalBytes) * 100)));
          callback(null, chunk);
        },
      });
      await client.put(content.pipe(progressStream), fullPath);
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function getEvidence(relativePath: string) {
  const client = new SftpClient();
  try {
    await client.connect(config());
    return await client.get(remotePath(relativePath));
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function deleteEvidence(relativePath: string) {
  const client = new SftpClient();
  try {
    await client.connect(config());
    await client.delete(remotePath(relativePath));
  } finally {
    await client.end().catch(() => undefined);
  }
}
