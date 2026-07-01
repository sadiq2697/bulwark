export function parseHM(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function isWithinWindow(schedule, date = new Date()) {
  if (!schedule || !schedule.enabled) return false;
  if (!schedule.days.includes(date.getDay())) return false;
  const now = date.getHours() * 60 + date.getMinutes();
  return now >= parseHM(schedule.start) && now < parseHM(schedule.end);
}
