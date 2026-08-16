import express from "express";
import { prisma } from "../prisma.js";
import {
  recalculateOutstandingFromMonth,
} from "../services/recalculateOutstanding.js";

const router = express.Router();

router.post("/month", async (req, res) => {
  try {
    const { year, month, employees } = req.body;

    if (!year || !month || !Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        message: "year, month and employees are required.",
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12.",
      });
    }
    // Check whether this month already has payroll records
const existingMonthRecords =
  await prisma.monthlyOutstanding.findMany({
    where: {
      year,
      month,
    },
    select: {
      employeeId: true,
      employee: {
        select: {
          name: true,
        },
      },
    },
  });

const monthAlreadyExists =
  existingMonthRecords.length > 0;

const uploadedIds = new Set(
  employees.map((employee) =>
    String(employee.id).trim()
  )
);

const missingEmployees = existingMonthRecords
  .filter(
    (record) =>
      !uploadedIds.has(record.employeeId)
  )
  .map((record) => ({
    id: record.employeeId,
    name: record.employee.name,
  }));

  const replaceExisting =
  req.body.replaceExisting === true;
  if (monthAlreadyExists && !replaceExisting) {
  return res.status(409).json({
    success: false,
    requiresConfirmation: true,
    message:
      `Payroll for ${year}-${String(month).padStart(2, "0")} already exists.`,
    missingEmployees,
    existingEmployees:
      existingMonthRecords.map((record) => ({
        id: record.employeeId,
        name: record.employee.name,
      })),
  });
}
  

    /*
     * Determine previous month.
     *
     * September 2026 -> August 2026
     * January 2027   -> December 2026
     */

    const previousMonth = month === 1 ? 12 : month - 1;

    const previousYear = month === 1 ? year - 1 : year;

    /*
     * Get all employees currently stored in DB.
     * Used to detect employees missing from the upload.
     */

    
    const results = [];

    for (const employee of employees) {
      const id = String(employee.id).trim();
      const name = String(employee.name ?? "").trim();

      if (!id || !name) {
        continue;
      }

      /*
       * Convert all numeric values to JavaScript numbers.
       */

      const salary =
        Number(employee.salary) || 0;

      const additionalAdvance =
        Number(employee.additionalAdvance) || 0;

      const monthLess =
        Number(employee.monthLess) || 0;

      /*
       * Create employee if new.
       * Update name if employee already exists.
       */

      await prisma.employee.upsert({
        where: {
          id,
        },

        update: {
          name,
        },

        create: {
          id,
          name,
        },
      });

      /*
       * Find previous month's outstanding.
       *
       * If no previous record exists:
       * previousOutstanding = 0
       *
       * This handles:
       * - first month
       * - newly added employees
       */

      const previousRecord =
        await prisma.monthlyOutstanding.findUnique({
          where: {
            employeeId_year_month: {
              employeeId: id,
              year: previousYear,
              month: previousMonth,
            },
          },
        });

      /*
       * Prisma Decimal -> JavaScript Number
       */

      const previousOutstanding = Number(
        previousRecord?.remainingOutstanding ?? 0
      );

      /*
       * Core calculation:
       *
       * Previous Outstanding
       * + Additional Advance
       * - Month Less
       * = Remaining Outstanding
       */

      const remainingOutstanding = Math.max(
  0,
  previousOutstanding +
    additionalAdvance -
    monthLess
);

      /*
       * Create or update this month's record.
       */

      const record =
        await prisma.monthlyOutstanding.upsert({
          where: {
            employeeId_year_month: {
              employeeId: id,
              year,
              month,
            },
          },

          update: {
            salary,
            additionalAdvance,
            monthLess,
            remainingOutstanding,
          },

          create: {
            employeeId: id,
            year,
            month,
            salary,
            additionalAdvance,
            monthLess,
            remainingOutstanding,
          },
        });

      results.push({
        employeeId: id,
        name,
        salary,
        previousOutstanding,
        additionalAdvance,
        monthLess,
        remainingOutstanding,
        recordId: record.id,
      });
    }

    return res.json({
      success: true,
      message: "Monthly payroll saved successfully.",
      employees: results,
      missingEmployees,
      monthAlreadyExists,
    
    });
  } catch (error) {
    console.error("Payroll save error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save monthly payroll.",
    });
  }
});
router.post("/month/replace", async (req, res) => {
  try {
    const {
      year,
      month,
      employees,
      deleteMissing = false,
    } = req.body;

    if (
      !year ||
      !month ||
      !Array.isArray(employees)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "year, month and employees are required.",
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message:
          "Month must be between 1 and 12.",
      });
    }

    /*
     * Get the employees currently stored
     * for this exact month.
     */
    const existingMonthRecords =
      await prisma.monthlyOutstanding.findMany({
        where: {
          year,
          month,
        },
        select: {
          employeeId: true,
        },
      });

    const existingIds = new Set(
      existingMonthRecords.map(
        (record) => record.employeeId
      )
    );

    const uploadedIds = new Set(
      employees.map((employee) =>
        String(employee.id).trim()
      )
    );

    /*
     * Employees that existed in this month
     * but are not present in the new upload.
     */
    const missingIds = [
      ...existingIds,
    ].filter(
      (id) => !uploadedIds.has(id)
    );

    /*
     * Update / create uploaded employees.
     */
    for (const employee of employees) {
      const id = String(
        employee.id ?? ""
      ).trim();

      const name = String(
        employee.name ?? ""
      ).trim();

      if (!id || !name) {
        continue;
      }

      const salary =
        Number(employee.salary) || 0;

      const additionalAdvance =
        Number(
          employee.additionalAdvance
        ) || 0;

      const monthLess =
        Number(employee.monthLess) || 0;

      /*
       * Keep Employee master record.
       */
      await prisma.employee.upsert({
        where: {
          id,
        },

        update: {
          name,
        },

        create: {
          id,
          name,
        },
      });

      /*
       * Get previous month's outstanding.
       */
      const previousMonth =
        month === 1 ? 12 : month - 1;

      const previousYear =
        month === 1 ? year - 1 : year;

      const previousRecord =
        await prisma.monthlyOutstanding.findUnique(
          {
            where: {
              employeeId_year_month: {
                employeeId: id,
                year: previousYear,
                month: previousMonth,
              },
            },
          }
        );

      const previousOutstanding =
        Number(
          previousRecord?.remainingOutstanding ??
            0
        );

      const remainingOutstanding =
        Math.max(
          0,
          previousOutstanding +
            additionalAdvance -
            monthLess
        );

      await prisma.monthlyOutstanding.upsert({
        where: {
          employeeId_year_month: {
            employeeId: id,
            year,
            month,
          },
        },

        update: {
          salary,
          additionalAdvance,
          monthLess,
          remainingOutstanding,
        },

        create: {
          employeeId: id,
          year,
          month,
          salary,
          additionalAdvance,
          monthLess,
          remainingOutstanding,
        },
      });
    }

    /*
     * If user selected:
     *
     * Replace & Delete Missing
     *
     * remove the missing employees'
     * records from this month onward.
     */
    if (
      deleteMissing &&
      missingIds.length > 0
    ) {
      for (const employeeId of missingIds) {
        await prisma.monthlyOutstanding.deleteMany(
          {
            where: {
              employeeId,
              OR: [
                {
                  year: {
                    gt: year,
                  },
                },
                {
                  year,
                  month: {
                    gte: month,
                  },
                },
              ],
            },
          }
        );
      }
    }

    /*
     * Recalculate employees included
     * in the new upload.
     */
    const recalculatedEmployees = [];

    for (const employee of employees) {
      const employeeId = String(
        employee.id ?? ""
      ).trim();

      if (!employeeId) {
        continue;
      }

      const records =
        await recalculateOutstandingFromMonth(
          employeeId,
          Number(year),
          Number(month)
        );

      recalculatedEmployees.push({
        employeeId,
        records,
      });
    }

    /*
     * Also recalculate employees that remain
     * in the month if necessary.
     *
     * For deleted employees, their future
     * records have already been removed.
     */
    return res.json({
      success: true,
      message:
        deleteMissing
          ? "Payroll replaced and missing employees deleted successfully."
          : "Payroll updated successfully.",
      year,
      month,
      deletedEmployees:
        deleteMissing
          ? missingIds
          : [],
      recalculatedEmployees,
    });
  } catch (error) {
    console.error(
      "Payroll replacement error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to replace monthly payroll.",
    });
  }
});
router.get("/month", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Valid year and month are required.",
      });
    }

    // Determine previous month
    const previousMonth =
      month === 1 ? 12 : month - 1;

    const previousYear =
      month === 1 ? year - 1 : year;

    // Get current month's records
    const records =
      await prisma.monthlyOutstanding.findMany({
        where: {
          year,
          month,
        },
        include: {
          employee: true,
        },
        orderBy: {
          employeeId: "asc",
        },
      });

    const employees = [];

    for (const record of records) {

      // Get previous month's record for this employee
      const previousRecord =
        await prisma.monthlyOutstanding.findUnique({
          where: {
            employeeId_year_month: {
              employeeId: record.employeeId,
              year: previousYear,
              month: previousMonth,
            },
          },
        });

      const previousOutstanding =
        Number(
          previousRecord?.remainingOutstanding ?? 0
        );

      employees.push({
        employeeId: record.employeeId,
        name: record.employee.name,

        salary:
          Number(record.salary),

        additionalAdvance:
          Number(record.additionalAdvance),

        monthLess:
          Number(record.monthLess),

        previousOutstanding,

        remainingOutstanding:
          Number(record.remainingOutstanding),
      });
    }

    return res.json({
      success: true,
      year,
      month,
      employees,
    });

  } catch (error) {
    console.error("Payroll fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly payroll.",
    });
  }
});

/*
 * GET /month/salary-prefill
 *
 * Returns the previous month's salary for every employee.
 * Used by the template download and PayrollEditor prefill.
 *
 * New employees (no previous record) get salary = 0.
 * Employee ID is always the key — never name.
 */
router.get("/month/salary-prefill", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Valid year and month are required.",
      });
    }

    /*
     * Determine previous month.
     *
     * October 2026  -> September 2026
     * January 2027  -> December 2026
     */
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;

    /*
     * Find all records for the previous month.
     */
    const previousRecords =
      await prisma.monthlyOutstanding.findMany({
        where: {
          year: previousYear,
          month: previousMonth,
        },
        select: {
          employeeId: true,
          salary: true,
        },
      });

    /*
     * Build a map: employeeId -> salary
     *
     * Employees not found here will get 0
     * on the frontend (new employee rule).
     */
    const salaryMap = {};

    for (const record of previousRecords) {
      salaryMap[record.employeeId] =
        Number(record.salary);
    }

    return res.json({
      success: true,
      year,
      month,
      previousYear,
      previousMonth,
      salaryMap,
    });

  } catch (error) {
    console.error(
      "Salary prefill error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch salary prefill.",
    });
  }
});

export default router;