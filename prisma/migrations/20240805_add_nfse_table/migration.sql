-- CreateTable
CREATE TABLE "nfse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numeroNota" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "valorServicos" DECIMAL(10,2) NOT NULL,
    "valorLiquido" DECIMAL(10,2) NOT NULL,
    "valorIss" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorPis" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorCofins" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorInss" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorIr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "codigoServico" TEXT,
    "discriminacao" TEXT,
    "tomadorCnpjCpf" TEXT,
    "tomadorRazaoSocial" TEXT,
    "tomadorEndereco" TEXT,
    "prestadorCnpjCpf" TEXT,
    "prestadorRazaoSocial" TEXT,
    "fileName" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nfse_userId_idx" ON "nfse"("userId");

-- CreateIndex
CREATE INDEX "nfse_competencia_idx" ON "nfse"("competencia");

-- CreateIndex
CREATE UNIQUE INDEX "nfse_numeroNota_userId_key" ON "nfse"("numeroNota", "userId");

-- AddForeignKey
ALTER TABLE "nfse" ADD CONSTRAINT "nfse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;