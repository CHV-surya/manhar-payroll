import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMonthDetails } from "@/utils/calendar";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PayrollSettings({
  settings,
  setSettings,
  highlightMonth = false,
  onClearHighlight,
}) {

  // ✅ MUST be inside the component
  const monthInfo = getMonthDetails(
    settings.month,
    settings.year
  );

  return (
    <Card className="p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Manhar payroll
        </h2>

        <p className="text-gray-500 mt-1">
          Configure payroll settings before uploading the employee file.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>
              Month
            </Label>
            {highlightMonth && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded shadow-xs animate-pulse">
                Select Recommended Month
              </span>
            )}
          </div>

          <Select
            value={months[settings.month]}
            onValueChange={(value) => {
              if (highlightMonth && onClearHighlight) {
                onClearHighlight();
              }
              setSettings({
                ...settings,
                month: months.indexOf(value),
              });
            }}
          >
            <SelectTrigger
              id="payroll-month-select-trigger"
              onClick={() => {
                if (highlightMonth && onClearHighlight) {
                  onClearHighlight();
                }
              }}
              className={cn(
                "w-full",
                highlightMonth &&
                  "ring-2 ring-amber-500 ring-offset-2 border-amber-500 shadow-md transition-all duration-300"
              )}
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {months.map((month) => (
                <SelectItem
                  key={month}
                  value={month}
                >
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">
            Year
          </Label>

          <Input
            type="number"
            value={settings.year}
            onChange={(e) =>
              setSettings({
                ...settings,
                year: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <Label className="mb-2 block">
            Allowed Leaves
          </Label>

          <Input
            type="number"
            value={settings.allowedLeaves}
            onChange={(e) =>
              setSettings({
                ...settings,
                allowedLeaves: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <Label className="mb-2 block">
            Tea Cost (₹)
          </Label>

          <Input
            type="number"
            value={settings.teaCost}
            onChange={(e) =>
              setSettings({
                ...settings,
                teaCost: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <Label className="mb-2 block">
            Box Cost (₹)
          </Label>

          <Input
            type="number"
            value={settings.boxCost}
            onChange={(e) =>
              setSettings({
                ...settings,
                boxCost: Number(e.target.value),
              })
            }
          />
        </div>

      </div>

      <div className="mt-8 border rounded-lg bg-slate-50 p-5">

        <h3 className="font-semibold text-lg mb-4">
          Calendar Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="rounded-lg bg-white p-4 border">
            <p className="text-sm text-gray-500">
              Days in Month
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {monthInfo.totalDays}
            </h2>
          </div>

          <div className="rounded-lg bg-white p-4 border">
            <p className="text-sm text-gray-500">
              Tuesdays
            </p>

            <h2 className="text-2xl font-bold mt-2 text-red-600">
              {monthInfo.tuesdays}
            </h2>
          </div>

          <div className="rounded-lg bg-white p-4 border">
            <p className="text-sm text-gray-500">
              Maximum Working Days
            </p>

            <h2 className="text-2xl font-bold mt-2 text-emerald-600">
              {monthInfo.maximumWorkingDays}
            </h2>
          </div>

        </div>

      </div>

    </Card>
  );
}