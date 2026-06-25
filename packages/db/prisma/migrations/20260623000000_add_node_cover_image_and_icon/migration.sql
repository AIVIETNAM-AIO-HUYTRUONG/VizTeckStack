-- AlterTable: Add coverImage and icon optional fields to Node
ALTER TABLE "Node" ADD COLUMN "coverImage" TEXT;
ALTER TABLE "Node" ADD COLUMN "icon" TEXT;
