-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "municipalityCode" TEXT,
ADD COLUMN     "responsibleCpf" TEXT;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "dimobPropertyType" TEXT DEFAULT 'U',
ADD COLUMN     "extractedCep" TEXT,
ADD COLUMN     "municipalityCode" TEXT;