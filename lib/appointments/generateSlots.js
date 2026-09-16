function minutesFromTime(time) {
    if (!time) return 0;
  
    const [hours, minutes] = String(time)
      .slice(0, 5)
      .split(":")
      .map(Number);
  
    return hours * 60 + minutes;
  }
  
  function timeFromMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
  
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }
  
  export function generateSlots({
    startTime,
    endTime,
    slotMinutes = 60,
    occupied = [],
  }) {
    if (!startTime || !endTime) {
      return [];
    }
  
    const opening = minutesFromTime(startTime);
    const closing = minutesFromTime(endTime);
    const duration = Math.max(15, Number(slotMinutes) || 60);
  
    if (opening >= closing) {
      return [];
    }
  
    const slots = [];
  
    for (
      let cursor = opening;
      cursor + duration <= closing;
      cursor += duration
    ) {
      const start = timeFromMinutes(cursor);
      const end = timeFromMinutes(cursor + duration);
  
      const conflict = occupied.some((item) => {
        const occupiedStart = minutesFromTime(item.start);
        const occupiedEnd = minutesFromTime(item.end);
  
        return cursor < occupiedEnd && cursor + duration > occupiedStart;
      });
  
      slots.push({
        start,
        end,
        available: !conflict,
      });
    }
  
    return slots;
  }
  