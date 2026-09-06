import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function downloadPayrollTemplate(
  attendanceEmployees,
  attendanceSummary,
  settings
) {
  if (!attendanceEmployees.length) {
    alert("No attendance data found.");
    return;
  }

  /*
   * Fetch previous-month salary for prefill.
   *
   * If the fetch fails, we proceed with blank salary
   * (same as for new employees).
   */
  let salaryMap = {};

  if (settings) {
    try {
      const dbMonth = settings.month + 1;
      const response = await fetch(
        `${API_BASE}/api/payroll/month/salary-prefill?year=${settings.year}&month=${dbMonth}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        salaryMap = data.salaryMap || {};
      }
    } catch (err) {
      console.error(
        "Failed to fetch salary prefill for template:",
        err
      );
    }
  }

  const rows = attendanceEmployees.map((emp) => {
    const empId = String(emp.id).trim();
    const prefillSalary = salaryMap[empId];

    return {
      "Employee ID": emp.id,
      "Employee Name": emp.name,
      "Working Days": emp.workingDays,
      "Weekly Off": emp.weeklyOff,
      "Leaves Taken": emp.leavesTaken,

      "Monthly Salary":
        prefillSalary != null && prefillSalary > 0
          ? prefillSalary
          : "",
      "Commission": 0,
      "Lunch Box Allowed": "NO",
      "Labor Holiday": 0,
      "Salary Advance": 0,
      "Cloth Taken": 0,
      "Additional Advance": 0,
      "Month Less": 0,
      "OB": 0,
      "Wholesale": 0,
    };
  });

  const sheet = XLSX.utils.json_to_sheet(rows);

  sheet["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    "Payroll"
  );

  XLSX.writeFile(
    workbook,
    "Payroll-Template.xlsx"
  );
}