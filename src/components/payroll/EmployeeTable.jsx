import { useMemo, useState,useRef,useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Download } from "lucide-react";

import { exportPayroll } from "@/utils/exportExcel";
import { formatCurrency } from "@/utils/format";

export default function EmployeeTable({
  employees,
  settings,
}) {
  const [search, setSearch] = useState("");
  
  const tableWrapperRef = useRef(null);

  
  const filteredEmployees = useMemo(() => {
    const keyword = search.toLowerCase();

    return employees.filter((emp) => {
      return (
        emp.name.toLowerCase().includes(keyword) ||
        String(emp.id).toLowerCase().includes(keyword)
      );
    });
  }, [employees, search]);
  
  

  return (
    <Card className="p-6 shadow-sm">

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">

        <div>
          <h2 className="text-2xl font-bold">
            Employee Payroll
          </h2>

          <p className="text-gray-500">
            Showing {filteredEmployees.length} employee(s)
          </p>

          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          onClick={() =>
            exportPayroll(
              filteredEmployees,
              settings
            )
          }
          disabled={!filteredEmployees.length}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>

      </div>
    
      <div
  ref={tableWrapperRef}
  className="rounded-lg border overflow-auto max-h-[calc(100vh-200px)]"
>
        
        <Table>

          <TableHeader className="sticky top-0 z-30 bg-white outline outline-1 outline-gray-200 shadow-sm">

            <TableRow>

              <TableHead className="sticky left-0 z-40 w-[70px] min-w-[70px] bg-white">ID</TableHead>
              <TableHead className="sticky left-[70px] z-40 min-w-[220px] bg-white">Name</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead>Daily Salary</TableHead>
              <TableHead>Working Days</TableHead>
              <TableHead>Weekly Off</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Casual Leave</TableHead>
              <TableHead>Casual Leave Pay</TableHead>
              <TableHead>Leaves Taken</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Weekly Off Pay</TableHead>
              <TableHead>Labor Holiday</TableHead>
              <TableHead>Labor Holiday Pay</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Wholesale</TableHead>
              <TableHead>Tea</TableHead>
              <TableHead>Lunch Box</TableHead>
              <TableHead>Leave Deduction</TableHead>
              <TableHead>Salary Advance</TableHead>
              <TableHead>Cloth Taken</TableHead>
              <TableHead>Additional Advance</TableHead>
              <TableHead>OB</TableHead>
              <TableHead>Previous Outstanding</TableHead>
              <TableHead>Month Less</TableHead>
              <TableHead>Remaining Outstanding</TableHead>
              <TableHead className="text-right">
                Final Salary
              </TableHead>

            </TableRow>

          </TableHeader>

          <TableBody>

            {filteredEmployees.length === 0 ? (

              <TableRow>

                <TableCell
                  colSpan={27}
                  className="text-center py-10"
                >
                  No employees found.
                </TableCell>

              </TableRow>

            ) : (

              filteredEmployees.map((emp) => (

                <TableRow key={emp.id}>

                  <TableCell className="sticky left-0 z-20 w-[70px] min-w-[70px] bg-white">{emp.id}</TableCell>
                  <TableCell className="sticky left-[70px] z-20 min-w-[220px] bg-white font-medium">{emp.name}</TableCell>
                  <TableCell>{formatCurrency(emp.monthlySalary)}</TableCell>
                  <TableCell>{formatCurrency(emp.dailySalary)}</TableCell>
                  <TableCell>{emp.workingDays}</TableCell>
                  <TableCell>{emp.weeklyOff}</TableCell>
                  <TableCell>{emp.totalAttendance}</TableCell>
                  <TableCell>{emp.allowedLeaves}</TableCell>
                  <TableCell className="text-green-600 font-semibold">{formatCurrency(emp.casualLeavePay)}</TableCell>
                  <TableCell>{emp.leavesTaken}</TableCell>
                  <TableCell className="text-green-600 font-semibold">{formatCurrency(emp.bonus)}</TableCell>
                  <TableCell className="text-green-600 font-semibold">{formatCurrency(emp.weeklyOffPay)}</TableCell>
                  <TableCell>{emp.laborHoliday || 0}</TableCell>
                  <TableCell className="text-green-600 font-semibold">{formatCurrency(emp.laborHolidayPay)}</TableCell>
                  <TableCell className="text-blue-600 font-semibold">{formatCurrency(emp.commission)}</TableCell>
                  <TableCell className="text-blue-600 font-semibold">{formatCurrency(emp.wholesale)}</TableCell>
                  <TableCell className="text-green-600 font-semibold">{formatCurrency(emp.teaCost)}</TableCell>
                  <TableCell className="text-green-600 font-semibold">{formatCurrency(emp.lunchBoxCost)}</TableCell>
                  <TableCell className="text-red-600 font-semibold">{formatCurrency(emp.leaveDeduction)}</TableCell>
                  <TableCell className="text-orange-600 font-semibold">{formatCurrency(emp.monthlyAdvance)}</TableCell>
                  <TableCell className="text-orange-600 font-semibold">{formatCurrency(emp.clothTaken)}</TableCell>
                  <TableCell className="text-orange-600 font-semibold">{formatCurrency(emp.additionalAdvance)}</TableCell>
                  <TableCell className="text-orange-600 font-semibold">{formatCurrency(emp.ob)}</TableCell>
                  <TableCell className="text-orange-600 font-semibold">{formatCurrency(emp.previousOutstanding || 0)}</TableCell>
                  <TableCell className="text-red-600 font-semibold">{formatCurrency(emp.monthLess)}</TableCell>
                  <TableCell className="text-orange-600 font-semibold">{formatCurrency(emp.remainingOutstanding)}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-700">{formatCurrency(emp.finalSalary)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      
  </Card>
);
}