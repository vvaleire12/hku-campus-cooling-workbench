import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  DoorOpen,
  Wind,
  ClipboardCheck,
  ArrowUpRight,
  Leaf,
  Zap,
  Info,
  ArrowRight,
  CalendarDays,
  Clock3,
  Sparkles,
} from "lucide-react";
import { rooms, impactScenario, DEMO_DATE } from "../data";
import { buildingName, chartData, dateLabel, timestampLabel } from "../logic";
import { useStore } from "../store";
import {
  Badge,
  CardHeading,
  DemoLabel,
  Modal,
  PageHeading,
} from "../components/ui";
import CampusMap from "../components/Map";
export default function Overview() {
  const navigate = useNavigate();
  const { state } = useStore();
  const [method, setMethod] = useState(false);
  const pending = state.approvals.filter((a) => a.status === "PENDING").length;
  const savings = impactScenario.reduce((sum, x) => sum + x.power * x.hours, 0);
  const recent = [...state.activities]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);
  const kpis = [
    {
      title: "Buildings monitored",
      value: new Set(rooms.map((r) => r.buildingId)).size,
      detail: "Across HKU Main Campus",
      icon: Building2,
      to: "/buildings-rooms",
      tag: "CAMPUS COVERAGE",
    },
    {
      title: "Classrooms monitored",
      value: rooms.length,
      detail: "Connected to the demo dataset",
      icon: DoorOpen,
      to: "/buildings-rooms?view=rooms",
      tag: "LEARNING SPACES",
    },
    {
      title: "Rooms with AC ON",
      value: rooms.filter((r) => r.power === "ON").length,
      detail: "Of 5 monitored classrooms",
      icon: Wind,
      to: "/buildings-rooms?hvacStatus=ON",
      tag: "COOLING OPERATIONS",
    },
    {
      title: "Pending approvals",
      value: pending,
      detail: "Recommendations for your review",
      icon: ClipboardCheck,
      to: "/approval-center?view=inbox",
      tag: "ACTION REQUIRED",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="CAMPUS OPERATIONS"
        title="Overview Dashboard"
        subtitle="A clearer view of campus cooling. Better decisions, one room at a time."
        actions={
          <div className="date-chip">
            <CalendarDays size={16} />
            <span>{dateLabel(DEMO_DATE)}</span>
          </div>
        }
      />
      <div className="context-strip">
        <span>
          <span className="live-dot" /> HKU Main Campus{" "}
          <span className="strip-divider" /> Reference snapshot: 17 Nov 2026,
          1:15 PM HKT
        </span>
        <DemoLabel />
      </div>
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <button
            className={`kpi-card kpi-${i}`}
            key={k.title}
            onClick={() => navigate(k.to)}
          >
            <div className="kpi-top">
              <span className="kpi-icon">
                <k.icon size={20} strokeWidth={1.7} />
              </span>
              <ArrowUpRight size={17} />
            </div>
            <div className="kpi-label">{k.title}</div>
            <div className="kpi-value">
              {String(k.value).padStart(2, "0")}
              {i === 3 && k.value > 0 && <span className="attention-dot" />}
            </div>
            <div className="kpi-bottom">{k.detail}</div>
          </button>
        ))}
      </div>
      <div className="overview-middle">
        <CampusMap />
        <section className="card chart-card">
          <CardHeading
            title="Cooling Operations Overview"
            subtitle="Scheduled classroom use vs. rooms with AC ON"
            action={<span className="subtle-tag">17 NOV</span>}
          />
          <div className="chart-legend">
            <span>
              <i style={{ background: "#348468" }} />
              Scheduled rooms
            </span>
            <span>
              <i style={{ background: "#a2b4ce" }} />
              Rooms with AC ON
            </span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 16, right: 8, left: -26, bottom: 4 }}
              >
                <defs>
                  <linearGradient
                    id="scheduled-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#398568" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#398568" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="#e9edef"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#85908c" }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 5]}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#85908c" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5ebe7",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="on"
                  name="Rooms with AC ON"
                  stroke="#a2b4ce"
                  fill="#eff2f7"
                  fillOpacity={0.5}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
                <Area
                  type="monotone"
                  dataKey="scheduled"
                  name="Scheduled rooms"
                  stroke="#348468"
                  fill="url(#scheduled-fill)"
                  strokeWidth={2.5}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-insight">
            <span className="insight-icon">
              <Sparkles size={17} />
            </span>
            <div>
              <strong>Small gaps. Meaningful opportunities.</strong>
              <p>
                Compare schedules with cooling activity to spot periods worth
                reviewing.
              </p>
            </div>
          </div>
          <p className="chart-note">
            <Info size={12} /> Scheduled use is not actual occupancy.
            Illustrative daily profile.
          </p>
        </section>
      </div>
      <div className="overview-bottom">
        <section className="card impact-card">
          <CardHeading
            title="Potential Impact Snapshot"
            subtitle="A small change today. A lighter footprint tomorrow."
            action={
              <span className="leaf-icon">
                <Leaf size={20} />
              </span>
            }
          />
          <div className="impact-opportunities">
            <span className="impact-number">04</span>
            <div>
              <strong>optimization opportunities</strong>
              <span>In the illustrative daily scenario</span>
            </div>
          </div>
          <div className="impact-metrics">
            <div>
              <span>
                <Zap size={14} /> Potential energy savings
              </span>
              <strong>
                {savings.toFixed(1)} <small>kWh/day</small>
              </strong>
            </div>
            <div>
              <span>
                <Leaf size={14} /> Potential avoided emissions
              </span>
              <strong>
                {(savings * 0.4).toFixed(1)} <small>kg CO₂e/day</small>
              </strong>
            </div>
          </div>
          <div className="impact-footer">
            <span>Scenario estimate · Not measured savings</span>
            <button className="text-button" onClick={() => setMethod(true)}>
              <Info size={14} />
              How is this estimated?
            </button>
          </div>
        </section>
        <section className="card activities-card">
          <CardHeading
            title="Recent Activities"
            subtitle="The latest updates across your campus"
            action={
              <button
                className="text-button"
                onClick={() => navigate("/approval-center")}
              >
                View all <ArrowRight size={14} />
              </button>
            }
          />
          <div className="activity-list">
            {recent.map((a) => (
              <button
                className="activity-row"
                key={a.id}
                onClick={() =>
                  navigate(
                    a.approvalId
                      ? `/approval-center?itemId=${a.approvalId}`
                      : `/buildings-rooms?buildingId=${a.roomId.split("-")[0]}`,
                  )
                }
              >
                <span
                  className={`activity-icon ${a.status === "COMPLETED" ? "complete" : ""}`}
                >
                  {a.status === "COMPLETED" ? (
                    <ClipboardCheck size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}
                </span>
                <div className="activity-copy">
                  <strong>{a.title}</strong>
                  <span>
                    {buildingName(a.roomId.split("-")[0])} · {a.roomId} <i>·</i>{" "}
                    {timestampLabel(a.at)}
                  </span>
                </div>
                <Badge
                  tone={
                    a.status === "PENDING"
                      ? "warning"
                      : a.status === "COMPLETED"
                        ? "success"
                        : "neutral"
                  }
                >
                  {a.status === "PENDING"
                    ? "Pending"
                    : a.status === "COMPLETED"
                      ? "Completed"
                      : "Rejected"}
                </Badge>
              </button>
            ))}
          </div>
        </section>
      </div>
      <footer className="page-footer">
        <span>Designed for a more comfortable, energy-conscious campus.</span>
        <span>
          <Leaf size={12} /> Every degree makes a difference.
        </span>
      </footer>
      {method && (
        <Modal title="How is this estimated?" onClose={() => setMethod(false)}>
          <div className="modal-body">
            <Badge tone="success">ILLUSTRATIVE SCENARIO</Badge>
            <h3>Transparent assumptions. Potential impact.</h3>
            <p>
              This fixed daily scenario is independent of the number of pending
              requests. It is not actual HKU performance or verified savings.
            </p>
            <div className="formula">
              Energy (kWh) = Σ electrical input power (kW) × avoidable hours
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Power</th>
                    <th>Hours</th>
                    <th>kWh</th>
                  </tr>
                </thead>
                <tbody>
                  {impactScenario.map((x) => (
                    <tr key={x.id}>
                      <td>
                        {x.roomId}
                        <small>{x.note}</small>
                      </td>
                      <td>{x.power} kW</td>
                      <td>{x.hours}</td>
                      <td>{(x.power * x.hours).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="formula">
              {savings.toFixed(1)} kWh × 0.40 kg CO₂e/kWh ={" "}
              {(savings * 0.4).toFixed(1)} kg CO₂e
            </div>
            <p className="muted">
              All power inputs, avoidable hours and the grid emission factor are
              illustrative assumptions. The factor is not an official HKU
              emission factor. Opportunities use distinct room windows; comfort
              adjustments and pre-cooling are not automatically counted as
              savings.
            </p>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={() => setMethod(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
