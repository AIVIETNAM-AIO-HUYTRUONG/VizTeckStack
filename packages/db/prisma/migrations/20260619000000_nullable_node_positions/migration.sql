-- AlterTable: Make positionX and positionY nullable on Node
ALTER TABLE "Node" ALTER COLUMN "positionX" DROP NOT NULL;
ALTER TABLE "Node" ALTER COLUMN "positionY" DROP NOT NULL;
