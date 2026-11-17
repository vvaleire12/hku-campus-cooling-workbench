import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  RotateCcw,
  ArrowUpRight,
  Building2,
  ArrowUpDown,
} from "lucide-react";
import { buildings, rooms, roomTypeLabels } from "../data";
import {
  booked,
  bookingsFor,
  buildingName,
  defaultRoomFilters,
  filterRooms,
  type RoomFilters,
} from "../logic";
import { Badge, DemoLabel, Empty, Field, PageHeading } from "../components/ui";
const readFilters = (p: URLSearchParams): RoomFilters => ({
  ...defaultRoomFilters,
  search: p.get("search") || "",
  building: p.get("buildingId") || "ALL",
  floor: p.get("floor") || "ALL",
  date: p.get("scheduleDate") || defaultRoomFilters.date,
  booking: p.get("booking") || "ALL",
  occupancy: p.get("occupancy") || "ALL",
  capacity: p.get("capacity") || "ALL",
  power: p.get("hvacStatus") || "ALL",
  type: p.get("roomType") || "ALL",
});
export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [search, setSearch] = useState(filters.search);
  const [sort, setSort] = useState(false);
  useEffect(() => setSearch(params.get("search") || ""), [params]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get("search") || "")) {
        const next = new URLSearchParams(params);
        if (search) next.set("search", search);
        else next.delete("search");
        setParams(next, { replace: true });
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [search, params, setParams]);
  function update(key: keyof RoomFilters, value: string) {
    const names: Record<string, string> = {
      building: "buildingId",
      date: "scheduleDate",
      power: "hvacStatus",
      type: "roomType",
    };
    const next = new URLSearchParams(params);
    const name = names[key] || key;
    if (value === "ALL" || !value) next.delete(name);
    else next.set(name, value);
    if (key === "building") next.delete("floor");
    setParams(next, { replace: true });
  }
  function reset() {
    const next = new URLSearchParams();
    if (params.get("entry") === "map") {
      next.set("entry", "map");
      if (filters.building !== "ALL") next.set("buildingId", filters.building);
    }
    setSearch("");
    setParams(next, { replace: true });
  }
  const results = filterRooms(rooms, filters).sort((a, b) =>
    sort ? b.capacity - a.capacity : a.id.localeCompare(b.id),
  );
  const floors = [
    ...new Set(
      rooms
        .filter(
          (r) =>
            filters.building === "ALL" || r.buildingId === filters.building,
        )
        .map((r) => r.floor),
    ),
  ].sort();
  return (
    <>
      <PageHeading
        eyebrow="CAMPUS DIRECTORY"
        title="Buildings & Rooms"
        subtitle="Find a classroom. Understand its schedule, comfort and cooling status."
        actions={
          <span className="date-chip">
            <Building2 size={16} />
            {filters.building === "ALL"
              ? "All Buildings"
              : buildingName(filters.building)}
          </span>
        }
      />
      <div className="context-strip">
        <span>
          Room Directory <span className="strip-divider" />
          {results.length} matching classrooms
        </span>
        <DemoLabel />
      </div>
      <section className="card filter-card">
        <div className="filter-heading">
          <h2>Find your space</h2>
          <button className="text-button" onClick={reset}>
            <RotateCcw size={14} />
            Reset filters
          </button>
        </div>
        <div className="room-filters">
          <Field label="Room ID">
            <div className="search-input">
              <Search size={16} />
              <input
                aria-label="Room ID search"
                placeholder="Search Room ID, e.g. MB-201"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Building">
            <select
              value={filters.building}
              onChange={(e) => update("building", e.target.value)}
            >
              <option value="ALL">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} — {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Floor">
            <select
              value={filters.floor}
              onChange={(e) => update("floor", e.target.value)}
            >
              <option value="ALL">All Floors</option>
              {floors.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="Schedule Date">
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                update("date", e.target.value || defaultRoomFilters.date)
              }
            />
          </Field>
        </div>
        <div className="room-filters second">
          <Field label="Booking Status">
            <select
              value={filters.booking}
              onChange={(e) => update("booking", e.target.value)}
            >
              <option value="ALL">All bookings</option>
              <option value="BOOKED">Booked</option>
              <option value="UNBOOKED">Unbooked</option>
            </select>
          </Field>
          <Field label="Occupancy Status">
            <select
              value={filters.occupancy}
              onChange={(e) => update("occupancy", e.target.value)}
            >
              <option value="ALL">All occupancy</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="UNOCCUPIED">Unoccupied</option>
            </select>
          </Field>
          <Field label="Capacity">
            <select
              value={filters.capacity}
              onChange={(e) => update("capacity", e.target.value)}
            >
              <option value="ALL">All capacities</option>
              {["1-30", "31-50", "51-80", "Above 80"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="HVAC Status">
            <select
              value={filters.power}
              onChange={(e) => update("power", e.target.value)}
            >
              <option value="ALL">All HVAC</option>
              <option value="ON">AC ON</option>
              <option value="OFF">AC OFF</option>
            </select>
          </Field>
          <Field label="Room Type">
            <select
              value={filters.type}
              onChange={(e) => update("type", e.target.value)}
            >
              <option value="ALL">All room types</option>
              {Object.entries(roomTypeLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>
      <section className="card room-table-card">
        <div className="card-heading">
          <div>
            <h2>
              Room Directory{" "}
              <span className="count-label">{results.length}</span>
            </h2>
            <p>
              Showing {results.length} of {rooms.length} monitored classrooms
            </p>
          </div>
          <button className="text-button" onClick={() => setSort(!sort)}>
            <ArrowUpDown size={14} />
            {sort ? "Capacity: largest first" : "Sort by capacity"}
          </button>
        </div>
        {results.length ? (
          <div className="table-scroll">
            <table className="room-table">
              <thead>
                <tr>
                  {[
                    "Room ID",
                    "Building",
                    "Floor",
                    "Room Type",
                    "Capacity",
                    "Booking",
                    "Occupancy",
                    "HVAC",
                    "Indoor Temp.",
                    "Setpoint",
                    "Schedule Summary",
                  ].map((t) => (
                    <th key={t}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const bookings = bookingsFor(r.id, filters.date);
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link
                          className="id-link"
                          to={`/buildings-rooms/rooms/${r.id}?${new URLSearchParams({ return: params.toString(), scheduleDate: filters.date })}`}
                        >
                          {r.id}
                          <ArrowUpRight size={13} />
                        </Link>
                      </td>
                      <td title={buildingName(r.buildingId)}>{r.buildingId}</td>
                      <td>{r.floor}</td>
                      <td>{roomTypeLabels[r.type]}</td>
                      <td>{r.capacity}</td>
                      <td>
                        <Badge
                          tone={
                            booked(r.id, filters.date) ? "success" : "neutral"
                          }
                        >
                          {booked(r.id, filters.date) ? "Booked" : "Unbooked"}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={r.occupied ? "success" : "neutral"}>
                          {r.occupied ? "Occupied" : "Unoccupied"}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={r.power === "ON" ? "success" : "neutral"}>
                          AC {r.power}
                        </Badge>
                      </td>
                      <td>{r.temperature.toFixed(1)}°C</td>
                      <td>{r.setpoint.toFixed(1)}°C</td>
                      <td>
                        {bookings.length ? (
                          <>
                            {bookings.length} booking
                            {bookings.length > 1 ? "s" : ""}
                            <small>
                              {bookings
                                .map((s) => `${s.start}–${s.end}`)
                                .join(", ")}
                            </small>
                          </>
                        ) : (
                          "No confirmed bookings"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              filters.building !== "ALL" &&
              !rooms.some((r) => r.buildingId === filters.building)
                ? "No monitored classrooms in this building"
                : "No classrooms match your current filters."
            }
            description="The map includes buildings outside the current illustrative monitoring dataset."
            action={
              <button
                className="button secondary"
                onClick={() => {
                  setParams({});
                  setSearch("");
                }}
              >
                Clear all filters
              </button>
            }
          />
        )}
        <div className="table-footnote">
          Booking is based on the selected date. Occupancy and HVAC are
          simulated snapshots at 1:15 PM HKT, 17 Nov 2026.
        </div>
      </section>
      <div className="quiet-note">
        All room IDs, capacities, schedules and operational readings are
        fictional demonstration data.
      </div>
    </>
  );
}
