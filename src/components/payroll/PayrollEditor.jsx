import { useEffect, useState } from "react";
import { mergeEmployees } from "@/utils/mergeEmployees";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PayrollEditor({
  attendanceData,
  setEmployees,
  onClose,
}) {
  const [rows, setRows] = useState([]);

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

  return (
    <Card className="mt-8 p-6">

      <div className="flex justify-between items-center mb-6">

  <h2 className="text-2xl font-bold">
    Payroll Editor
  </h2>

  <div className="flex gap-3">

    <Button
      onClick={() => {
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

        setEmployees(result.employees);

        alert("Payroll saved successfully.");

        onClose();
      }}
    >
      Save Payroll
    </Button>

    <Button
      variant="outline"
      onClick={onClose}
    >
      Close
    </Button>

  </div>

</div>

      <div className="overflow-x-auto">

        <table className="min-w-full border">

          <thead className="bg-gray-100">

<tr>

<th className="border p-2">ID</th>

<th className="border p-2">Name</th>

<th className="border p-2">Working Days</th>

<th className="border p-2">Weekly Off</th>

<th className="border p-2">Leaves</th>

<th className="border p-2">Salary</th>

<th className="border p-2">Commission</th>

<th className="border p-2">Lunch</th>

<th className="border p-2">Advance</th>

<th className="border p-2">Cloth</th>

<th className="border p-2">Additional</th>

<th className="border p-2">Month Less</th>

<th className="border p-2">Wholesale</th>

</tr>

</thead>

          <tbody>

            {rows.map((row, index) => (

              <tr key={row.id}>

<td className="border p-2">{row.id}</td>

<td className="border p-2">{row.name}</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.workingDays}
onChange={(e)=>
updateValue(index,"workingDays",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.weeklyOff}
onChange={(e)=>
updateValue(index,"weeklyOff",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.leavesTaken}
onChange={(e)=>
updateValue(index,"leavesTaken",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-24"
type="number"
value={row.monthlySalary}
onChange={(e)=>
updateValue(index,"monthlySalary",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.commission}
onChange={(e)=>
updateValue(index,"commission",Number(e.target.value))
}
/>
</td>

<td className="border p-2 text-center">
<input
type="checkbox"
checked={row.lunchBoxAllowed}
onChange={(e)=>
updateValue(index,"lunchBoxAllowed",e.target.checked)
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.monthlyAdvance}
onChange={(e)=>
updateValue(index,"monthlyAdvance",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.clothTaken}
onChange={(e)=>
updateValue(index,"clothTaken",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.additionalAdvance}
onChange={(e)=>
updateValue(index,"additionalAdvance",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.monthLess}
onChange={(e)=>
updateValue(index,"monthLess",Number(e.target.value))
}
/>
</td>

<td className="border p-2">
<input
className="border rounded p-1 w-20"
type="number"
value={row.wholesale}
onChange={(e)=>
updateValue(index,"wholesale",Number(e.target.value))
}
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