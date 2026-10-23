// When an ADMIN sets a ticket's priority, the SLA clock starts at that moment.

export const DEFAULT_SLA_MINUTES ={
    HIGH: 3 * 60 ,
    MIDEUM: 6 * 60 ,
    LOW: 2 * 24 * 60 ,
};

export const AT_RISK_FRACTION = 0.25; //less than 25% of time allocated

//resolution due date
export function computeSlaDueAt(priority, assignedAt, minutes = DEFAULT_SLA_MINUTES) {
  return new Date(assignedAt.getTime() + minutes[priority] * 60_000);
}

export async function loadSlaMinutes(db){
    const rows = await db.slaPolicy.findMany();
    const minutes = { ...DEFAULT_SLA_MINUTES };
    for (const row of rows) minutes[row.priority] = row.resolutionMinutes;
    return minutes;
}

//Returns - status, remainingMs.

 export function getSlaStatus(ticket, now = new Date()){
    const {priority, priorityAssignedAt, slaDueAt, resolvedAt} = ticket;

    if(!priority || !priorityAssignedAt || !slaDueAt){
        return { status: 'UNTRIAGED', remainingMs: null };
    }

    if(resolvedAt){
        return { status: resolvedAt <= slaDueAt ? 'MET' : 'MISSED', remainingMs: null };
    }

    const remainingMs = slaDueAt.getTime() - now.getTime();
    const totalMs = slaDueAt.getTime() - priorityAssignedAt.getTime();

    if (remainingMs < 0) return { status: 'BREACHED', remainingMs };
    if (remainingMs <= totalMs * AT_RISK_FRACTION) return { status: 'AT_RISK', remainingMs };
    return { status: 'ON_TRACK', remainingMs };
 }