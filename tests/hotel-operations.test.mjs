import { test } from 'node:test';
import assert from 'node:assert/strict';
import { financeCategories, periodSummary, stayAction, validStayDates } from '../src/services/hotelOperations.ts';

const blank = () => ({ rooms: [{ id:'r1',status:'available',capacity:2 }],bookings:[{id:'b1',roomId:'r1',status:'confirmed',checkIn:'2026-10-29',checkOut:'2026-10-31',adults:2,children:0}],finance:[],guests:[],users:[],notifications:[],auditLog:[],visits:[],settings:{} });
test('check-in/out require staff, record actual times and update room lifecycle once', () => {
  const data = blank(), now = new Date('2026-10-29T09:00:00Z');
  assert.throws(()=>stayAction(data,'b1','check-in','user',now));
  assert.throws(()=>stayAction(data,'b1','check-out','admin',now));
  const checkedIn = stayAction(data,'b1','check-in','manager',now);
  assert.equal(checkedIn.rooms[0].status,'occupied');
  assert.equal(checkedIn.bookings[0].checkedInAt,now.toISOString());
  assert.equal(data.rooms[0].status,'available');
  assert.throws(()=>stayAction(checkedIn,'b1','check-in','admin',now));
  const checkedOut = stayAction(checkedIn,'b1','check-out','manager',new Date('2026-10-30T09:00:00Z'));
  assert.equal(checkedOut.rooms[0].status,'cleaning');assert.equal(checkedOut.bookings[0].status,'completed');
  assert.equal(checkedOut.bookings[0].checkedOutAt,'2026-10-30T09:00:00.000Z');
  assert.throws(()=>stayAction(checkedOut,'b1','check-out','admin',now));
});
test('check-in blocks early arrivals, checkout day, unavailable rooms and competing actual stays',()=>{
  const d=blank();assert.throws(()=>stayAction(d,'b1','check-in','admin',new Date('2026-10-28')));assert.throws(()=>stayAction(d,'b1','check-in','admin',new Date('2026-10-31')));
  for(const status of ['occupied','cleaning','maintenance']){d.rooms[0].status=status;assert.throws(()=>stayAction(d,'b1','check-in','admin',new Date('2026-10-29')));}
  d.rooms[0].status='available';d.bookings.push({...d.bookings[0],id:'b2',checkedInAt:'2026-10-28T09:00:00Z'});assert.throws(()=>stayAction(d,'b1','check-in','admin',new Date('2026-10-29')));
});
test('date validation rejects impossible dates and each finance type has the specified five categories',()=>{
  assert.equal(validStayDates('2026-02-30','2026-03-02'),false);assert.equal(validStayDates('2026-10-29','2026-10-29'),false);assert.equal(validStayDates('2026-10-29','2026-10-30'),true);
  assert.equal(financeCategories.income.length,5);assert.equal(financeCategories.expense.length,5);assert.ok(financeCategories.income.includes('rental'));assert.ok(financeCategories.income.includes('additional_services'));
});
test('reports include final day, exclude checkout day, deduplicate room-days and sum exact period entries',()=>{
  const d=blank();d.bookings.push({...d.bookings[0],id:'legacy-duplicate'});d.finance=[{type:'income',amount:1000,date:'2026-10-29'},{type:'income',amount:500,date:'2026-10-30T09:00:00Z'},{type:'expense',amount:200,date:'2026-10-30'},{type:'income',amount:99999,date:'2026-10-31'}];
  const report=periodSummary(d,'2026-10-29','2026-10-30');assert.equal(report.income,1500);assert.equal(report.expense,200);assert.equal(report.net,1300);assert.equal(report.days,2);assert.equal(report.roomNights,2);assert.equal(report.occupancy,100);
  assert.equal(periodSummary(d,'2026-10-30','2026-10-30').roomNights,1);assert.equal(periodSummary(d,'2026-10-31','2026-10-31').roomNights,0);assert.equal(periodSummary(d,'2026-10-31','2026-10-29').valid,false);
  assert.equal(periodSummary({...d,rooms:[]},'2026-10-29','2026-10-30').occupancy,0);
});
test('actual checkout uses hotel timezone for the last occupied day',()=>{
  const d=blank();d.settings.timeZone='Asia/Tashkent';d.bookings[0].status='completed';d.bookings[0].checkedOutAt='2026-10-29T20:30:00Z';
  assert.equal(periodSummary(d,'2026-10-29','2026-10-30').roomNights,1);
});
test('guest availability uses anonymous busy intervals without other guest bookings', async()=>{
  const { availableRooms } = await import('../src/services/hotelUtils.ts');
  const d=blank();d.bookings=[];d.unavailableStays=[{roomId:'r1',checkIn:'2026-10-29',checkOut:'2026-10-31'}];
  assert.equal(availableRooms(d,'2026-10-30','2026-11-01',1).length,0);
  assert.equal(availableRooms(d,'2026-10-31','2026-11-01',1).length,1);
});
