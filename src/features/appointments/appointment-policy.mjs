// Pure appointment policy shared by API checks and Node's built-in test runner.
export const transitions = Object.freeze({
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "COMPLETED", "NO_SHOW"],
  CANCELLED: [], REJECTED: [], COMPLETED: [], NO_SHOW: [],
});

export function canTransition(role, userId, appointment, next) {
  if (!appointment || !Object.hasOwn(transitions, appointment.status)) return false;
  if (!transitions[appointment.status].includes(next)) return false;
  if (role === "PATIENT") return appointment.patient_id === userId && next === "CANCELLED";
  if (role === "DOCTOR") return appointment.doctor_id === userId &&
    ["CONFIRMED", "REJECTED", "COMPLETED", "NO_SHOW"].includes(next);
  return role === "ADMIN";
}

export function isValidInterval(start, end, now = Date.now()) {
  const a = new Date(start).getTime(), b = new Date(end).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && a > now && b > a;
}
