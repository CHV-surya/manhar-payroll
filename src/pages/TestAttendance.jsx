import { useState } from "react";
import { parseAttendanceFile } from "@/utils/attendanceParser";

export default function TestAttendance() {
  const [employees, setEmployees] = useState([]);

  const handleUpload = async (e) => {
    try {
      const file = e.target.files[0];

      if (!file) return;

      const result = await parseAttendanceFile(file);

      console.log(result);

      setEmployees(result.employees);

      alert(
        `Imported ${result.summary.totalEmployees} employees`
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-5">
        Attendance Parser Test
      </h1>

      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={handleUpload}
      />

      <pre className="mt-8 bg-gray-100 p-5 rounded overflow-auto text-xs">
        {JSON.stringify(employees, null, 2)}
      </pre>
    </div>
  );
}