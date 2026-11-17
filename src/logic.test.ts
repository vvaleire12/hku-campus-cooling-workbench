import { describe, expect, it } from "vitest";
import { initialState, rooms, schedules } from "./data";
import {
  addDays,
  booked,
  chartData,
  configErrors,
  defaultRoomFilters,
  filterRooms,
  flowMatches,
  overlaps,
  layoutBookings,
  ruleErrors,
  weekOf,
} from "./logic";
import { newRule } from "./data";

describe("shared operating model", () => {
  it("lays transitively overlapping bookings side by side without collision", () => {
    const base = schedules[0];
    const positions = layoutBookings([
      { ...base, id: "A", start: "09:00", end: "11:00" },
      { ...base, id: "B", start: "10:00", end: "12:00" },
      { ...base, id: "C", start: "11:00", end: "13:00" },
    ]);
    expect(positions.get("A")).toEqual({ column: 0, columns: 2 });
    expect(positions.get("B")).toEqual({ column: 1, columns: 2 });
    expect(positions.get("C")).toEqual({ column: 0, columns: 2 });
  });

  it("keeps IDs and every foreign key consistent", () => {
    expect(new Set(rooms.map((r) => r.id)).size).toBe(5);
    expect(new Set(initialState.approvals.map((a) => a.id)).size).toBe(8);
    for (const s of schedules)
      expect(rooms.some((r) => r.id === s.roomId)).toBe(true);
    for (const a of initialState.approvals)
      expect(rooms.some((r) => r.id === a.roomId)).toBe(true);
    expect(
      initialState.approvals.filter((a) => a.status === "PENDING"),
    ).toHaveLength(5);
  });
  it("derives booking independently of the fixed sensor snapshot", () => {
    expect(booked("MB-201", "2026-11-17")).toBe(true);
    expect(booked("MB-201", "2026-11-19")).toBe(false);
    expect(rooms.find((r) => r.id === "MB-201")?.occupied).toBe(false);
    expect(booked("MB-302", "2026-11-17")).toBe(false);
  });
  it("supports normalized identifiers and short flow numbers", () => {
    expect(flowMatches("APR-2026-001", "apr 001")).toBe(true);
    expect(flowMatches("APR-2026-001", "APR-002")).toBe(false);
    expect(
      filterRooms(rooms, { ...defaultRoomFilters, search: "mb201" }).map(
        (r) => r.id,
      ),
    ).toEqual(["MB-201"]);
  });
  it("combines room filters with AND and supports unbooked occupied rooms", () => {
    expect(
      filterRooms(rooms, {
        ...defaultRoomFilters,
        building: "MB",
        occupancy: "UNOCCUPIED",
        power: "ON",
      }),
    ).toHaveLength(2);
    expect(
      filterRooms(rooms, {
        ...defaultRoomFilters,
        building: "MW",
        power: "ON",
      }),
    ).toHaveLength(0);
    expect(
      filterRooms([{ ...rooms[1], occupied: true }], {
        ...defaultRoomFilters,
        booking: "UNBOOKED",
        occupancy: "OCCUPIED",
      }),
    ).toHaveLength(1);
  });
  it("handles week and month/year boundaries in Hong Kong date semantics", () => {
    expect(weekOf("2026-11-22")).toBe("2026-11-16");
    expect(weekOf("2027-01-01")).toBe("2026-12-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("bounds chart counts to the monitored population", () => {
    expect(
      chartData.every(
        (d) => d.scheduled <= rooms.length && d.on <= rooms.length,
      ),
    ).toBe(true);
    expect(chartData.find((d) => d.time === "14:00")?.scheduled).toBe(2);
  });
  it("rejects invalid/overnight schedules and unsupported modes", () => {
    const base = initialState.approvals[0].recommendation;
    expect(configErrors(base)).toEqual({});
    expect(configErrors({ ...base, end: "12:00" })).toHaveProperty("time");
    expect(configErrors({ ...base, mode: "HEATING" })).toHaveProperty("mode");
    expect(configErrors({ ...base, setpoint: 22.3 })).toHaveProperty(
      "setpoint",
    );
    expect(
      configErrors({ ...base, power: "OFF", mode: null, setpoint: null }),
    ).toEqual({});
  });
  it("allows an incomplete draft but requires full validation to activate", () => {
    const r = { ...newRule(), name: "Evening cooling" };
    expect(ruleErrors(r, [], true)).toEqual({});
    expect(ruleErrors(r, [])).toHaveProperty("category");
    expect(
      ruleErrors(
        { ...r, name: "Evening cooling" },
        [{ ...r, id: "RUL-009" }],
        true,
      ),
    ).toHaveProperty("name");
  });
  it("detects actual overlap, excluding adjacent periods", () => {
    const a = initialState.approvals[0].recommendation;
    expect(overlaps(a, { ...a, start: "15:30", end: "17:00" })).toBe(true);
    expect(overlaps(a, { ...a, start: "16:00", end: "17:00" })).toBe(false);
    expect(overlaps(a, { ...a, date: "2026-11-18" })).toBe(false);
  });
});
