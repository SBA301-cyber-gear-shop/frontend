export {
  CustomerWarranty,
  WarrantyIntake,
  TechnicianWorkbench,
} from "./components/LiveSwitch";
export { createTicket } from "./domain";
export { transitionTicket } from "./domain";
export { warrantyRemainingText } from "./domain/requests";
export { TICKET_STATUS } from "./constants";
export type * from "./types/warranty.types";
