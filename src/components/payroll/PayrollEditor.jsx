import { useEffect, useState } from "react";
import { mergeEmployees } from "@/utils/mergeEmployees";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PayrollEditor({
  attendanceData,
  setEmployees,
  settings,
  onClose,
}) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(
      attendanceData.map((emp) => ({
        id: emp.id,
        name: emp.name,

        workingDays: emp.workingDays,
        weeklyOff: emp.weeklyOff,
        leavesTaken: emp.leavesTaken,

        monthlySalary: "",
        commission: 0,
        lunchBoxAllowed: false,

        monthlyAdvance: 0,
        clothTaken: 0,
        additionalAdvance: 0,
        monthLess: 0,
        wholesale: 0,

        previousOutstanding: 0,
      }))
    );
  }, [attendanceData]);

  const updateValue = (index, field, value) => {
    const updated = [...rows];

    updated[index][field] = value;

    setRows(updated);
  };

 const handleSave = async () => {
  if (saving) return;

  try {
    setSaving(true);

    // 1. Merge attendance + manually entered payroll data
    const result = mergeEmployees(
      attendanceData,
      rows
    );

    if (result.missingPayroll.length > 0) {
      alert(
        `Missing Payroll for Employee IDs:\n\n${result.missingPayroll.join(", ")}`
      );
      return;
    }

    // 2. Prepare database payload
    const employeesForDatabase = result.employees.map((employee) => ({
      id: String(employee.id).trim(),
      name: String(employee.name ?? "").trim(),

      additionalAdvance:
        Number(employee.additionalAdvance) || 0,

      monthLess:
        Number(employee.monthLess) || 0,
    }));

    // 3. Save to backend
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/payroll/month`,
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
                  {row.workingDays}
                </td>

                <td className="border p-2">
                  {row.weeklyOff}
                </td>

                <td className="border p-2">
                  {row.leavesTaken}
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