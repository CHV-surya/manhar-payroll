import { useEffect, useState } from "react";

import Header from "./components/layout/Header";
import PayrollSettings from "./components/payroll/PayrollSettings";
import UploadSection from "./components/payroll/UploadSection";
import SummaryCards from "./components/payroll/SummaryCards";
import EmployeeTable from "./components/payroll/EmployeeTable";

import { processPayroll } from "./utils/processPayroll";
import { calculateSummary } from "./utils/summary";

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
          `${import.meta.env.VITE_API_URL}/api/payroll/month?year=${settings.year}&month=${dbMonth}`
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

            remainingOutstanding:
              Number(employee.remainingOutstanding) || 0,

            /*
             * Defaults required by the existing payroll
             * calculation/UI.
             */
            workingDays: 0,
            weeklyOff: 0,
            leavesTaken: 0,

            monthlySalary: 0,
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
        />

        {loadingEmployees && (
          <div className="text-sm text-gray-500">
            Loading saved payroll...
          </div>
        )}

        <UploadSection
          setEmployees={setEmployees}
          settings={settings}
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