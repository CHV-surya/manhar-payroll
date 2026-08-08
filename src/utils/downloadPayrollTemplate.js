import * as XLSX from "xlsx";

export function downloadPayrollTemplate(
  attendanceEmployees
) {
  if (!attendanceEmployees.length) {
    alert("No attendance data found.");
    return;
  }

  const rows = attendanceEmployees.map((emp) => ({
    "Employee ID": emp.id,
    "Employee Name": emp.name,
    "Working Days": emp.workingDays,
    "Weekly Off": emp.weeklyOff,
    "Leaves Taken": emp.leavesTaken,

    "Monthly Salary": "",
    "Commission": 0,
    "Lunch Box Allowed": "NO",
    "Salary Advance": 0,
    "Cloth Taken": 0,
    "Additional Advance": 0,
    "Month Less": 0,
    "Wholesale": 0,
  }));

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
    { wch: 18 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
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