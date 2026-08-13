-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyOutstanding" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "additionalAdvance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monthLess" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remainingOutstanding" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyOutstanding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyOutstanding_year_month_idx" ON "MonthlyOutstanding"("year", "month");

-- CreateIndex
CREATE INDEX "MonthlyOutstanding_employeeId_idx" ON "MonthlyOutstanding"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyOutstanding_employeeId_year_month_key" ON "MonthlyOutstanding"("employeeId", "year", "month");

-- AddForeignKey
ALTER TABLE "MonthlyOutstanding" ADD CONSTRAINT "MonthlyOutstanding_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
