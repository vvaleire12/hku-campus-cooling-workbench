import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, RotateCcw, ClipboardCheck, ArrowUpRight } from "lucide-react";
import { rooms, sourceLabels, typeLabels } from "../data";
import { buildingName, flowMatches, fuzzy, timestampLabel } from "../logic";
import type { Approval } from "../types";
import { useStore } from "../store";
import { Badge, DemoLabel, Empty, Field, PageHeading } from "../components/ui";
import ApprovalReview from "../components/ApprovalReview";
export default function Approvals() {
  const { state, notify } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Approval | null>(null);
  const closing = useRef(false);
  const history = params.get("view") === "history";
  const [search, setSearch] = useState(params.get("search") || "");
  const get = (key: string) => params.get(key) || "ALL";
  const pending = state.approvals.filter((a) => a.status === "PENDING");
  const historical = state.approvals.filter((a) => a.status !== "PENDING");
  useEffect(() => {
    const id = params.get("itemId");
    if (!id) {
      closing.current = false;
      return;
    }
    if (selected || closing.current) return;
    const record = state.approvals.find((a) => a.id === id);
    if (!record) {
      notify("This request could not be found.");
      const next = new URLSearchParams(params);
      next.delete("itemId");
      setParams(next, { replace: true });
    } else if (record.status !== "PENDING")
      navigate(
        `/approval-center/history/${id}?return=${encodeURIComponent(params.toString())}`,
        { replace: true },
      );
    else {
      setSelected(structuredClone(record));
      if (history) {
        const next = new URLSearchParams(params);
        next.set("view", "inbox");
        setParams(next, { replace: true });
      }
    }
  }, [params, state.approvals, selected, history, navigate, notify, setParams]);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value === "ALL" || !value) next.delete(key);
    else next.set(key, value);
    if (key === "building") next.delete("room");
    setParams(next, { replace: true });
  }
  function reset() {
    setSearch("");
    setParams({ view: history ? "history" : "inbox" }, { replace: true });
  }
  const buildingOptions = [...new Set(rooms.map((r) => r.buildingId))];
  const list = (history ? historical : pending)
    .filter(
      (a) =>
        (!search ||
          flowMatches(a.id, search) ||
          fuzzy(a.roomId, search) ||
          fuzzy(buildingName(a.roomId.split("-")[0]), search)) &&
        (get("type") === "ALL" || a.type === get("type")) &&
        (get("building") === "ALL" ||
          a.roomId.split("-")[0] === get("building")) &&
        (get("room") === "ALL" || a.roomId === get("room")) &&
        (get("source") === "ALL" || sourceLabels[a.type] === get("source")) &&
        (get("priority") === "ALL" || a.priority === get("priority")),
    )
    .sort((a, b) =>
      history
        ? (b.reviewedAt || b.createdAt).localeCompare(
            a.reviewedAt || a.createdAt,
          )
        : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <>
      <PageHeading
        eyebrow="DECISION WORKSPACE"
        title="Approval Center"
        subtitle="Turn operational insights into thoughtful cooling decisions."
        actions={
          <span className="date-chip">
            <ClipboardCheck size={17} />
            {pending.length} awaiting review
          </span>
        }
      />
      <div className="context-strip">
        <span>Human decisions. Simulated execution.</span>
        <DemoLabel />
      </div>
      <div className="tab-bar">
        <button
          className={!history ? "active" : ""}
          onClick={() => change("view", "inbox")}
        >
          Inbox <span>{pending.length}</span>
        </button>
        <button
          className={history ? "active" : ""}
          onClick={() => change("view", "history")}
        >
          History <span>{historical.length}</span>
        </button>
      </div>
      <section className="card filter-card">
        <div className="filter-heading">
          <h2>Find a request</h2>
          <button className="text-button" onClick={reset}>
            <RotateCcw size={14} />
            Reset filters
          </button>
        </div>
        <div className="approval-filters">
          <Field label="Search">
            <div className="search-input">
              <Search size={16} />
              <input
                placeholder="Search Flow ID, Room ID or Building"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  change("search", e.target.value);
                }}
              />
            </div>
          </Field>
          <Field label="Type">
            <select
              value={get("type")}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="ALL">All Types</option>
              {Object.entries(typeLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Building">
            <select
              value={get("building")}
              onChange={(e) => change("building", e.target.value)}
            >
              <option value="ALL">All Buildings</option>
              {buildingOptions.map((b) => (
                <option key={b} value={b}>
                  {buildingName(b)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room ID">
            <select
              value={get("room")}
              onChange={(e) => change("room", e.target.value)}
            >
              <option value="ALL">All Rooms</option>
              {rooms
                .filter(
                  (r) =>
                    get("building") === "ALL" ||
                    r.buildingId === get("building"),
                )
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {buildingName(r.buildingId)}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Source">
            <select
              value={get("source")}
              onChange={(e) => change("source", e.target.value)}
            >
              <option value="ALL">All Sources</option>
              {Object.values(sourceLabels).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={get("priority")}
              onChange={(e) => change("priority", e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              {["HIGH", "MEDIUM", "LOW"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>
              {history ? "Historical Records" : "Approval Requests"}{" "}
              <span className="count-label">{list.length}</span>
            </h2>
            <p>
              {history
                ? "Completed and rejected workflows, preserved for reference."
                : "Review supporting evidence before applying a simulated configuration."}
            </p>
          </div>
        </div>
        {list.length ? (
          <div className="table-scroll">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>Flow ID</th>
                  <th>Type</th>
                  <th>Room / Building</th>
                  <th>Source</th>
                  <th>Submitted At</th>
                  {history ? <th>Processed At</th> : <th>Priority</th>}
                  <th>Status</th>
                  <th>{history ? "Decision" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {history ? (
                        <Link
                          className="id-link"
                          to={`/approval-center/history/${a.id}?return=${encodeURIComponent(params.toString())}`}
                        >
                          {a.id}
                          <ArrowUpRight size={12} />
                        </Link>
                      ) : (
                        <button
                          className="id-link"
                          onClick={() => {
                            setSelected(structuredClone(a));
                            change("itemId", a.id);
                          }}
                        >
                          {a.id}
                        </button>
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={a.type === "COMFORT_FEEDBACK" ? "blue" : "green"}
                      >
                        {typeLabels[a.type]}
                      </Badge>
                    </td>
                    <td>
                      <Link
                        className="room-link"
                        to={`/buildings-rooms/rooms/${a.roomId}`}
                      >
                        {a.roomId}
                      </Link>
                      <small>{buildingName(a.roomId.split("-")[0])}</small>
                    </td>
                    <td>{sourceLabels[a.type]}</td>
                    <td>{timestampLabel(a.createdAt)}</td>
                    <td>
                      {history ? (
                        timestampLabel(a.reviewedAt || a.createdAt)
                      ) : (
                        <span
                          className={`priority ${a.priority.toLowerCase()}`}
                        >
                          <i />
                          {a.priority[0] + a.priority.slice(1).toLowerCase()}
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={
                          a.status === "PENDING"
                            ? "warning"
                            : a.status === "COMPLETED"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {a.status[0] + a.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td>
                      {history ? (
                        a.status === "COMPLETED" ? (
                          "Approved"
                        ) : (
                          "Rejected"
                        )
                      ) : (
                        <button
                          className="button review-button"
                          onClick={() => {
                            setSelected(structuredClone(a));
                            change("itemId", a.id);
                          }}
                        >
                          Review
                          <ArrowUpRight size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              history
                ? "No historical records match your filters."
                : pending.length
                  ? "No requests match your current filters."
                  : "You’re all caught up."
            }
            description={
              pending.length
                ? "Try adjusting the search or filters."
                : "All operational recommendations have been reviewed."
            }
            action={
              <button className="button secondary" onClick={reset}>
                Reset filters
              </button>
            }
          />
        )}
        <div className="table-footnote">
          Recommendations are illustrative. Only a successfully saved simulated
          configuration completes an approved workflow.
        </div>
      </section>
      {selected && (
        <ApprovalReview
          item={selected}
          onClose={() => {
            closing.current = true;
            setSelected(null);
            const next = new URLSearchParams(params);
            next.delete("itemId");
            next.set("view", "inbox");
            setParams(next, { replace: true });
          }}
        />
      )}
    </>
  );
}
