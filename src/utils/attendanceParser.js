import * as XLSX from "xlsx";

export async function parseAttendanceFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (!["xls", "xlsx"].includes(extension)) {
    throw new Error(
      "Only .xls and .xlsx files are supported."
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
  });

  if (!workbook.SheetNames.length) {
    throw new Error("No worksheet found.");
  }

  const worksheet =
    workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(
    worksheet,
    {
      header: 1,
      defval: "",
    }
  );

  let headerRow = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map((cell) =>
      String(cell).trim()
    );

    if (
      row.includes("Emp. Code") &&
      row.includes("EmployeeName")
    ) {
      headerRow = i;
      break;
    }
  }

  if (headerRow === -1) {
    throw new Error(
      "Attendance table not found."
    );
  }

  const headers = rows[headerRow];

  const findColumn = (name) =>
    headers.findIndex(
      (h) =>
        String(h).trim() === name
    );

  const idIndex = findColumn("Emp. Code");
  const nameIndex = findColumn("EmployeeName");
  const presentIndex = findColumn("P");
  const absentIndex = findColumn("A");
  const weeklyOffIndex = findColumn("WOP");

  const employees = [];
  const duplicateIds = [];
  const seen = new Set();

  for (
    let i = headerRow + 1;
    i < rows.length;
    i++
  ) {
    const row = rows[i];

    const id = String(
      row[idIndex] ?? ""
    ).trim();

    if (!id) continue;

    if (seen.has(id)) {
      duplicateIds.push(id);
      continue;
    }

    seen.add(id);

    employees.push({
      id,

      name: String(
        row[nameIndex] ?? ""
      ).trim(),

      workingDays:
        Number(row[presentIndex]) || 0,

      weeklyOff:
        Number(row[weeklyOffIndex]) || 0,

      leavesTaken:
        Number(row[absentIndex]) || 0,
    });
  }

  return {
    success: true,

    employees,

    summary: {
      fileName: file.name,

      fileType: extension,

      totalEmployees:
        employees.length,

      duplicateIds,
    },
  };
}