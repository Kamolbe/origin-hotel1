import type { SalaryPayment, StaffMember } from '../types';

/** Monthly payday is clamped to short months; periods before employment are skipped. */
export function salaryDues(employees: StaffMember[], payments: SalaryPayment[], today: string) {
  const paid = new Set(payments.map((payment) => `${payment.employeeId}:${payment.period}`));
  return employees.filter((employee) => employee.isActive).flatMap((employee) => {
    const result: Array<{ employee: StaffMember; period: string; dueDate: string; overdue: boolean }> = [];
    const start = new Date(`${employee.startDate.slice(0, 7)}-01T12:00:00Z`);
    const end = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return result;
    for (let cursor = start; cursor <= end; cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1, 12))) {
      const period = cursor.toISOString().slice(0, 7);
      const lastDay = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
      const dueDate = `${period}-${String(Math.min(employee.payday, lastDay)).padStart(2, '0')}`;
      if (dueDate >= employee.startDate && dueDate <= today && !paid.has(`${employee.id}:${period}`)) result.push({ employee, period, dueDate, overdue: dueDate < today });
    }
    return result;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
