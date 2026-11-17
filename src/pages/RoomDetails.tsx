import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  Thermometer,
  Wind,
  Droplets,
  Info,
} from "lucide-react";
import { DEMO_DATE, rooms, roomTypeLabels, schedules } from "../data";
import {
  addDays,
  buildingName,
  dateLabel,
  minutes,
  layoutBookings,
  timeLabel,
  weekOf,
} from "../logic";
import type { Schedule } from "../types";
import {
  Badge,
  DemoLabel,
  Empty,
  Field,
  Modal,
  PageHeading,
} from "../components/ui";
export default function RoomDetails() {
  const { roomId } = useParams();
  const [p] = useSearchParams();
  const room = rooms.find((r) => r.id === roomId);
  const [date, setDate] = useState(p.get("scheduleDate") || DEMO_DATE);
  const [range, setRange] = useState({ start: "08:00", end: "22:00" });
  const [applied, setApplied] = useState(range);
  const [refresh, setRefresh] = useState(false);
  const [event, setEvent] = useState<Schedule | null>(null);
  const [info, setInfo] = useState(false);
  const monday = weekOf(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const invalid =
    minutes(range.start) >= minutes(range.end) || !range.start || !range.end;
  const bookings = schedules.filter(
    (s) =>
      s.roomId === roomId &&
      s.date >= monday &&
      s.date <= days[6] &&
      s.status === "CONFIRMED",
  );
  const visible = bookings.filter(
    (s) =>
      minutes(s.end) > minutes(applied.start) &&
      minutes(s.start) < minutes(applied.end),
  );
  const positions = layoutBookings(visible);
  const height = (minutes(applied.end) - minutes(applied.start)) * 1.05;
  if (!room)
    return (
      <Empty
        title="Classroom not found"
        action={
          <Link className="button primary" to="/buildings-rooms">
            Back to Room Directory
          </Link>
        }
      />
    );
  return (
    <>
      <Link
        className="back-link"
        to={`/buildings-rooms${p.get("return") ? "?" + p.get("return") : ""}`}
      >
        <ArrowLeft size={15} />
        Back to Room Directory
      </Link>
      <PageHeading
        eyebrow="CLASSROOM DETAILS"
        title={room.id}
        subtitle={`${buildingName(room.buildingId)} · ${room.floor} · ${roomTypeLabels[room.type]}`}
        actions={<DemoLabel />}
      />
      <div className="room-status-grid">
        {[
          {
            title: "Maximum capacity",
            value: `${room.capacity}`,
            unit: "persons",
            icon: Users,
          },
          {
            title: "Occupancy",
            value: room.occupied ? "Occupied" : "Unoccupied",
            unit: "Simulated sensor · Online",
            icon: Users,
          },
          {
            title: "HVAC status",
            value: `AC ${room.power}`,
            unit: room.power === "ON" ? "Cooling mode" : "Powered off",
            icon: Wind,
          },
          {
            title: "Indoor temperature",
            value: `${room.temperature.toFixed(1)}°C`,
            unit: `Setpoint ${room.setpoint.toFixed(1)}°C`,
            icon: Thermometer,
          },
        ].map((x) => (
          <div className="card status-card" key={x.title}>
            <x.icon size={19} />
            <span>{x.title}</span>
            <strong>{x.value}</strong>
            <small>{x.unit}</small>
          </div>
        ))}
      </div>
      <div className="room-snapshot">
        <span>
          <span className="live-dot" /> Occupancy sensor online
        </span>
        <span>
          <Droplets size={14} />
          Relative humidity {room.humidity}%
        </span>
        <span>Snapshot · 17 Nov 2026, 1:15 PM HKT</span>
        <button className="text-button" onClick={() => setInfo(true)}>
          <Info size={14} />
          About these readings
        </button>
      </div>
      <section className="card calendar-card">
        <div className="card-heading">
          <div>
            <h2>Weekly Booking Schedule</h2>
            <p>Confirmed classes and events for {room.id}</p>
          </div>
          <Badge tone="success">
            <CalendarDays size={12} />
            Read-only calendar
          </Badge>
        </div>
        <div className="calendar-navigation">
          <button
            className="button secondary"
            onClick={() => setDate(addDays(date, -7))}
          >
            <ChevronLeft size={15} />
            Previous week
          </button>
          <strong>
            {dateLabel(monday, { day: "numeric", month: "short" })} –{" "}
            {dateLabel(days[6])}
          </strong>
          <button
            className="button secondary"
            onClick={() => setDate(addDays(date, 7))}
          >
            Next week
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="calendar-controls">
          <Field label="Show Week of">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </Field>
          <Field label="Start Time">
            <input
              type="time"
              value={range.start}
              onChange={(e) => setRange({ ...range, start: e.target.value })}
            />
          </Field>
          <Field label="End Time">
            <input
              type="time"
              value={range.end}
              onChange={(e) => setRange({ ...range, end: e.target.value })}
            />
          </Field>
          <button
            className="button primary"
            disabled={invalid}
            onClick={() => {
              setApplied(range);
              setRefresh(true);
              setTimeout(() => setRefresh(false), 1800);
            }}
          >
            <RefreshCw size={14} />
            {refresh ? "Calendar refreshed" : "Refresh calendar"}
          </button>
        </div>
        {invalid && (
          <p className="error calendar-error">
            Start Time must be earlier than End Time.
          </p>
        )}
        <div className="calendar-scroll">
          <div className="weekly-calendar">
            <div className="calendar-day-head">
              <span>HKT</span>
              {days.map((d, i) => (
                <div className={d === date ? "selected-day" : ""} key={d}>
                  <span>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                  <strong>
                    {dateLabel(d, { day: "numeric", month: "short" })}
                  </strong>
                </div>
              ))}
            </div>
            <div className="calendar-grid" style={{ height: height + 20 }}>
              <div className="time-column">
                {Array.from(
                  {
                    length:
                      Math.ceil(
                        (minutes(applied.end) - minutes(applied.start)) / 60,
                      ) + 1,
                  },
                  (_, i) => {
                    const m = minutes(applied.start) + i * 60;
                    return m <= minutes(applied.end) ? (
                      <span key={m} style={{ top: i * 63 }}>
                        {String(Math.floor(m / 60)).padStart(2, "0")}:
                        {String(m % 60).padStart(2, "0")}
                      </span>
                    ) : null;
                  },
                )}
              </div>
              {days.map((d) => (
                <div
                  className="calendar-day"
                  key={d}
                  style={{ backgroundSize: "100% 31.5px" }}
                >
                  {visible
                    .filter((s) => s.date === d)
                    .map((s) => {
                      const top =
                        (Math.max(minutes(s.start), minutes(applied.start)) -
                          minutes(applied.start)) *
                        1.05;
                      const h =
                        (Math.min(minutes(s.end), minutes(applied.end)) -
                          Math.max(minutes(s.start), minutes(applied.start))) *
                        1.05;
                      const { column, columns } = positions.get(s.id)!;
                      return (
                        <button
                          title={`${s.code} · ${s.name} · ${s.start}–${s.end}`}
                          className="booking-block"
                          key={s.id}
                          style={{
                            top,
                            height: h,
                            width: `calc(${100 / columns}% - 6px)`,
                            left: `calc(${(column * 100) / columns}% + 3px)`,
                          }}
                          onClick={() => setEvent(s)}
                        >
                          <strong>{s.code}</strong>
                          <span>{s.name}</span>
                          <small>
                            {s.start}–{s.end}
                          </small>
                        </button>
                      );
                    })}
                </div>
              ))}
              {!visible.length && (
                <div className="calendar-empty">
                  {bookings.length
                    ? "No bookings in this time range."
                    : "No bookings scheduled for this week."}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="table-footnote">
          <i className="legend-square green" /> Confirmed booking · Illustrative
          timetable · Exact booking times are preserved.
        </div>
      </section>
      {event && (
        <Modal title="Booking details" onClose={() => setEvent(null)}>
          <div className="modal-body">
            <Badge tone="success">Confirmed · Class</Badge>
            <h3>{event.code}</h3>
            <p>{event.name}</p>
            <dl className="detail-grid">
              <div>
                <dt>Room</dt>
                <dd>{room.id}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{dateLabel(event.date)}</dd>
              </div>
              <div>
                <dt>Start time</dt>
                <dd>{timeLabel(event.start)}</dd>
              </div>
              <div>
                <dt>End time</dt>
                <dd>{timeLabel(event.end)}</dd>
              </div>
            </dl>
            <p className="muted">
              Illustrative booking. This is not a verified HKU teaching
              arrangement.
            </p>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={() => setEvent(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {info && (
        <Modal
          title="Understanding this snapshot"
          onClose={() => setInfo(false)}
        >
          <div className="modal-body">
            <p>
              Occupancy is a simulated sensor reading, independent of booking
              status. Indoor temperature is an illustrative reading; the
              setpoint is the configured target, not a measurement.
            </p>
            <p>
              The fixed snapshot is 17 November 2026, 1:15 PM HKT. Changing the
              calendar date does not change the snapshot. No real sensor or HVAC
              system is connected.
            </p>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={() => setInfo(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
