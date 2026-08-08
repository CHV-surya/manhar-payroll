import * as XLSX from "xlsx";

export async function parsePayrollFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (!["xls", "xlsx"].includes(extension)) {
    throw new Error("Only .xls and .xlsx files are supported.");
  }

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
  });

  const sheet =
    workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  if (rows.length < 2) {
    throw new Error("Payroll sheet is empty.");
  }

  const headers = rows[0].map((h) =>
    String(h).trim()
  );

  const getColumn = (name) =>
    headers.findIndex((h) => h === name);

  const columns = {
    id: getColumn("Employee ID"),
    name: getColumn("Employee Name"),
    monthlySalary: getColumn("Monthly Salary"),
    workingDays: getColumn("Working Days"),
    weeklyOff: getColumn("Weekly Off"),
    leavesTaken: getColumn("Leaves Taken"),
    commission: getColumn("Commission"),
    lunchBoxAllowed: getColumn("Lunch Box Allowed"),
    salaryAdvance: getColumn("Salary Advance"),
    clothTaken: getColumn("Cloth Taken"),
    additionalAdvance: getColumn("Additional Advance"),
    monthLess: getColumn("Month Less"),
    wholesale: getColumn("Wholesale"),
  };
  const required = [
  "id",
  "name",
  "monthlySalary",
  "workingDays",
  "weeklyOff",
  "leavesTaken",
];

for (const key of required) {
  if (columns[key] === -1) {
    throw new Error(
      `Missing column: ${key}`
    );
  }
}

  const employees = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const id = String(row[columns.id] ?? "").trim();

    if (!id) continue;

    employees.push({
      id,

      name: String(
        row[columns.name] ?? ""
      ).trim(),

      monthlySalary:
        Number(row[columns.monthlySalary]) || 0,

      workingDays:
        Number(row[columns.workingDays]) || 0,

      weeklyOff:
        Number(row[columns.weeklyOff]) || 0,

      leavesTaken:
        Number(row[columns.leavesTaken]) || 0,

      commission:
        Number(row[columns.commission]) || 0,

      lunchBoxAllowed:
  String(
    row[columns.lunchBoxAllowed] ?? "YES"
  )
    .trim()
    .toUpperCase() === "YES",

      monthlyAdvance:
        Number(row[columns.salaryAdvance]) || 0,

      clothTaken:
        Number(row[columns.clothTaken]) || 0,

      additionalAdvance:
        Number(row[columns.additionalAdvance]) || 0,

      monthLess:
        Number(row[columns.monthLess]) || 0,

      wholesale:
        Number(row[columns.wholesale]) || 0,

      previousOutstanding: 0,
    });
  }

  return employees;
}