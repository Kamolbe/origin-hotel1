import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salaryDues } from '../src/services/payroll.ts';
const employee={id:'e1',name:'Test',isActive:true,startDate:'2026-01-20',payday:31};
test('paydays clamp to February, skip pre-employment dates and retain unpaid previous months',()=>{
  const due=salaryDues([employee],[],'2026-02-28');
  assert.deepEqual(due.map(item=>item.dueDate),['2026-01-31','2026-02-28']);
  assert.equal(due[0].overdue,true);assert.equal(due[1].overdue,false);
  assert.deepEqual(salaryDues([{...employee,payday:10}],[],'2026-02-10').map(item=>item.period),['2026-02']);
});
test('paid months, inactive employees and future starts never generate reminders',()=>{
  assert.equal(salaryDues([employee],[{employeeId:'e1',period:'2026-01'}],'2026-02-01').length,0);
  assert.equal(salaryDues([{...employee,isActive:false}],[],'2026-12-01').length,0);
  assert.equal(salaryDues([{...employee,startDate:'2027-01-01'}],[],'2026-12-01').length,0);
});
