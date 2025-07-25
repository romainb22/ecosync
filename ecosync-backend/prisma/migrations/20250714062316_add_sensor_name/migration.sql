/*
  Warnings:

  - Added the required column `sensorName` to the `Measurement` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Measurement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" REAL NOT NULL,
    "humidity" INTEGER NOT NULL,
    "co2" INTEGER NOT NULL,
    "sensorName" TEXT NOT NULL
);
INSERT INTO "new_Measurement" ("co2", "humidity", "id", "temperature", "timestamp") SELECT "co2", "humidity", "id", "temperature", "timestamp" FROM "Measurement";
DROP TABLE "Measurement";
ALTER TABLE "new_Measurement" RENAME TO "Measurement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
