export const MONTH_NAMES = [
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

/**
 * Determines whether the payroll month selection warning is active.
 * Active on calendar days 1 through 20, inclusive, of the current local month.
 *
 * @param {Date} [date=new Date()]
 * @returns {boolean}
 */
export function isPayrollMonthWarningActive(date = new Date()) {
  const day = date.getDate();
  return day >= 1 && day <= 20;
}

/**
 * Calculates current and recommended previous calendar month details.
 *
 * @param {Date} [date=new Date()] - Reference date (defaults to current local date)
 * @param {number|null} [selectedMonthIndex=null] - Currently selected payroll month index (0-11)
 * @param {number|null} [selectedYear=null] - Currently selected payroll year
 * @returns {{
 *   isWarningActive: boolean,
 *   currentMonthIndex: number,
 *   currentYear: number,
 *   currentMonthDisplay: string,
 *   prevMonthIndex: number,
 *   prevYear: number,
 *   recommendedMonthDisplay: string,
 *   selectedMonthDisplay: string
 * }}
 */
export function getPayrollMonthRecommendation(
  date = new Date(),
  selectedMonthIndex = null,
  selectedYear = null
) {
  const currentMonthIndex = date.getMonth();
  const currentYear = date.getFullYear();

  let prevMonthIndex = currentMonthIndex - 1;
  let prevYear = currentYear;

  // Handle year boundary (e.g., January -> December of previous year)
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear = currentYear - 1;
  }

  const currentMonthDisplay = `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;
  const recommendedMonthDisplay = `${MONTH_NAMES[prevMonthIndex]} ${prevYear}`;

  const resolvedMonthIndex =
    typeof selectedMonthIndex === "number"
      ? selectedMonthIndex
      : currentMonthIndex;
  const resolvedYear =
    typeof selectedYear === "number" ? selectedYear : currentYear;

  const selectedMonthDisplay = `${MONTH_NAMES[resolvedMonthIndex]} ${resolvedYear}`;

  return {
    isWarningActive: isPayrollMonthWarningActive(date),
    currentMonthIndex,
    currentYear,
    currentMonthDisplay,
    prevMonthIndex,
    prevYear,
    recommendedMonthDisplay,
    selectedMonthDisplay,
  };
}
