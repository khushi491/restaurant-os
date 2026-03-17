-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "assignedServerId" TEXT,
    "currentResId" TEXT,
    "seatedAt" DATETIME,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "shape" TEXT NOT NULL,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "isCombined" BOOLEAN NOT NULL DEFAULT false,
    "mergedTableIds" TEXT,
    CONSTRAINT "Table_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Table" ("assignedServerId", "branchId", "capacity", "currentResId", "id", "isCombined", "mergedTableIds", "number", "seatedAt", "shape", "status", "x", "y") SELECT "assignedServerId", "branchId", "capacity", "currentResId", "id", "isCombined", "mergedTableIds", "number", "seatedAt", "shape", "status", "x", "y" FROM "Table";
DROP TABLE "Table";
ALTER TABLE "new_Table" RENAME TO "Table";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
