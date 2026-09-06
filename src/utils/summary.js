export function calculateSummary(processedEmployees) {
  return {
    employees: processedEmployees.length,

    grossSalary: processedEmployees.reduce(
      (sum, emp) => sum + (emp.grossSalary || 0),
      0
    ),

    casualLeavePay: processedEmployees.reduce(
      (sum, emp) => sum + (emp.casualLeavePay || 0),
      0
    ),

    bonus: processedEmployees.reduce(
      (sum, emp) => sum + (emp.bonus || 0),
      0
    ),

    commission: processedEmployees.reduce(
      (sum, emp) => sum + (emp.commission || 0),
      0
    ),

    wholesale: processedEmployees.reduce(
      (sum, emp) => sum + (emp.wholesale || 0),
      0
    ),

    teaCost: processedEmployees.reduce(
      (sum, emp) => sum + (emp.teaCost || 0),
      0
    ),

    lunchBoxCost: processedEmployees.reduce(
      (sum, emp) => sum + (emp.lunchBoxCost || 0),
      0
    ),

    additions: processedEmployees.reduce(
      (sum, emp) => sum + (emp.additions || 0),
      0
    ),

    leaveDeduction: processedEmployees.reduce(
      (sum, emp) => sum + (emp.leaveDeduction || 0),
      0
    ),

    monthlyAdvance: processedEmployees.reduce(
      (sum, emp) => sum + (emp.monthlyAdvance || 0),
      0
    ),

    clothTaken: processedEmployees.reduce(
      (sum, emp) => sum + (emp.clothTaken || 0),
      0
    ),

    additionalAdvance: processedEmployees.reduce(
      (sum, emp) => sum + (emp.additionalAdvance || 0),
      0
    ),

    monthLess: processedEmployees.reduce(
      (sum, emp) => sum + (emp.monthLess || 0),
      0
    ),



    deductions: processedEmployees.reduce(
      (sum, emp) => sum + (emp.deductions || 0),
      0
    ),

    netPayroll: processedEmployees.reduce(
      (sum, emp) => sum + (emp.finalSalary || 0),
      0
    ),
  };
}