import { getSlaStatus } from "./sla.js";

export const ticketCode = (number) => `TKT-${String(number).padStart(4, '0')}`;

export function withSla(ticket, now = new Date() ){
    return {...ticket, code: ticketCode(ticket.number), sla: getSlaStatus(ticket, now) };
}