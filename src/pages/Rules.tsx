import { useRef, useState } from "react";
import {
  Plus,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  LockKeyhole,
  Eye,
  Pencil,
  AlertTriangle,
  Trash2,
  FileText,
  Check,
} from "lucide-react";
import {
  buildings,
  categories,
  modes,
  newCondition,
  newRule,
  rooms,
  triggerLabels,
} from "../data";
import { buildingName, conditionSummary, fuzzy, ruleErrors } from "../logic";
import type { Condition, Rule } from "../types";
import { useStore } from "../store";
import {
  Badge,
  DemoLabel,
  Empty,
  Field,
  Modal,
  PageHeading,
  Stepper,
} from "../components/ui";
function RuleDrawer({
  initial,
  view,
  onClose,
}: {
  initial: Rule;
  view: boolean;
  onClose: () => void;
}) {
  const { state, saveRule, notify } = useStore();
  const [rule, setRule] = useState<Rule>(structuredClone(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discard, setDiscard] = useState(false);
  const form = useRef<HTMLDivElement>(null);
  const changed = JSON.stringify(rule) !== JSON.stringify(initial);
  const change = <K extends keyof Rule>(k: K, v: Rule[K]) =>
    setRule({ ...rule, [k]: v });
  const condition = (i: number, patch: Partial<Condition>) =>
    change(
      "conditions",
      rule.conditions.map((c, n) => (n === i ? { ...c, ...patch } : c)),
    );
  function close() {
    if (changed && !view) setDiscard(true);
    else onClose();
  }
  function save(draft: boolean) {
    const issues = ruleErrors(rule, state.rules, draft);
    setErrors(issues);
    if (Object.keys(issues).length) {
      setTimeout(
        () =>
          form.current
            ?.querySelector(".invalid")
            ?.scrollIntoView({ block: "center", behavior: "smooth" }),
        10,
      );
      return;
    }
    if (saveRule({ ...rule, status: draft ? "DRAFT" : "ACTIVE" })) {
      notify(
        draft
          ? "Draft saved successfully."
          : "Rule activated successfully. It is eligible for illustrative recommendations; no automatic execution is running.",
      );
      onClose();
    }
  }
  return (
    <Modal
      drawer
      title={view ? "View Rule" : rule.id ? "Edit Rule" : "Create New Rule"}
      onClose={close}
    >
      <div className="drawer-intro">
        <p>
          {view
            ? "Understand the rule, its scope and recommended actions."
            : "Define trigger conditions and recommended facility actions."}
        </p>
        {initial.system && (
          <Badge tone="neutral">
            <LockKeyhole size={12} />
            System reference · Read only
          </Badge>
        )}
      </div>
      <div className="drawer-form" ref={form}>
        {view ? (
          <>
            <div className="section-title">
              <Badge tone="success">{rule.id}</Badge>
              <Badge tone={rule.status === "ACTIVE" ? "success" : "neutral"}>
                {rule.status}
              </Badge>
            </div>
            <h3>{rule.name}</h3>
            <p>{rule.description}</p>
            <dl className="detail-grid">
              <div>
                <dt>Category</dt>
                <dd>{categories[rule.category]}</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd>
                  {rule.building === "ALL"
                    ? "All Buildings"
                    : buildingName(rule.building)}
                </dd>
              </div>
              <div>
                <dt>Trigger</dt>
                <dd>{conditionSummary(rule)}</dd>
              </div>
              <div>
                <dt>Approval handling</dt>
                <dd>Administrator approval required</dd>
              </div>
              <div>
                <dt>Reference target</dt>
                <dd>
                  {rule.id === "RUL-001"
                    ? "24.5°C (range 23–26°C)"
                    : `${rule.setpoint.toFixed(1)}°C`}
                </dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{rule.priority}</dd>
              </div>
            </dl>
            {rule.id === "RUL-002" && (
              <div className="two-stage-plan">
                <div>
                  <span>01 · Before event</span>
                  <strong>23.5°C</strong>
                  <small>30 minutes before the scheduled start</small>
                </div>
                <div>
                  <span>02 · Event begins</span>
                  <strong>24.5°C</strong>
                  <small>Restore the standard reference setpoint</small>
                </div>
              </div>
            )}
            <div className="notice">
              <ShieldCheck size={18} />
              <span>
                Source basis cited by the PRD: HKU Estates Office FAQ —
                Air-Conditioning. The digital interpretation and timing
                parameters are illustrative, not an official automated rule or
                verified equipment capability.
              </span>
            </div>
            {!rule.system && (
              <div className="suggestion-card">
                <strong>Recommended action</strong>
                <p>
                  HVAC {rule.power} · {modes[rule.mode]} ·{" "}
                  {rule.setpoint.toFixed(1)}°C
                </p>
                <p>
                  {rule.relative
                    ? `${rule.lead} minutes before scheduled start`
                    : rule.start}{" "}
                  → {rule.end}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="form-section-label">
              <span>01</span>
              <h3>Rule information</h3>
            </div>
            <Field label="Rule Name *" error={errors.name}>
              <input
                value={rule.name}
                maxLength={60}
                onChange={(e) => change("name", e.target.value)}
                placeholder="e.g. High-Occupancy Pre-cooling"
              />
            </Field>
            <Field label="Category *" error={errors.category}>
              <select
                value={rule.category}
                onChange={(e) => change("category", e.target.value)}
              >
                <option value="">Select category</option>
                {Object.entries(categories).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description" error={errors.description}>
              <textarea
                value={rule.description}
                rows={2}
                maxLength={200}
                onChange={(e) => change("description", e.target.value)}
                placeholder="Briefly explain the purpose of this rule…"
              />
              <small>{rule.description.length}/200</small>
            </Field>
            <div className="form-columns">
              <Field label="Applicable Building *">
                <select
                  value={rule.building}
                  onChange={(e) =>
                    setRule({ ...rule, building: e.target.value, room: "ALL" })
                  }
                >
                  <option value="ALL">All Buildings</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Room (optional)">
                <select
                  disabled={rule.building === "ALL"}
                  value={rule.room}
                  onChange={(e) => change("room", e.target.value)}
                >
                  <option value="ALL">All Rooms</option>
                  {rooms
                    .filter((r) => r.buildingId === rule.building)
                    .map((r) => (
                      <option key={r.id}>{r.id}</option>
                    ))}
                </select>
              </Field>
            </div>
            <div className="form-section-label">
              <span>02</span>
              <h3>Trigger conditions</h3>
            </div>
            {rule.conditions.map((c, i) => (
              <div className="condition-form" key={i}>
                <div className="condition-heading">
                  <strong>
                    {i === 0
                      ? "Primary condition"
                      : "AND · Additional condition"}
                  </strong>
                  {i === 1 && (
                    <button
                      className="icon-button"
                      aria-label="Remove additional condition"
                      onClick={() =>
                        change("conditions", rule.conditions.slice(0, 1))
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <Field label="Trigger Type *">
                  <select
                    value={c.type}
                    onChange={(e) =>
                      condition(i, {
                        type: e.target.value as Condition["type"],
                        value: 30,
                      })
                    }
                  >
                    {Object.entries(triggerLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                {c.type === "CLASS_SCHEDULE" ? (
                  <>
                    <div className="form-columns">
                      <Field label="Class / Event Exists">
                        <select
                          value={String(c.exists)}
                          onChange={(e) =>
                            condition(i, { exists: e.target.value === "true" })
                          }
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </Field>
                      <Field label="Expected Attendance">
                        <select
                          value={c.expected}
                          onChange={(e) =>
                            condition(i, { expected: e.target.value })
                          }
                        >
                          {["LOW", "MEDIUM", "HIGH"].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Minutes Before Scheduled Start">
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={c.value}
                        onChange={(e) =>
                          condition(i, { value: Number(e.target.value) })
                        }
                      />
                    </Field>
                  </>
                ) : c.type === "COMFORT_FEEDBACK" ? (
                  <>
                    <Field label="Minimum Number of Reports">
                      <input
                        type="number"
                        min={1}
                        value={c.value}
                        onChange={(e) =>
                          condition(i, { value: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <div className="form-columns">
                      <Field label="Dominant Feedback">
                        <select
                          value={c.sentiment}
                          onChange={(e) =>
                            condition(i, {
                              sentiment: e.target
                                .value as Condition["sentiment"],
                            })
                          }
                        >
                          <option value="TOO_COLD">Too Cold</option>
                          <option value="TOO_WARM">Too Warm</option>
                        </select>
                      </Field>
                      <Field label="Reporting Window">
                        <select
                          value={c.window}
                          onChange={(e) =>
                            condition(i, { window: Number(e.target.value) })
                          }
                        >
                          {[15, 30, 60].map((v) => (
                            <option key={v} value={v}>
                              {v} minutes
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </>
                ) : (
                  <div className="form-columns">
                    <Field label="Comparison">
                      <select
                        value={c.operator}
                        onChange={(e) =>
                          condition(i, {
                            operator: e.target.value as Condition["operator"],
                          })
                        }
                      >
                        <option value="GT">Greater Than</option>
                        <option value="LT">Less Than</option>
                      </select>
                    </Field>
                    <Field
                      label={
                        c.type === "ROOM_OCCUPANCY"
                          ? "Threshold (%)"
                          : "Threshold (°C)"
                      }
                    >
                      <input
                        type="number"
                        min={c.type === "ROOM_OCCUPANCY" ? 0 : -30}
                        max={c.type === "ROOM_OCCUPANCY" ? 100 : 60}
                        step={c.type === "ROOM_OCCUPANCY" ? 1 : 0.5}
                        value={c.value}
                        onChange={(e) =>
                          condition(i, { value: Number(e.target.value) })
                        }
                      />
                    </Field>
                  </div>
                )}
              </div>
            ))}
            {errors.conditions && <p className="error">{errors.conditions}</p>}
            {rule.conditions.length < 2 && (
              <button
                className="text-button"
                onClick={() =>
                  change("conditions", [...rule.conditions, newCondition()])
                }
              >
                <Plus size={14} />
                Add an AND condition
              </button>
            )}
            <p className="muted">
              One primary condition and one optional AND condition. These
              definitions are stored locally; no live rule engine evaluates
              them.
            </p>
            <div className="form-section-label">
              <span>03</span>
              <h3>Recommended facility settings</h3>
            </div>
            <Field label="HVAC Power *">
              <div className="segmented">
                {(["ON", "OFF"] as const).map((v) => (
                  <button
                    key={v}
                    className={rule.power === v ? "selected" : ""}
                    onClick={() => change("power", v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Operating Mode *">
              <select
                disabled={rule.power === "OFF"}
                value={rule.mode}
                onChange={(e) => change("mode", e.target.value as Rule["mode"])}
              >
                {Object.entries(modes)
                  .filter(([v]) => v !== "HEATING")
                  .map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Target Temperature" error={errors.setpoint}>
              <span className="muted">
                Reference setpoint 24.5°C · Standard range 23–26°C
              </span>
            </Field>
            <Stepper
              min={23}
              max={26}
              value={rule.setpoint}
              onChange={(v) => change("setpoint", v)}
              disabled={rule.power === "OFF"}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rule.relative}
                onChange={(e) => change("relative", e.target.checked)}
              />
              Start relative to a scheduled class
            </label>
            <div className="form-columns">
              {rule.relative ? (
                <Field label="Minutes Before Start">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={rule.lead}
                    onChange={(e) => change("lead", Number(e.target.value))}
                  />
                </Field>
              ) : (
                <Field label="Start Time">
                  <input
                    type="time"
                    value={rule.start}
                    onChange={(e) => change("start", e.target.value)}
                  />
                </Field>
              )}
              <Field label="End Time" error={errors.time}>
                <input
                  type="time"
                  value={rule.end}
                  onChange={(e) => change("end", e.target.value)}
                />
              </Field>
            </div>
            {rule.conditions.some(
              (c) =>
                c.type === "OUTDOOR_TEMPERATURE" &&
                c.operator === "LT" &&
                c.value <= 18,
            ) && (
              <div className="notice warning">
                <AlertTriangle size={18} />
                <span>
                  The PRD cites an outdoor-temperature cooling limitation below
                  18°C. Review this condition; an unsupported heating command is
                  not available.
                </span>
              </div>
            )}
            <div className="form-section-label">
              <span>04</span>
              <h3>Approval workflow</h3>
            </div>
            <div className="locked-approval">
              <ShieldCheck size={20} />
              <div>
                <strong>Administrator approval is required</strong>
                <p>
                  Triggered scenarios propose recommendations for Approval
                  Center. They never directly adjust facilities.
                </p>
              </div>
              <LockKeyhole size={15} />
            </div>
            <Field label="Priority">
              <select
                value={rule.priority}
                onChange={(e) =>
                  change("priority", e.target.value as Rule["priority"])
                }
              >
                {["HIGH", "MEDIUM", "LOW"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            {initial.status === "ACTIVE" && (
              <p className="muted">
                Saving this existing rule as a draft will pause it. Submitting
                keeps its ID and activates the validated definition.
              </p>
            )}
          </>
        )}
        {discard && (
          <div className="discard-panel" role="alert">
            <strong>You have unsaved changes. Discard them and close?</strong>
            <div>
              <button
                className="button secondary"
                onClick={() => setDiscard(false)}
              >
                Keep Editing
              </button>
              <button className="button danger" onClick={onClose}>
                Discard Changes
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="drawer-footer">
        <button className="button secondary" onClick={close}>
          Close
        </button>
        {!view && (
          <>
            <button className="button secondary" onClick={() => save(true)}>
              <FileText size={14} />
              Save Draft
            </button>
            <button className="button primary" onClick={() => save(false)}>
              Submit Rule
              <Check size={14} />
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
export default function Rules() {
  const { state, toggleRule, notify } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [drawer, setDrawer] = useState<{ rule: Rule; view: boolean } | null>(
    null,
  );
  const results = state.rules.filter(
    (r) =>
      (fuzzy(r.id, search) || fuzzy(r.name, search)) &&
      (category === "ALL" || r.category === category) &&
      (status === "ALL" || r.status === status),
  );
  const active = state.rules.filter((r) => r.status === "ACTIVE").length;
  return (
    <>
      <PageHeading
        eyebrow="OPERATIONAL FRAMEWORK"
        title="Rules & Settings"
        subtitle="Consistent principles for a more comfortable, efficient campus."
        actions={
          <button
            className="button primary"
            onClick={() => setDrawer({ rule: newRule(), view: false })}
          >
            <Plus size={16} />
            Create New Rule
          </button>
        }
      />
      <div className="context-strip">
        <span>
          {state.rules.length} total rules <span className="strip-divider" />
          {active} active <span className="strip-divider" />
          {state.rules.filter((r) => r.status === "DRAFT").length} drafts
        </span>
        <DemoLabel />
      </div>
      <div className="rules-notice">
        <ShieldCheck size={21} />
        <div>
          <strong>Recommendations first. People always in control.</strong>
          <p>
            Rules define proposed actions for administrator review. This
            prototype has no automatic rule execution or real facility
            connection.
          </p>
        </div>
      </div>
      <section className="card filter-card">
        <div className="filter-heading">
          <h2>Explore operating rules</h2>
          <button
            className="text-button"
            onClick={() => {
              setSearch("");
              setCategory("ALL");
              setStatus("ALL");
            }}
          >
            <RotateCcw size={14} />
            Reset filters
          </button>
        </div>
        <div className="rules-filters">
          <Field label="Search">
            <div className="search-input">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Rule ID or Rule Name…"
              />
            </div>
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {Object.entries(categories).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {["ACTIVE", "DRAFT", "INACTIVE"].map((v) => (
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
              Operating Rules{" "}
              <span className="count-label">{results.length}</span>
            </h2>
            <p>
              Reference guidelines and locally defined operational strategies
            </p>
          </div>
          <SlidersHorizontal size={18} className="muted" />
        </div>
        {results.length ? (
          <div className="table-scroll">
            <table className="rules-table">
              <thead>
                <tr>
                  {[
                    "Rule",
                    "Category",
                    "Trigger Condition",
                    "Recommended Action",
                    "Scope",
                    "Status",
                    "Action",
                  ].map((v) => (
                    <th key={v}>{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="rule-id">
                        {r.id}
                        {r.system && <LockKeyhole size={11} />}
                      </span>
                      <strong>{r.name}</strong>
                      <small>
                        {r.system ? "System reference" : "User-created rule"}
                      </small>
                    </td>
                    <td>
                      <Badge tone="green">
                        {categories[r.category] || "Not set"}
                      </Badge>
                    </td>
                    <td>
                      {r.status === "DRAFT"
                        ? "Draft · conditions not yet validated"
                        : conditionSummary(r)}
                    </td>
                    <td>
                      {r.id === "RUL-001"
                        ? "Review exceptions · reference 24.5°C"
                        : r.id === "RUL-002"
                          ? "Pre-cool at 23.5°C → restore 24.5°C"
                          : r.power === "OFF"
                            ? "Recommend HVAC OFF"
                            : `${modes[r.mode]} · ${r.setpoint.toFixed(1)}°C`}
                    </td>
                    <td>
                      {r.building === "ALL"
                        ? "All Buildings"
                        : r.room !== "ALL"
                          ? r.room
                          : buildingName(r.building)}
                    </td>
                    <td>
                      <Badge
                        tone={r.status === "ACTIVE" ? "success" : "neutral"}
                      >
                        {r.status[0] + r.status.slice(1).toLowerCase()}
                      </Badge>
                      {!r.system && r.status !== "DRAFT" && (
                        <button
                          className="status-action"
                          onClick={() => {
                            if (toggleRule(r.id))
                              notify(
                                r.status === "ACTIVE"
                                  ? "Rule disabled. Existing approvals are retained."
                                  : "Rule enabled. No facility settings were changed.",
                              );
                          }}
                        >
                          {r.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`View ${r.id}`}
                          onClick={() => setDrawer({ rule: r, view: true })}
                        >
                          <Eye size={17} />
                        </button>
                        {!r.system && (
                          <button
                            className="icon-button"
                            aria-label={`Edit ${r.id}`}
                            onClick={() => setDrawer({ rule: r, view: false })}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No rules match your current filters."
            action={
              <button
                className="button secondary"
                onClick={() => {
                  setSearch("");
                  setCategory("ALL");
                  setStatus("ALL");
                }}
              >
                Clear filters
              </button>
            }
          />
        )}
        <div className="table-footnote">
          System references are read-only. User rules can be edited, saved as
          drafts, and enabled or disabled. All changes stay in this browser.
        </div>
      </section>
      {drawer && (
        <RuleDrawer
          initial={drawer.rule}
          view={drawer.view}
          onClose={() => setDrawer(null)}
        />
      )}
    </>
  );
}
