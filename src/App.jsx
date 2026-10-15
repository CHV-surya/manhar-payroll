import { useEffect, useState } from "react";

import Header from "./components/layout/Header";
import PayrollSettings from "./components/payroll/PayrollSettings";
import UploadSection from "./components/payroll/UploadSection";
import SummaryCards from "./components/payroll/SummaryCards";
import EmployeeTable from "./components/payroll/EmployeeTable";

import { processPayroll } from "./utils/processPayroll";
import { calculateSummary } from "./utils/summary";
import PayrollMonthWarningDialog from "./components/payroll/PayrollMonthWarningDialog";
import {
  isPayrollMonthWarningActive,
  getPayrollMonthRecommendation,
} from "./utils/monthWarning";

const API_BASE = import.meta.env.VITE_API_URL || "";

function App() {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [settings, setSettings] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    allowedLeaves: 2,
    teaCost: 8,
    boxCost: 25,
  });

  const [showMonthWarning, setShowMonthWarning] = useState(() => {
    return isPayrollMonthWarningActive();
  });
  const [highlightMonth, setHighlightMonth] = useState(false);
  const [onProceedAfterWarning, setOnProceedAfterWarning] = useState(null);

  const handleContinueWarning = () => {
    setShowMonthWarning(false);
    if (onProceedAfterWarning) {
      const proceed = onProceedAfterWarning;
      setOnProceedAfterWarning(null);
      proceed();
    }
  };

  const handleOkWarning = () => {
    setShowMonthWarning(false);
    setOnProceedAfterWarning(null);
    setHighlightMonth(true);

    setTimeout(() => {
      const el = document.getElementById("payroll-month-select-trigger");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }, 100);

    setTimeout(() => {
      setHighlightMonth(false);
    }, 12000);
  };

  const handleBeforeAttendanceUpload = (proceedCallback) => {
    const isWarningActive = isPayrollMonthWarningActive();
    const recommendation = getPayrollMonthRecommendation(
      new Date(),
      settings.month,
      settings.year
    );

    const isRecommendedMonthSelected =
      settings.month === recommendation.prevMonthIndex &&
      settings.year === recommendation.prevYear;

    if (isWarningActive && !isRecommendedMonthSelected) {
      setOnProceedAfterWarning(() => proceedCallback);
      setShowMonthWarning(true);
      return true;
    }

    return false;
  };

  /*
   * Load saved payroll whenever month/year changes.
   */
  useEffect(() => {
    const loadPayroll = async () => {
      try {
        setLoadingEmployees(true);

        /*
         * Frontend month is 0-based.
         * Database month is 1-based.
         */
        const dbMonth = settings.month + 1;

        const response = await fetch(
          `${API_BASE}/api/payroll/month?year=${settings.year}&month=${dbMonth}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load payroll."
          );
        }

        /*
         * The GET endpoint only contains outstanding fields.
         * We merge them into the employee data already expected
         * by the payroll UI.
         */
        const databaseEmployees = data.employees.map(
          (employee) => ({
            id: employee.employeeId,
            name: employee.name,

            additionalAdvance:
              Number(employee.additionalAdvance) || 0,

            monthLess:
              Number(employee.monthLess) || 0,

            previousOutstanding:
              Number(employee.previousOutstanding) || 0,

            previousAdditionalAdvance:
              Number(employee.previousAdditionalAdvance) || 0,

            previousOb:
              Number(employee.previousOb) || 0,

            previousMonthLess:
              Number(employee.previousMonthLess) || 0,

            remainingOutstanding:
              Number(employee.remainingOutstanding) || 0,

            nextMonthRemainingOutstanding:
              employee.nextMonthRemainingOutstanding,

            laborHoliday:
              Number(employee.laborHoliday) || 0,

            ob:
              Number(employee.ob) || 0,

            /*
             * Defaults required by the existing payroll
             * calculation/UI.
             */
            workingDays: 0,
            weeklyOff: 0,
            leavesTaken: 0,

            monthlySalary:
              Number(employee.salary) || 0,
            commission: 0,
            lunchBoxAllowed: false,

            monthlyAdvance: 0,
            clothTaken: 0,
            wholesale: 0,
          })
        );

        console.log(
          "DATABASE EMPLOYEES LOADED:",
          databaseEmployees
        );

        setEmployees(databaseEmployees);

      } catch (error) {
        console.error(
          "Failed to load payroll:",
          error
        );

        setEmployees([]);

      } finally {
        setLoadingEmployees(false);
      }
    };

    loadPayroll();
  }, [settings.month, settings.year]);

  const processedEmployees = processPayroll(
    employees,
    settings
  );

  console.log(
    "PROCESSED EMPLOYEES:",
    processedEmployees
  );

  const summary = calculateSummary(
    processedEmployees
  );

  return (
    <div>

      <main className="max-w-screen-2xl mx-auto p-6 space-y-6">

        <PayrollSettings
          settings={settings}
          setSettings={setSettings}
          highlightMonth={highlightMonth}
          onClearHighlight={() => setHighlightMonth(false)}
        />

        <PayrollMonthWarningDialog
          open={showMonthWarning}
          onOpenChange={(open) => {
            setShowMonthWarning(open);
            if (!open) {
              setOnProceedAfterWarning(null);
            }
          }}
          onContinue={handleContinueWarning}
          onOk={handleOkWarning}
          selectedMonth={settings.month}
          selectedYear={settings.year}
        />

        {loadingEmployees && (
          <div className="text-sm text-gray-500">
            Loading saved payroll...
          </div>
        )}

        <UploadSection
          setEmployees={setEmployees}
          settings={settings}
          onBeforeAttendanceUpload={handleBeforeAttendanceUpload}
        />

        <SummaryCards
          summary={summary}
        />

        <EmployeeTable
          employees={processedEmployees}
          settings={settings}
        />

      </main>

    </div>
  );
}

export default App;