function toMinutes(time) {
    if (!time) return 0;
  
    const [hours, minutes] = String(time)
      .slice(0, 5)
      .split(":")
      .map(Number);
  
    return hours * 60 + minutes;
  }
  
  function toTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
  
    return `${String(hours).padStart(2, "0")}:${String(
      mins
    ).padStart(2, "0")}`;
  }
  
  export function intersectAvailability({
    companyStart,
    companyEnd,
    staffStart,
    staffEnd,
  }) {
    const start = Math.max(
      toMinutes(companyStart),
      toMinutes(staffStart)
    );
  
    const end = Math.min(
      toMinutes(companyEnd),
      toMinutes(staffEnd)
    );
  
    if (start >= end) return null;
  
    return {
      start: toTime(start),
      end: toTime(end),
    };
  }
  