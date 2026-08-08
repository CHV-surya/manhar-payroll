export function mergeEmployees(
  attendanceEmployees,
  payrollEmployees
) {
  const payrollMap = new Map();

  payrollEmployees.forEach((employee) => {
    payrollMap.set(
      String(employee.id).trim(),
      employee
    );
  });

  const mergedEmployees = [];
  const missingPayroll = [];

  attendanceEmployees.forEach((attendance) => {
    const payroll = payrollMap.get(
      String(attendance.id).trim()
    );

    if (!payroll) {
      missingPayroll.push(attendance.id);
      return;
    }

    mergedEmployees.push({
      id: payroll.id,
name: payroll.name,

      // Attendance
      // Final values come from Payroll Excel
            workingDays: payroll.workingDays,
            weeklyOff: payroll.weeklyOff,
            leavesTaken: payroll.leavesTaken,

      // Payroll
      monthlySalary: payroll.monthlySalary,
      commission: payroll.commission,
      wholesale: payroll.wholesale,
      lunchBoxAllowed: payroll.lunchBoxAllowed,
      monthlyAdvance: payroll.monthlyAdvance,
      clothTaken: payroll.clothTaken,
      additionalAdvance: payroll.additionalAdvance,
      monthLess: payroll.monthLess,
      previousOutstanding:
        payroll.previousOutstanding || 0,
    });
  });

  return {
    employees: mergedEmployees,
    missingPayroll,
  };
}