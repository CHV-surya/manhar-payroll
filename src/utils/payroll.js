// Round to nearest rupee
const round = (value) => Math.round(value);

// Monthly Salary / 30
export function calculateDailySalary(monthlySalary) {
  return round(monthlySalary / 30);
}

// Weekly Off Pay
export function calculateWeeklyOffPay(
  dailySalary,
  weeklyOff
) {
  return round(dailySalary * weeklyOff);
}

// Tea Cost
export function calculateTeaCost(
  totalAttendance,
  teaRate
) {
  return round(totalAttendance * teaRate);
}

// Lunch Box Cost
export function calculateLunchBoxCost(
  totalAttendance,
  boxRate
) {
  return round(totalAttendance * boxRate);
}

// Leave Bonus & Deduction
export function calculateLeaveAdjustment(
  dailySalary,
  leavesTaken,
  allowedLeaves
) {
  // Penalty Rule
  if (leavesTaken >= 6) {
    return {
      bonus: 0,
      leaveDeduction: round(
        leavesTaken * dailySalary
      ),
      extraLeaves: leavesTaken,
      remainingLeaves: 0,
    };
  }

  // Bonus ONLY when no leave is taken
  if (leavesTaken === 0) {
    return {
      bonus: round(
        allowedLeaves * dailySalary
      ),
      leaveDeduction: 0,
      extraLeaves: 0,
      remainingLeaves: allowedLeaves,
    };
  }

  // Allowed leaves fully used
  if (leavesTaken === allowedLeaves) {
    return {
      bonus: 0,
      leaveDeduction: 0,
      extraLeaves: 0,
      remainingLeaves: 0,
    };
  }

  // Leaves less than allowed
  if (leavesTaken < allowedLeaves) {
    return {
      bonus: 0,
      leaveDeduction: 0,
      extraLeaves: 0,
      remainingLeaves:
        allowedLeaves - leavesTaken,
    };
  }

  // Extra Leave Deduction
  const extraLeaves =
    leavesTaken - allowedLeaves;

  return {
    bonus: 0,
    leaveDeduction: round(
      extraLeaves * dailySalary
    ),
    extraLeaves,
    remainingLeaves: 0,
  };
}

// Main Payroll Function
export function calculatePayroll(
  employee,
  settings
) {
  const dailySalary =
    calculateDailySalary(employee.monthlySalary);

  // Weekly Off Rule
  const weeklyOff =
    employee.leavesTaken >= 10
      ? 0
      : employee.weeklyOff;

  const totalAttendance =
    employee.workingDays +
    weeklyOff;

  const weeklyOffPay =
    calculateWeeklyOffPay(
      dailySalary,
      weeklyOff
    );

  const teaCost =
    calculateTeaCost(
      totalAttendance,
      settings.teaCost
    );

  const lunchBoxCost =
    employee.lunchBoxAllowed
      ? calculateLunchBoxCost(
          totalAttendance,
          settings.boxCost
        )
      : 0;

  const {
    bonus,
    leaveDeduction,
    extraLeaves,
    remainingLeaves,
  } = calculateLeaveAdjustment(
    dailySalary,
    employee.leavesTaken,
    settings.allowedLeaves
  );

  // Casual Leave
  const casualLeaves = Math.max(
    settings.allowedLeaves -
      employee.leavesTaken,
    0
  );

  // Casual Leave Pay
  const casualLeavePay =
    round(casualLeaves * dailySalary);

  const laborHoliday = employee.laborHoliday || 0;
  const laborHolidayPay = round(laborHoliday * dailySalary);

  // Gross Salary
  const grossSalary =
    employee.monthlySalary +
    casualLeavePay +
    weeklyOffPay +
    bonus +
    employee.commission +
    employee.wholesale +
    laborHolidayPay;

  // Additions
  const additions =
    teaCost +
    lunchBoxCost;

  // Future Database Support
  const previousOutstanding =
    employee.previousOutstanding || 0;

  const ob = employee.ob || 0;

  // Total Outstanding Loan
  const outstandingLoan =
    previousOutstanding +
    employee.additionalAdvance +
    ob;

  // Remaining Outstanding Loan
  const remainingOutstanding =
    Math.max(
      outstandingLoan -
        employee.monthLess,
      0
    );

  // Salary Deductions
  const deductions =
    leaveDeduction +
    employee.monthlyAdvance +
    employee.clothTaken +
    employee.monthLess;

  // Final Salary
  const finalSalary =
    grossSalary +
    additions -
    deductions;

  return {
    ...employee,

    dailySalary,

    workingDays: employee.workingDays,

    weeklyOff,

    totalAttendance,

    allowedLeaves: casualLeaves,

    casualLeavePay,

    weeklyOffPay,

    bonus,

    laborHoliday,

    laborHolidayPay,

    extraLeaves,

    remainingLeaves,

    teaCost,

    lunchBoxCost,

    additions,

    previousOutstanding,

    outstandingLoan,

    ob,

    remainingOutstanding,

    leaveDeduction,

    deductions,

    grossSalary,

    finalSalary: round(finalSalary),
  };
}