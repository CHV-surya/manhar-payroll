import { prisma } from "../prisma.js";

export async function recalculateOutstandingFromMonth(
  employeeId,
  startYear,
  startMonth
) {
  /*
   * Get every monthly record for this employee
   * from the correction month onward.
   */

  const records = await prisma.monthlyOutstanding.findMany({
    where: {
      employeeId,
      OR: [
        {
          year: {
            gt: startYear,
          },
        },
        {
          year: startYear,
          month: {
            gte: startMonth,
          },
        },
      ],
    },
    orderBy: [
      {
        year: "asc",
      },
      {
        month: "asc",
      },
    ],
  });

  if (records.length === 0) {
    return [];
  }

  /*
   * Find the month immediately before
   * the correction month.
   */

  let previousYear = startYear;
  let previousMonth = startMonth - 1;

  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear--;
  }

  const previousRecord =
    await prisma.monthlyOutstanding.findUnique({
      where: {
        employeeId_year_month: {
          employeeId,
          year: previousYear,
          month: previousMonth,
        },
      },
    });

  /*
   * Prisma Decimal -> JavaScript Number
   */

  let previousOutstanding = Number(
    previousRecord?.remainingOutstanding ?? 0
  );

  const updatedRecords = [];

  /*
   * Recalculate chronologically.
   *
   * Each month's result becomes
   * the next month's previous outstanding.
   */

  for (const record of records) {
    const additionalAdvance = Number(
      record.additionalAdvance ?? 0
    );

    const monthLess = Number(
      record.monthLess ?? 0
    );

    const ob = Number(
      record.ob ?? 0
    );

    const remainingOutstanding = Math.max(
      0,
      previousOutstanding +
        additionalAdvance +
        ob -
        monthLess
    );

    const updated =
      await prisma.monthlyOutstanding.update({
        where: {
          id: record.id,
        },

        data: {
          remainingOutstanding,
        },
      });

    updatedRecords.push({
      year: updated.year,
      month: updated.month,
      previousOutstanding,
      additionalAdvance,
      monthLess,
      remainingOutstanding,
    });

    /*
     * This month's remaining amount
     * becomes the next month's previous amount.
     */

    previousOutstanding = remainingOutstanding;
  }

  return updatedRecords;
}