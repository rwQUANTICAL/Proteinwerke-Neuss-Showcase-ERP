-- CreateEnum
CREATE TYPE "UrlaubsantragStatus" AS ENUM ('BEANTRAGT', 'GENEHMIGT', 'ABGELEHNT');

-- AlterTable
ALTER TABLE "urlaubsantrag" ADD COLUMN     "status" "UrlaubsantragStatus" NOT NULL DEFAULT 'BEANTRAGT';
