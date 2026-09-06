/** Formats a local date as D-M-YY, the format required by the inventory APIs. */
export function getApiDate(date = new Date()): string {
  return `${date.getDate()}-${date.getMonth() + 1}-${String(date.getFullYear()).slice(-2)}`
}
