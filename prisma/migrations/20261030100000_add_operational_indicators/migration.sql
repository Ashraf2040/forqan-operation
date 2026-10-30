CREATE TABLE "OperationalIndicator" (
    "stage" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalIndicator_pkey" PRIMARY KEY ("stage", "code")
);
