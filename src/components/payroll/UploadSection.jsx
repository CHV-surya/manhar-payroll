import { useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { downloadPayrollTemplate } from "@/utils/downloadPayrollTemplate";
import PayrollEditor from "@/components/payroll/PayrollEditor";

import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Download,
  Pencil,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { parsePayrollFile } from "@/utils/payrollParser";
import { mergeEmployees } from "@/utils/mergeEmployees";
import { parseAttendanceFile } from "@/utils/attendanceParser";

const API_BASE = import.meta.env.VITE_API_URL || "";

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

  // Dialog state
  const [dialog, setDialog] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  
  const [replacementData, setReplacementData] = useState(null);

  const showDialog = (type, title, message) => {
    setDialog({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeDialog = () => {
  setDialog((prev) => ({
    ...prev,
    open: false,
  }));
};

  const handlePayrollConflict = (data, result, employeesForDatabase, dbMonth, file = null) => {
    setReplacementData({
      file,
      employees: result.employees,
      employeesForDatabase,
      missingEmployees: data.missingEmployees || [],
      year: settings.year,
      month: dbMonth,
    });

    showDialog(
      "warning",
      `Payroll for ${settings.year}-${String(dbMonth).padStart(2, "0")} Already Exists`,
      `This month already has payroll data.\n\n` +
        `Employees missing from the new upload:\n\n` +
        (
          data.missingEmployees?.length
            ? data.missingEmployees
                .map((employee) => `• ${employee.name} (${employee.id})`)
                .join("\n")
            : "None"
        ) +
        `\n\nUpdating this month may affect later months.`
    );
  };

  const chooseAttendance = () => {
    attendanceInputRef.current?.click();
  };

  const choosePayroll = () => {
    payrollInputRef.current?.click();
  };
  const handleReplacePayroll = async (deleteMissing) => {
  if (!replacementData) {
    return;
  }

  const {
    employeesForDatabase,
    year,
    month,
    file,
  } = replacementData;

  try {
    const response = await fetch(
      `${API_BASE}/api/payroll/month/replace`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          year,
          month,
          employees: employeesForDatabase,
          deleteMissing,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to replace payroll."
      );
    }

    /*
     * The replacement endpoint has successfully
     * updated September and recalculated later months.
     *
     * Fetch the updated month again so the UI
     * displays the actual database values.
     */

    const monthResponse = await fetch(
      `${API_BASE}/api/payroll/month?year=${year}&month=${month}`
    );

    const monthData = await monthResponse.json();

    if (
      !monthResponse.ok ||
      !monthData.success
    ) {
      throw new Error(
        monthData.message ||
          "Payroll updated, but failed to refresh the table."
      );
    }

    /*
     * Convert database records into the format
     * expected by EmployeeTable.
     */

    const updatedEmployees =
      replacementData.employees.map((employee) => {
        const dbEmployee =
          monthData.employees.find(
            (item) =>
              String(item.employeeId).trim() ===
              String(employee.id).trim()
          );

        return {
          ...employee,

          previousOutstanding:
            dbEmployee?.previousOutstanding ?? 0,

          previousAdditionalAdvance:
            dbEmployee?.previousAdditionalAdvance ?? 0,

          previousOb:
            dbEmployee?.previousOb ?? 0,

          previousMonthLess:
            dbEmployee?.previousMonthLess ?? 0,

          remainingOutstanding:
            dbEmployee?.remainingOutstanding ?? 0,

          additionalAdvance:
            dbEmployee?.additionalAdvance ?? 0,

          monthLess:
            dbEmployee?.monthLess ?? 0,
        };
      });

    setEmployees(updatedEmployees);
    setPayrollFile(file);
    setReplacementData(null);

    showDialog(
      "success",
      deleteMissing
        ? "Payroll Replaced Successfully"
        : "Payroll Updated Successfully",
      `Payroll for ${year}-${String(month).padStart(2, "0")} was ${
        deleteMissing
          ? "replaced"
          : "updated"
      } successfully.\n\n` +
        `Employees updated: ${employeesForDatabase.length}\n` +
        `Later months were recalculated.`
    );
  } catch (err) {
    console.error(
      "Payroll replacement error:",
      err
    );

    setReplacementData(null);

    showDialog(
      "error",
      "Payroll Replacement Failed",
      err.message ||
        "Something went wrong while replacing payroll."
    );
  }
};
    const handleAttendanceUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const result = await parseAttendanceFile(file);

      setAttendanceFile(file);
      setAttendanceData(result.employees);
      setAttendanceSummary(result.summary);

      // Reset previous payroll upload
      setPayrollFile(null);
      setEmployees([]);

      showDialog(
        "success",
        "Attendance Imported",
        `Attendance imported successfully.\n\nEmployees: ${result.summary.totalEmployees}`
      );
    } catch (err) {
      console.error("Attendance import error:", err);

      showDialog(
        "error",
        "Attendance Import Failed",
        err.message || "Something went wrong while importing attendance."
      );
    }

    e.target.value = "";
  };

  const handlePayrollUpload = async (e) => {
    const file = e.target.files?.[0];

    if (attendanceData.length === 0) {
      showDialog(
        "error",
        "Upload Required",
        "Please upload attendance data first."
      );

      e.target.value = "";
      return;
    }

    if (!file) return;

    try {
      const payrollEmployees = await parsePayrollFile(file);

      const result = mergeEmployees(
        attendanceData,
        payrollEmployees
      );

      /*
       * If some attendance employees don't exist
       * in the uploaded payroll Excel, inform the user.
       */
      if (result.missingPayroll.length > 0) {
        showDialog(
          "warning",
          "Some Payroll Data Missing",
          `Payroll is missing for:\n\n${result.missingPayroll.join(", ")}`
        );
      }

      /*
       * Frontend month is 0-based.
       * Database/API month is 1-based.
       */
      const dbMonth = settings.month + 1;

      /*
       * Data that will be sent to backend.
       */
      const employeesForDatabase =
        result.employees.map((employee) => ({
          id: String(employee.id).trim(),

          name: String(
            employee.name ?? ""
          ).trim(),

          salary:
            Number(employee.monthlySalary) || 0,

          additionalAdvance:
            Number(employee.additionalAdvance) || 0,

          monthLess:
            Number(employee.monthLess) || 0,
        }));

      const response = await fetch(
  `${API_BASE}/api/payroll/month`,
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      year: settings.year,
      month: dbMonth,
      employees: employeesForDatabase,
    }),
  }
);

      const data = await response.json();

