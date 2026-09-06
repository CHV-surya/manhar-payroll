import { useEffect, useState } from "react";
import { mergeEmployees } from "@/utils/mergeEmployees";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function PayrollEditor({
  attendanceData,
  setEmployees,
  settings,
  onClose,
  onConflict,
}) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    /*
     * Fetch previous-month salary prefill.
     * Then initialize rows with prefilled salary.
     */
    const initRows = async () => {
      let salaryMap = {};
      let existingMap = {};

      try {
        const dbMonth = settings.month + 1;
        
        // Fetch previous-month salary prefill.
        const responsePrefill = await fetch(
          `${API_BASE}/api/payroll/month/salary-prefill?year=${settings.year}&month=${dbMonth}`
        );
        const dataPrefill = await responsePrefill.json();

        if (responsePrefill.ok && dataPrefill.success) {
          salaryMap = dataPrefill.salaryMap || {};
        }

        // Fetch current month existing data to prefill if editing an existing month
        const responseCurrent = await fetch(
          `${API_BASE}/api/payroll/month?year=${settings.year}&month=${dbMonth}`
        );
        const dataCurrent = await responseCurrent.json();
        
        if (responseCurrent.ok && dataCurrent.success && dataCurrent.employees) {
          dataCurrent.employees.forEach(emp => {
             existingMap[emp.employeeId] = emp;
          });
        }
      } catch (err) {
        console.error(
          "Failed to fetch prefill data:",
          err
        );
      }

      let savedAttendance = {};
      try {
        const stored = localStorage.getItem(
          `payroll_attendance_${settings.year}_${dbMonth}`
        );
        if (stored) {
          savedAttendance = JSON.parse(stored);
        }
      } catch (e) {
        console.warn("Failed to read attendance from localStorage:", e);
      }

      setRows(
        attendanceData.map((emp) => {
          const empId = String(emp.id).trim();
          const prefillSalary = salaryMap[empId];
          const existing = existingMap[empId];
          const savedAtt = savedAttendance[empId];

          const workingDays =
            existing && existing.workingDays != null
              ? Number(existing.workingDays)
              : savedAtt && savedAtt.workingDays != null
              ? Number(savedAtt.workingDays)
              : emp.workingDays != null
              ? Number(emp.workingDays)
              : 0;

          const weeklyOff =
            existing && existing.weeklyOff != null
              ? Number(existing.weeklyOff)
              : savedAtt && savedAtt.weeklyOff != null
              ? Number(savedAtt.weeklyOff)
              : emp.weeklyOff != null
              ? Number(emp.weeklyOff)
              : 0;

          const leavesTaken =
            existing && existing.leavesTaken != null
              ? Number(existing.leavesTaken)
              : savedAtt && savedAtt.leavesTaken != null
              ? Number(savedAtt.leavesTaken)
              : emp.leavesTaken != null
              ? Number(emp.leavesTaken)
              : 0;

          return {
            id: emp.id,
            name: emp.name,

            workingDays,
            weeklyOff,
            leavesTaken,

            monthlySalary: existing
              ? existing.salary
              : (prefillSalary != null && prefillSalary > 0
                ? prefillSalary
                : ""),
            commission: 0,
            lunchBoxAllowed: false,

            monthlyAdvance: 0,
            clothTaken: 0,
            additionalAdvance: existing ? Number(existing.additionalAdvance) : 0,
            monthLess: existing ? Number(existing.monthLess) : 0,
            wholesale: 0,
            laborHoliday: existing ? Number(existing.laborHoliday) : 0,
            ob: existing ? Number(existing.ob) : 0,

            previousOutstanding: existing ? Number(existing.previousOutstanding) : 0,
          };
        })
      );
    };

    initRows();
  }, [attendanceData, settings.month, settings.year]);

  const updateValue = (index, field, value) => {
    const updated = [...rows];

    updated[index][field] = value;

    setRows(updated);
  };

 const handleSave = async () => {
  if (saving) return;

  try {
    setSaving(true);

    const normalizedRows = rows.map((r) => ({
      ...r,
      workingDays: Number(r.workingDays) || 0,
      weeklyOff: Number(r.weeklyOff) || 0,
      leavesTaken: Number(r.leavesTaken) || 0,
    }));

    // 1. Merge attendance + manually entered payroll data
    const result = mergeEmployees(
      attendanceData,
      normalizedRows
    );

    if (result.missingPayroll.length > 0) {
      alert(
        `Missing Payroll for Employee IDs:\n\n${result.missingPayroll.join(", ")}`
      );
      return;
    }

    // Persist edited attendance values to in-memory attendanceData and localStorage
    const savedAttendance = {};
    normalizedRows.forEach((row) => {
      const id = String(row.id).trim();
      savedAttendance[id] = {
        workingDays: row.workingDays,
        weeklyOff: row.weeklyOff,
        leavesTaken: row.leavesTaken,
      };

      const att = attendanceData.find(
        (a) => String(a.id).trim() === id
      );
      if (att) {
        att.workingDays = row.workingDays;
        att.weeklyOff = row.weeklyOff;
        att.leavesTaken = row.leavesTaken;
      }
    });

    try {
      localStorage.setItem(
        `payroll_attendance_${settings.year}_${settings.month + 1}`,
        JSON.stringify(savedAttendance)
      );
    } catch (e) {
      console.warn("Failed to persist attendance to localStorage:", e);
    }

    // 2. Prepare database payload
    const employeesForDatabase = result.employees.map((employee) => ({
      id: String(employee.id).trim(),
      name: String(employee.name ?? "").trim(),

      salary:
        Number(employee.monthlySalary) || 0,

      additionalAdvance:
        Number(employee.additionalAdvance) || 0,

      monthLess:
        Number(employee.monthLess) || 0,

      laborHoliday:
        Number(employee.laborHoliday) || 0,

      ob:
        Number(employee.ob) || 0,
    }));

    // 3. Save to backend
    const response = await fetch(
      `${API_BASE}/api/payroll/month`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: settings.year,
          month: settings.month + 1,
          employees: employeesForDatabase,
        }),
      }
    );

    const data = await response.json();

    if (
      response.status === 409 &&
      data.requiresConfirmation
    ) {
      if (typeof onConflict === "function") {
        onConflict(
          data,
          result,
          employeesForDatabase,
          settings.month + 1
        );
        return;
      }
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to save payroll to database."
      );
    }

    console.log(
      "Database payroll response:",
      data
    );

    /*
     * IMPORTANT:
     * Backend is the source of truth for outstanding values.
     *
     * data.employees contains:
     * previousOutstanding
     * remainingOutstanding
     * additionalAdvance
     * monthLess
     */

    const databaseEmployees = result.employees.map(
      (employee) => {
        const databaseRecord =
          data.employees.find(
            (dbEmployee) =>
              String(dbEmployee.employeeId).trim() ===
              String(employee.id).trim()
          );

        return {
          ...employee,

          previousOutstanding:
            databaseRecord?.previousOutstanding ?? 0,

          remainingOutstanding:
            databaseRecord?.remainingOutstanding ?? 0,

          additionalAdvance:
            databaseRecord?.additionalAdvance ?? 0,

          monthLess:
            databaseRecord?.monthLess ?? 0,

          laborHoliday:
            databaseRecord?.laborHoliday ?? 0,

          ob:
            databaseRecord?.ob ?? 0,
        };
      }
    );

    // 4. NOW update UI with backend values
    console.log("FINAL UI EMPLOYEES:", databaseEmployees);
    setEmployees(databaseEmployees);

    alert(
      `Payroll saved successfully.\n\nDatabase records saved: ${data.employees.length}`
    );

    onClose();

  } catch (error) {
    console.error(
      "Payroll database save error:",
      error
    );

    alert(
      `Payroll was not saved to database.\n\n${error.message}`
    );

  } finally {
    setSaving(false);
  }
};

  return (
    <Card className="p-6">

      <div className="flex justify-between items-center mb-6">

        <div>
          <h2 className="text-xl font-bold">
            Edit Payroll
          </h2>

          <p className="text-sm text-gray-500">
            {settings.month + 1}/{settings.year}
          </p>
        </div>

        <div className="flex gap-2">

          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Payroll"}
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Close
          </Button>

        </div>

      </div>

      <div className="overflow-auto max-h-[70vh]">

        <table className="min-w-max w-full border">

          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">
                Working Days
              </th>
              <th className="border p-2">
                Weekly Off
              </th>
              <th className="border p-2">
                Leaves
              </th>
              <th className="border p-2">
                Labor Holiday
              </th>
              <th className="border p-2">
                Salary
              </th>
              <th className="border p-2">
                Commission
              </th>
              <th className="border p-2">
                Monthly Advance
              </th>
              <th className="border p-2">
                Cloth Taken
              </th>
              <th className="border p-2">
                Additional Advance
              </th>
              <th className="border p-2">
                Month Less
              </th>
              <th className="border p-2">
                OB
              </th>
              <th className="border p-2">
                Wholesale
              </th>
            </tr>
          </thead>

          <tbody>

            {rows.map((row, index) => (

              <tr key={row.id}>

                <td className="border p-2">
                  {row.id}
                </td>

                <td className="border p-2">
                  {row.name}
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.workingDays}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "workingDays",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-20"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.weeklyOff}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "weeklyOff",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-20"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.leavesTaken}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "leavesTaken",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-20"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.laborHoliday}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "laborHoliday",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-20"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.monthlySalary}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "monthlySalary",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-28"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.commission}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "commission",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-24"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.monthlyAdvance}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "monthlyAdvance",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-28"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.clothTaken}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "clothTaken",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-24"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.additionalAdvance}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "additionalAdvance",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-28"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.monthLess}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "monthLess",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-24"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.ob}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "ob",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-28"
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={row.wholesale}
                    onChange={(e) =>
                      updateValue(
                        index,
                        "wholesale",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded px-2 py-1 w-24"
                  />
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </Card>
  );
}