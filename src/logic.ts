import { buildings, DEMO_DATE, hvacSeries, rooms, schedules } from "./data";
import type { Configuration, Room, Rule } from "./types";
export const buildingName = (id: string) =>
  buildings.find((b) => b.id === id)?.name || id;
export const roomFor = (id: string) => rooms.find((r) => r.id === id)!;
export const normalize = (s: string) => s.toLowerCase().replace(/[\s-]/g, "");
export const fuzzy = (text: string, query: string) =>
  normalize(text).includes(normalize(query));
export const flowMatches = (id: string, q: string) =>
  fuzzy(id, q) || fuzzy(id.replace(/-\d{4}-/, "-"), q);
export const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
export const bookingsFor = (roomId: string, date: string) =>
  schedules.filter(
    (s) => s.roomId === roomId && s.date === date && s.status === "CONFIRMED",
  );
export const booked = (roomId: string, date: string) =>
  bookingsFor(roomId, date).length > 0;
export const timeLabel = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
export const dateLabel = (
  date: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) =>
  new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(date.length === 10 ? date + "T12:00:00+08:00" : date));
export const timestampLabel = (at: string) =>
  dateLabel(at, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " HKT";
export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function weekOf(date: string) {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  return addDays(date, -((day + 6) % 7));
}
export const chartData = Object.entries(hvacSeries).map(([time, ids]) => ({
  time,
  scheduled: new Set(
    schedules
      .filter(
        (s) =>
          s.date === DEMO_DATE &&
          s.status === "CONFIRMED" &&
          minutes(s.start) <= minutes(time) &&
          minutes(s.end) > minutes(time),
      )
      .map((s) => s.roomId),
  ).size,
  on: ids.length,
}));
export function configErrors(c: Configuration) {
  const errors: Record<string, string> = {};
  if (!c.date) errors.date = "Choose an effective date.";
  if (!c.start || !c.end || minutes(c.end) <= minutes(c.start))
    errors.time =
      "End time must be later than start time. Overnight windows are not supported.";
  if (c.power === "ON" && (!c.mode || c.mode === "HEATING"))
    errors.mode = "Choose a supported operating mode.";
  if (
    c.power === "ON" &&
    (c.setpoint === null ||
      c.setpoint < 18 ||
      c.setpoint > 30 ||
      (c.setpoint * 2) % 1 !== 0)
  )
    errors.setpoint = "Choose 18–30°C in 0.5°C increments.";
  return errors;
}
export function ruleErrors(rule: Rule, existing: Rule[], draft = false) {
  const e: Record<string, string> = {};
  if (rule.name.trim().length < 3 || rule.name.trim().length > 60)
    e.name = "Use 3–60 characters.";
  if (
    existing.some(
      (r) =>
        r.id !== rule.id &&
        r.name.trim().toLowerCase() === rule.name.trim().toLowerCase(),
    )
  )
    e.name = "A rule with this name already exists.";
  if (draft) return e;
  if (!rule.category) e.category = "Select a category.";
  if (rule.description.length > 200) e.description = "Maximum 200 characters.";
  if (
    rule.conditions.some(
      (c) =>
        !Number.isFinite(c.value) ||
        c.value < 0 ||
        (c.type === "ROOM_OCCUPANCY" && c.value > 100) ||
        (c.type === "COMFORT_FEEDBACK" && c.value < 1),
    )
  )
    e.conditions =
      "Check condition thresholds. Occupancy must be 0–100%; feedback requires at least one report.";
  if (
    rule.power === "ON" &&
    (rule.setpoint < 23 || rule.setpoint > 26 || (rule.setpoint * 2) % 1 !== 0)
  )
    e.setpoint = "Standard cooling rules use 23–26°C, in 0.5°C increments.";
  if (
    !rule.relative &&
    (!rule.start || !rule.end || minutes(rule.end) <= minutes(rule.start))
  )
    e.time = "End time must be later than start time.";
  if (rule.relative && (!rule.end || rule.lead < 0 || rule.lead > 180))
    e.time = "Use a lead time of 0–180 minutes and an end time.";
  return e;
}
export function overlaps(a: Configuration, b: Configuration) {
  return (
    a.date === b.date &&
    minutes(a.start) < minutes(b.end) &&
    minutes(a.end) > minutes(b.start)
  );
}
export interface RoomFilters {
  search: string;
  building: string;
  floor: string;
  date: string;
  booking: string;
  occupancy: string;
  capacity: string;
  power: string;
  type: string;
}
export const defaultRoomFilters: RoomFilters = {
  search: "",
  building: "ALL",
  floor: "ALL",
  date: DEMO_DATE,
  booking: "ALL",
  occupancy: "ALL",
  capacity: "ALL",
  power: "ALL",
  type: "ALL",
};
export function filterRooms(data: Room[], f: RoomFilters) {
  return data.filter(
    (r) =>
      fuzzy(r.id, f.search) &&
      (f.building === "ALL" || r.buildingId === f.building) &&
      (f.floor === "ALL" || r.floor === f.floor) &&
      (f.booking === "ALL" ||
        booked(r.id, f.date) === (f.booking === "BOOKED")) &&
      (f.occupancy === "ALL" || r.occupied === (f.occupancy === "OCCUPIED")) &&
      (f.power === "ALL" || r.power === f.power) &&
      (f.type === "ALL" || r.type === f.type) &&
      (f.capacity === "ALL" ||
        (f.capacity === "1-30"
          ? r.capacity <= 30
          : f.capacity === "31-50"
            ? r.capacity >= 31 && r.capacity <= 50
            : f.capacity === "51-80"
              ? r.capacity >= 51 && r.capacity <= 80
              : r.capacity > 80)),
  );
}
export function conditionSummary(r: Rule) {
  if (r.system && r.id === "RUL-001")
    return "Proposed setpoint outside 23–26°C";
  return r.conditions
    .map((c) =>
      c.type === "CLASS_SCHEDULE"
        ? `${c.exists ? "Confirmed class" : "No class"} · ${c.expected.toLowerCase()} expected attendance · ${c.value} min before`
        : c.type === "COMFORT_FEEDBACK"
          ? `${c.value}+ reports · ${c.sentiment === "TOO_COLD" ? "too cold" : "too warm"} · ${c.window} min`
          : `${c.type === "ROOM_OCCUPANCY" ? "Occupancy" : c.type === "INDOOR_TEMPERATURE" ? "Indoor temperature" : "Outdoor temperature"} ${c.operator === "GT" ? ">" : "<"} ${c.value}${c.type === "ROOM_OCCUPANCY" ? "%" : "°C"}`,
    )
    .join(" AND ");
}

// Interval partitioning keeps transitively overlapping events in stable columns.
export function layoutBookings(events: import("./types").Schedule[]) {
  const result = new Map<string, { column: number; columns: number }>();
  const byDay = new Map<string, import("./types").Schedule[]>();
  for (const event of events)
    byDay.set(event.date, [...(byDay.get(event.date) || []), event]);
  for (const day of byDay.values()) {
    const groups: import("./types").Schedule[][] = [];
    let end = -1;
    for (const event of [...day].sort(
      (a, b) =>
        minutes(a.start) - minutes(b.start) || minutes(a.end) - minutes(b.end),
    )) {
      if (minutes(event.start) >= end) groups.push([]);
      groups[groups.length - 1].push(event);
      end = Math.max(end, minutes(event.end));
    }
    for (const group of groups) {
      const ends: number[] = [];
      const assignments = group.map((event) => {
        let column = ends.findIndex((end) => end <= minutes(event.start));
        if (column < 0) column = ends.length;
        ends[column] = minutes(event.end);
        return { id: event.id, column };
      });
      for (const assignment of assignments)
        result.set(assignment.id, {
          column: assignment.column,
          columns: ends.length,
        });
    }
  }
  return result;
}