/*
 * Month already exists.
 * STOP here and ask the user what to do.
 * */

      /*
 * Month already exists.
 * STOP here and ask the user what to do.
 */
if (
  response.status === 409 &&
  data.requiresConfirmation
) {
  handlePayrollConflict(data, result, employeesForDatabase, dbMonth, file);
  return;
}

if (!response.ok || !data.success) {
  throw new Error(
    data.message ||
      "Failed to save payroll to database."
  );
}

      console.log(
        "Database payroll response:",
        data
      );

      /*
       * Merge database outstanding values back
       * into the frontend employee objects.
       */
      const databaseEmployees =
        result.employees.map((employee) => {
          const databaseRecord =
            data.employees.find(
              (dbEmployee) =>
                String(
                  dbEmployee.employeeId
                ).trim() ===
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
        });

      console.log(
        "FINAL UPLOAD UI EMPLOYEES:",
        databaseEmployees
      );

      /*
       * This is what the EmployeeTable will receive.
       */
      setEmployees(databaseEmployees);

      setPayrollFile(file);
      if (result.missingPayroll.length > 0) {
  setPendingSuccess({
    title: "Payroll Imported Successfully",
    message:
      `Payroll imported successfully for ${
        settings.year
      }-${String(dbMonth).padStart(2, "0")}.\n\n` +
      `Employees: ${result.employees.length}\n` +
      `Database: Saved successfully`,
  });

  showDialog(
    "warning",
    "Some Payroll Data Missing",
    `Payroll is missing for:\n\n` +
      `${result.missingPayroll.join(", ")}\n\n` +
      `The available employee payroll data was updated successfully.`
  );
} else {
  showDialog(
    "success",
    "Payroll Imported Successfully",
    `Payroll imported successfully for ${
      settings.year
    }-${String(dbMonth).padStart(2, "0")}.\n\n` +
      `Employees: ${result.employees.length}\n` +
      `Database: Saved successfully`
  );
}
    } catch (err) {
      console.error(
        "Payroll import error:",
        err
      );

      showDialog(
        "error",
        "Payroll Import Failed",
        err.message ||
          "Something went wrong while importing payroll."
      );
    }

    e.target.value = "";
  };
    return (
    <>
      <Card className="p-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <FileSpreadsheet className="text-emerald-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Employee Data
            </h2>

            <p className="text-gray-500 mt-1">
              Upload the Attendance Export first. Then continue with Payroll.
            </p>
          </div>
        </div>

        {/* Upload Area */}
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
                  Employees Imported:{" "}
                  {attendanceSummary?.totalEmployees}
                </p>
              </>
            )}

          </div>

          {/* STEP 2 */}
          {attendanceData.length > 0 && (
            <div className="mt-10 border-t pt-8">

              <h3 className="text-xl font-semibold mb-2">
                Step 2 • Payroll
              </h3>

              <p className="text-gray-500 mb-6">
                Choose one of the following options.
              </p>

              <div className="grid md:grid-cols-3 gap-4">

                {/* Download Template */}
                <Button
                  variant="outline"
                  className="h-24 flex flex-col"
                  onClick={() =>
                    downloadPayrollTemplate(
                      attendanceData,
                      attendanceSummary,
                      settings
                    )
                  }
                >
                  <Download className="mb-2" />

                  Download Payroll Template
                </Button>

                {/* Upload Payroll */}
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

                {/* Edit Payroll */}
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

      </Card>

      {/* Payroll Editor */}
      {showEditor && (
        <PayrollEditor
          attendanceData={attendanceData}
          setEmployees={setEmployees}
          settings={settings}
          onClose={() => setShowEditor(false)}
          onConflict={(data, result, employeesForDatabase, dbMonth) => {
            handlePayrollConflict(data, result, employeesForDatabase, dbMonth, null);
            setShowEditor(false);
          }}
        />
      )}

      {/* Result Dialog */}
      <Dialog
  open={dialog.open}
  onOpenChange={(open) =>
    setDialog((prev) => ({
      ...prev,
      open,
    }))
  }
>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <div className="flex items-center gap-3">

        {/* Success */}
        {dialog.type === "success" && (
          <div className="rounded-full bg-emerald-100 p-2">
            <CheckCircle2
              className="text-emerald-600"
              size={22}
            />
          </div>
        )}

        {/* Warning */}
        {dialog.type === "warning" && (
          <div className="rounded-full bg-yellow-100 p-2">
            <AlertCircle
              className="text-yellow-600"
              size={22}
            />
          </div>
        )}

        {/* Error */}
        {dialog.type === "error" && (
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle
              className="text-red-600"
              size={22}
            />
          </div>
        )}

        <DialogTitle>
          {dialog.title}
        </DialogTitle>
      </div>

      <DialogDescription className="whitespace-pre-line pt-3">
        {dialog.message}
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="gap-2">

      {/* EXISTING MONTH WARNING */}
      {dialog.type === "warning" &&
        replacementData && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setReplacementData(null);
                closeDialog();
              }}
            >
              Cancel
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setDialog((prev) => ({
                  ...prev,
                  open: false,
                }));

                handleReplacePayroll(false);
              }}
            >
              Update Existing
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                setDialog((prev) => ({
                  ...prev,
                  open: false,
                }));

                handleReplacePayroll(true);
              }}
            >
              Replace & Delete Missing
            </Button>
          </>
        )}

      {/* NORMAL SUCCESS / ERROR */}
      {(!replacementData ||
        dialog.type !== "warning") && (
        <Button onClick={closeDialog}>
          OK
        </Button>
      )}

    </DialogFooter>
  </DialogContent>
</Dialog>
    </>
  );
}