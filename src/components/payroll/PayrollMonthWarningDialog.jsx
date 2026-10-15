import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { getPayrollMonthRecommendation } from "@/utils/monthWarning";

/**
 * Date-Based Payroll Month Selection Warning Dialog.
 *
 * Prompts the user during days 1-20 of each month to verify
 * whether they intend to work in the current month or previous month's payroll.
 *
 * - LEFT BUTTON: "Continue" (RED background, white text) -> proceeds with selected month.
 * - RIGHT BUTTON: "OK" (normal application styling) -> directs attention to month selector.
 */
export default function PayrollMonthWarningDialog({
  open,
  onOpenChange,
  onContinue,
  onOk,
  selectedMonth,
  selectedYear,
}) {
  const recommendation = getPayrollMonthRecommendation(
    new Date(),
    selectedMonth,
    selectedYear
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
              <AlertCircle size={22} />
            </div>
            <DialogTitle className="text-lg font-semibold text-left">
              Payroll Month Selection Warning
            </DialogTitle>
          </div>

          <DialogDescription className="text-sm text-muted-foreground pt-3 space-y-2 text-left whitespace-pre-line">
            <span>
              You are currently working in{" "}
              <strong className="text-foreground">
                {recommendation.currentMonthDisplay}
              </strong>
              , but you may be uploading payroll data for{" "}
              <strong className="text-foreground">
                {recommendation.recommendedMonthDisplay}
              </strong>
              .
            </span>
            <span className="block pt-1">
              Please verify that you have selected the correct payroll month
              before proceeding.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-sm my-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground">
              Currently selected month:
            </span>
            <span className="font-semibold text-foreground text-right">
              {recommendation.selectedMonthDisplay}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground">
              Recommended payroll month:
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
              {recommendation.recommendedMonthDisplay}
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 w-full pt-2">
          <Button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium border-0 shadow-sm"
          >
            Continue
          </Button>

          <Button
            type="button"
            onClick={onOk}
            className="w-full sm:w-auto font-medium"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
