import * as XLSX from "xlsx";
import { getMonthDetails } from "@/utils/calendar";

export const downloadTemplate = (settings) => {
  const { maximumWorkingDays } = getMonthDetails(
    settings.month,
    settings.year
  );

  const data = [
    {
      "Employee ID": "",
      "Employee Name": "",
      "Monthly Salary": "",
      "Working Days": maximumWorkingDays,
      "Weekly Off": 0,
      "Leaves Taken": 0,
      "Commission": 0,
      "Lunch Box Allowed": "YES",

      // New Fields
      "Labor Holiday": 0,
      "Salary Advance": 0,
      "Cloth Taken": 0,
      "Additional Advance": 0,
      "Month Less": 0,
      "OB": 0,
      Wholesale: 0,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!cols"] = [
    { wch: 15 }, // Employee ID
    { wch: 25 }, // Employee Name
    { wch: 18 }, // Monthly Salary
    { wch: 15 }, // Working Days
    { wch: 15 }, // Weekly Off
    { wch: 15 }, // Leaves Taken
    { wch: 15 }, // Commission
    { wch: 20 }, // Lunch Box Allowed

    // New Fields
    { wch: 15 }, // Labor Holiday
    { wch: 18 }, // Monthly Advance
    { wch: 18 }, // Cloth Taken
    { wch: 20 }, // Additional Advance
    { wch: 18 }, // Month Less
    { wch: 18 }, // OB
    { wch: 15 }, // Wholesale
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Employees"
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  XLSX.writeFile(
    workbook,
    `MANHAR-Payroll-Template-${months[settings.month]}-${settings.year}.xlsx`
  );
};