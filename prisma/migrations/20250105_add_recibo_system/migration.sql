-- CreateTable
CREATE TABLE "recibos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "numeroRecibo" TEXT NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "taxaAdministracao" DECIMAL(10,2) NOT NULL,
    "percentualTaxa" DECIMAL(5,2) NOT NULL,
    "valorRepassado" DECIMAL(10,2) NOT NULL,
    "pdfUrl" TEXT,
    "proprietarioNome" TEXT NOT NULL,
    "proprietarioDoc" TEXT NOT NULL,
    "inquilinoNome" TEXT NOT NULL,
    "inquilinoDoc" TEXT NOT NULL,
    "imovelEndereco" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recibos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recibos_paymentId_key" ON "recibos"("paymentId");

-- CreateIndex
CREATE INDEX "recibos_userId_idx" ON "recibos"("userId");

-- CreateIndex
CREATE INDEX "recibos_contractId_idx" ON "recibos"("contractId");

-- CreateIndex
CREATE INDEX "recibos_competencia_idx" ON "recibos"("competencia");

-- CreateIndex
CREATE INDEX "recibos_numeroRecibo_idx" ON "recibos"("numeroRecibo");

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add inscricaoMunicipal to Company table if not exists
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "inscricaoMunicipal" TEXT;