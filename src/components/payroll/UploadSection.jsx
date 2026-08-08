import { useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadPayrollTemplate } from "@/utils/downloadPayrollTemplate";
import PayrollEditor from "@/components/payroll/PayrollEditor";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Download,
  Pencil,
} from "lucide-react";
import { parsePayrollFile } from "@/utils/payrollParser";
import { mergeEmployees } from "@/utils/mergeEmployees";
import { parseAttendanceFile } from "@/utils/attendanceParser";

export default function UploadSection({
  setEmployees,
  settings,
}) {
  const attendanceInputRef = useRef(null);
  const payrollInputRef = useRef(null);

  const [attendanceFile, setAttendanceFile] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  const [payrollFile, setPayrollFile] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const chooseAttendance = () => {
    attendanceInputRef.current.click();
  };

  const choosePayroll = () => {
    payrollInputRef.current.click();
  };

  const handleAttendanceUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const result = await parseAttendanceFile(file);

      setAttendanceFile(file);
      setAttendanceData(result.employees);
      setAttendanceSummary(result.summary);
      setPayrollFile(null);
      setEmployees([]);

      alert(
        `Attendance imported successfully.\nEmployees: ${result.summary.totalEmployees}`
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }

    e.target.value = "";
  };
  const handlePayrollUpload = async (e) => {
  const file = e.target.files[0];
  if (attendanceData.length === 0) {
    alert("Upload Attendance first.");
    return;
}

  if (!file) return;

  try {
    const payrollEmployees =
      await parsePayrollFile(file);

    setPayrollFile(file);

    const result = mergeEmployees(
      attendanceData,
      payrollEmployees
    );

    if (result.missingPayroll.length > 0) {
      alert(
        `Payroll missing for Employee IDs:\n\n${result.missingPayroll.join(", ")}`
      );
    }

    setEmployees(result.employees);

    alert(
      `Payroll imported successfully.\nMerged Employees: ${result.employees.length}`
    );
  } catch (err) {
    console.error(err);
    alert(err.message);
  }

  e.target.value = "";
};
    return (
    <Card className="p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Employee Data
          </h2>

          <p className="text-gray-500 mt-1">
            Upload the Attendance Export first. Then continue with Payroll.
          </p>
        </div>
      </div>

      <div className="mt-8 border-2 border-dashed border-emerald-300 rounded-xl p-10">

        <div className="flex flex-col items-center text-center">

          <Upload
            className="text-emerald-600"
            size={48}
          />

          <h3 className="text-xl font-semibold mt-4">
            Step 1 • Attendance Import
          </h3>

          <p className="text-gray-500 mt-2">
            Upload Attendance Export (.xls / .xlsx)
          </p>

          <Button
            className="mt-6"
            onClick={chooseAttendance}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Choose Attendance Excel
          </Button>

          <input
            ref={attendanceInputRef}
            hidden
            type="file"
            accept=".xls,.xlsx"
            onChange={handleAttendanceUpload}
          />

          {attendanceFile && (
            <>
              <div className="mt-5 flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle size={18} />
                {attendanceFile.name}
              </div>

              <p className="text-sm text-gray-600 mt-2">
                Employees Imported :
                {" "}
                {attendanceSummary?.totalEmployees}
              </p>
            </>
          )}

        </div>

        {attendanceData.length > 0 && (
          <div className="mt-10 border-t pt-8">

            <h3 className="text-xl font-semibold mb-2">
              Step 2 • Payroll
            </h3>

            <p className="text-gray-500 mb-6">
              Choose one of the following options.
            </p>

            <div className="grid md:grid-cols-3 gap-4">

              <Button
                  variant="outline"
                  className="h-24 flex flex-col"
                  onClick={() =>
                  downloadPayrollTemplate(attendanceData,attendanceSummary)
                      }
                >
                <Download className="mb-2" />
                Download Payroll Template
              </Button>

              <div>
                <Button
                  className="w-full h-24 flex flex-col"
                  onClick={choosePayroll}
                >
                  <FileSpreadsheet className="mb-2" />
                  Upload Payroll Excel
                </Button>

                <input
                  ref={payrollInputRef}
                  hidden
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handlePayrollUpload}
                />

                {payrollFile && (
                  <div className="mt-3 flex justify-center items-center gap-2 text-green-600">
                    <CheckCircle size={18} />
                    {payrollFile.name}
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                className="h-24 flex flex-col"
                onClick={() => setShowEditor(true)}
              >
                <Pencil className="mb-2" />
                Edit Payroll Here
              </Button>

            </div>

          </div>
        )}

      </div>
      {showEditor && (
  <PayrollEditor
    attendanceData={attendanceData}
    setEmployees={setEmployees}
    onClose={() => setShowEditor(false)}
/>
)}
    </Card>
  );
}