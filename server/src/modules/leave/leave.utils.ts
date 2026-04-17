export function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  let days = 0;
  
  if (start > end) return 0;
  
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sun, 6=Sat
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function hasOverlap(newStart: string, newEnd: string, existingStart: string, existingEnd: string): boolean {
  const ns = new Date(newStart).getTime();
  const ne = new Date(newEnd).getTime();
  const es = new Date(existingStart).getTime();
  const ee = new Date(existingEnd).getTime();
  return ns <= ee && ne >= es;
}
