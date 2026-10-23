export { money, dateTime } from "./formatters";
export const delay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export { demoMode } from "./runtime";
