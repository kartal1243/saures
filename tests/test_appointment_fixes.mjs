// Test script for verifying Appointment Engine fixes
import assert from 'node:assert';

// 1. timeToMinutes
function timeToMinutes(timeStr) {
  const [hh, mm] = timeStr.split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

// Logic replica of isStaffAvailable as implemented in appointments.ts
function isStaffAvailable(
  staffId,
  date,
  startMin,
  endMin,
  appointments,
  timeBlocks,
  staffOrList,
  excludeAppointmentId
) {
  const staffObj = Array.isArray(staffOrList)
    ? staffOrList.find((s) => s.id === staffId)
    : (staffOrList || undefined);

  if (staffObj && staffObj.active === false) {
    return false;
  }

  if (staffObj?.offDays && Array.isArray(staffObj.offDays) && staffObj.offDays.length > 0) {
    const [y, m, d] = date.split('-').map(Number);
    const targetDateObj = new Date(y, m - 1, d);
    const dayOfWeek = targetDateObj.getDay();
    if (staffObj.offDays.includes(dayOfWeek)) {
      return false; // Personel bugün izinli
    }
  }

  const staffStartStr = staffObj?.workingHours?.start || staffObj?.workStart;
  const staffEndStr = staffObj?.workingHours?.end || staffObj?.workEnd;
  if (staffStartStr && staffEndStr) {
    const sStartMin = timeToMinutes(staffStartStr);
    const sEndMin = timeToMinutes(staffEndStr);
    if (startMin < sStartMin || endMin > sEndMin) {
      return false;
    }
  }

  const hasBlock = timeBlocks.some((b) => {
    if (b.date !== date) return false;
    const matchesStaff = !b.staffId || b.staffId === 'all' || b.staffId === staffId;
    if (!matchesStaff) return false;
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    return startMin < bEnd && endMin > bStart;
  });
  if (hasBlock) return false;

  const hasApt = appointments.some((a) => {
    if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
    if (a.appointmentDate !== date) return false;
    if (a.status === 'iptal' || a.status === 'arsiv' || a.status === 'gelmedi') return false;

    if (Array.isArray(a.steps) && a.steps.length > 0) {
      return a.steps.some((st) => {
        if (st.staffId !== staffId) return false;
        const stStart = timeToMinutes(st.startTime);
        const stEnd = timeToMinutes(st.endTime);
        return startMin < stEnd && endMin > stStart;
      });
    }

    if (a.staffId && a.staffId !== staffId) return false;
    const aStart = timeToMinutes(a.timeSlot);
    const aEnd = aStart + (a.durationMinutes || 30);
    return startMin < aEnd && endMin > aStart;
  });

  return !hasApt;
}

console.log('--- TEST 1: isStaffAvailable with offDays ---');
const staffAhmet = {
  id: 'staff_ahmet',
  name: 'Ahmet Usta',
  active: true,
  offDays: [2], // 2 = Tuesday
  workStart: '09:00',
  workEnd: '21:00',
  skills: ['Saç', 'Sakal'],
};

// 2026-11-17 is Tuesday
const tuesdayDate = '2026-11-17';
const wednesdayDate = '2026-11-18';

const isAvailableTuesday = isStaffAvailable(
  'staff_ahmet',
  tuesdayDate,
  timeToMinutes('10:00'),
  timeToMinutes('10:30'),
  [],
  [],
  staffAhmet
);
assert.strictEqual(isAvailableTuesday, false, 'Ahmet must NOT be available on Tuesday (his off-day)');
console.log('✓ Passed: Off-day detected and blocked correctly.');

const isAvailableWednesday = isStaffAvailable(
  'staff_ahmet',
  wednesdayDate,
  timeToMinutes('10:00'),
  timeToMinutes('10:30'),
  [],
  [],
  staffAhmet
);
assert.strictEqual(isAvailableWednesday, true, 'Ahmet MUST be available on Wednesday (not an off-day)');
console.log('✓ Passed: Working day allowed correctly.');

console.log('--- TEST 2: isStaffAvailable with custom workingHours ---');
const staffMehmet = {
  id: 'staff_mehmet',
  name: 'Mehmet Usta',
  active: true,
  offDays: [0], // Sunday
  workStart: '13:00',
  workEnd: '20:00',
  skills: ['Saç'],
};

const isMorningSlot = isStaffAvailable(
  'staff_mehmet',
  wednesdayDate,
  timeToMinutes('10:00'),
  timeToMinutes('10:30'),
  [],
  [],
  staffMehmet
);
assert.strictEqual(isMorningSlot, false, 'Mehmet must NOT be available at 10:00 (starts work at 13:00)');
console.log('✓ Passed: Morning slot before shift start blocked correctly.');

const isShiftSlot = isStaffAvailable(
  'staff_mehmet',
  wednesdayDate,
  timeToMinutes('14:00'),
  timeToMinutes('14:30'),
  [],
  [],
  staffMehmet
);
assert.strictEqual(isShiftSlot, true, 'Mehmet MUST be available at 14:00 (within 13:00-20:00)');
console.log('✓ Passed: Slot within staff workingHours allowed correctly.');

console.log('--- TEST 3: Multi-staff Auto Booking with 1 staff in lunch break ---');
// Public auto booking logic test
const allStaff = [
  { id: 's1', name: 'Barber 1', active: true, offDays: [] },
  { id: 's2', name: 'Barber 2', active: true, offDays: [] },
];
const timeBlocks = [
  { date: wednesdayDate, startTime: '13:00', endTime: '14:00', staffId: 's1', reason: 'Lunch' },
];

function isAnyStaffAvailable(candidates, date, startMin, endMin, apts, blocks) {
  return candidates.some((st) => isStaffAvailable(st.id, date, startMin, endMin, apts, blocks, st));
}

const slotAtLunch = isAnyStaffAvailable(
  allStaff,
  wednesdayDate,
  timeToMinutes('13:00'),
  timeToMinutes('13:30'),
  [],
  timeBlocks
);
assert.strictEqual(slotAtLunch, true, 'Auto booking slot MUST be open because Barber 2 is completely free!');
console.log('✓ Passed: Single staff break does NOT lock the entire slot for auto bookings!');

const bothBlocked = isAnyStaffAvailable(
  allStaff,
  wednesdayDate,
  timeToMinutes('13:00'),
  timeToMinutes('13:30'),
  [],
  [
    { date: wednesdayDate, startTime: '13:00', endTime: '14:00', staffId: 's1' },
    { date: wednesdayDate, startTime: '13:00', endTime: '14:00', staffId: 's2' },
  ]
);
assert.strictEqual(bothBlocked, false, 'Auto booking slot MUST be closed when ALL barbers are on break');
console.log('✓ Passed: Slot correctly closes when all barbers are on break.');

console.log('\nALL 3 ALGORITHMIC UNIT TESTS PASSED SUCCESSFULLY! 🎯');
