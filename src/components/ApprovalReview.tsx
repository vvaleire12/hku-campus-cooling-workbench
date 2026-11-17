import { useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Snowflake,
  Flame,
  Droplets,
  Leaf,
  Power,
} from "lucide-react";
import { modes, typeLabels } from "../data";
import {
  buildingName,
  configErrors,
  dateLabel,
  overlaps,
  roomFor,
  timestampLabel,
} from "../logic";
import type { Approval, Configuration } from "../types";
import { useStore } from "../store";
import { Badge, Field, Modal, Stepper } from "./ui";
export function Evidence({ item }: { item: Approval }) {
  const total = item.feedback?.reduce((a, b) => a + b, 0) || 0;
  return (
    <>
      {item.feedback && (
        <section className="evidence-section">
          <div className="section-title">
            <MessageSquare size={16} />
            <h3>Comfort Feedback Summary</h3>
            <span className="muted">{total} reports</span>
          </div>
          <div className="feedback-bar">
            {item.feedback.map((count, i) => (
              <div
                key={i}
                className={["cold", "comfortable", "warm"][i]}
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            ))}
          </div>
          <div className="feedback-labels">
            {item.feedback.map((count, i) => (
              <div key={i}>
                <i className={["cold", "comfortable", "warm"][i]} />
                <span>{["Too cold", "Comfortable", "Too warm"][i]}</span>
                <strong>
                  {count}{" "}
                  <small>
                    (
                    {total
                      ? ((count / total) * 100).toFixed(
                          ((count / total) * 100) % 1 ? 1 : 0,
                        )
                      : "0"}
                    %)
                  </small>
                </strong>
              </div>
            ))}
          </div>
          <p className="muted">
            Anonymous aggregated reports · {item.feedbackWindow?.join("–")} HKT
            · {dateLabel(item.createdAt)} · 30-minute window
          </p>
        </section>
      )}
      <section className="evidence-section">
        <h3>Evidence & context</h3>
        <ul className="evidence-list">
          {item.evidence.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
export function ConfigurationSummary({ config }: { config: Configuration }) {
  return (
    <dl className="detail-grid">
      <div>
        <dt>HVAC power</dt>
        <dd>AC {config.power}</dd>
      </div>
      <div>
        <dt>Effective date</dt>
        <dd>{dateLabel(config.date)}</dd>
      </div>
      <div>
        <dt>Operating period</dt>
        <dd>
          {config.start}–{config.end} HKT
        </dd>
      </div>
      <div>
        <dt>Operating mode</dt>
        <dd>{config.mode ? modes[config.mode] : "Not applicable (OFF)"}</dd>
      </div>
      <div>
        <dt>Target temperature</dt>
        <dd>
          {config.power === "ON"
            ? `${config.setpoint?.toFixed(1)}°C`
            : "Not applicable (OFF)"}
        </dd>
      </div>
      <div>
        <dt>Execution</dt>
        <dd>Simulated success · plan saved</dd>
      </div>
    </dl>
  );
}
export default function ApprovalReview({
  item,
  onClose,
}: {
  item: Approval;
  onClose: () => void;
}) {
  const { process, state } = useStore();
  const [step, setStep] = useState<
    "REVIEW" | "REJECT" | "CONFIGURE" | "SUCCESS" | "REJECTED"
  >("REVIEW");
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [config, setConfig] = useState<Configuration>({
    ...item.recommendation,
  });
  const [failure, setFailure] = useState("");
  const started = useRef(new Date().toISOString());
  const saving = useRef(false);
  const room = roomFor(item.roomId);
  const errors = configErrors(config);
  const exception =
    config.power === "ON" && (config.setpoint! < 23 || config.setpoint! > 26);
  const conflict = state.approvals.some(
    (a) =>
      a.id !== item.id &&
      a.roomId === item.roomId &&
      a.status === "COMPLETED" &&
      a.config &&
      overlaps(a.config, config),
  );
  function finish(reject = false) {
    if (saving.current) return;
    saving.current = true;
    const success = process(
      item.id,
      reject
        ? null
        : {
            ...config,
            mode: config.power === "OFF" ? null : config.mode,
            setpoint: config.power === "OFF" ? null : config.setpoint,
          },
      comment,
      reject ? reason : undefined,
      started.current,
    );
    if (success) setStep(reject ? "REJECTED" : "SUCCESS");
    else
      setFailure(
        "The request could not be saved. It may have already been processed, or local storage is unavailable.",
      );
    saving.current = false;
  }
  return (
    <Modal
      title={
        step === "SUCCESS"
          ? "Configuration complete"
          : step === "REJECTED"
            ? "Request rejected"
            : "Review operational recommendation"
      }
      onClose={onClose}
      wide
      locked={step === "CONFIGURE" || step === "SUCCESS" || step === "REJECTED"}
    >
      {step === "SUCCESS" || step === "REJECTED" ? (
        <>
          <div className="modal-body result-body">
            <div
              className={`result-icon ${step === "REJECTED" ? "rejected" : ""}`}
            >
              {step === "SUCCESS" ? (
                <CheckCircle2 size={36} />
              ) : (
                <XCircle size={36} />
              )}
            </div>
            <h2>
              {step === "SUCCESS"
                ? "Configuration successfully applied"
                : "Request rejected"}
            </h2>
            <p>
              {step === "SUCCESS"
                ? "Your simulated facility settings have been saved."
                : "This request has been moved to History."}
            </p>
            <Badge tone={step === "SUCCESS" ? "success" : "neutral"}>
              {item.id} · {item.roomId}
            </Badge>
            {step === "SUCCESS" ? (
              <ConfigurationSummary
                config={{
                  ...config,
                  mode: config.power === "OFF" ? null : config.mode,
                  setpoint: config.power === "OFF" ? null : config.setpoint,
                }}
              />
            ) : (
              <div className="rejection-summary">
                <strong>Rejection reason</strong>
                <p>{reason}</p>
                {comment && <p>{comment}</p>}
              </div>
            )}
            <div className="notice">
              <Leaf size={16} />
              <span>
                No actual HVAC equipment has been adjusted. Saved plans do not
                overwrite the fixed 1:15 PM room snapshot.
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={onClose}>
              Close & Return to Inbox
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="review-banner">
            <div>
              <strong>{item.id}</strong>
              <span>
                {typeLabels[item.type]} · {item.roomId} ·{" "}
                {buildingName(room.buildingId)}
              </span>
            </div>
            <Badge tone="warning">Pending</Badge>
          </div>
          <div className="review-steps">
            <span className={step !== "CONFIGURE" ? "current" : "done"}>
              <i>{step === "CONFIGURE" ? <Check size={12} /> : 1}</i>Review
              request
            </span>
            <ChevronRight size={14} />
            <span className={step === "CONFIGURE" ? "current" : ""}>
              <i>2</i>Configure facilities
            </span>
          </div>
          <div className="modal-body">
            {step === "CONFIGURE" ? (
              <>
                <div className="section-title">
                  <h3>Configure Facilities</h3>
                  <Badge tone="success">SIMULATED FACILITY CONTROL</Badge>
                </div>
                <p className="muted">
                  {item.roomId} · Currently AC {room.power} · Current setpoint{" "}
                  {room.setpoint.toFixed(1)}°C
                </p>
                <div className="configuration-grid">
                  <Field label="HVAC Power">
                    <div className="segmented">
                      {(["ON", "OFF"] as const).map((v) => (
                        <button
                          key={v}
                          className={config.power === v ? "selected" : ""}
                          onClick={() =>
                            setConfig({
                              ...config,
                              power: v,
                              mode:
                                v === "ON"
                                  ? config.mode || "COOLING"
                                  : config.mode,
                              setpoint:
                                v === "ON"
                                  ? (config.setpoint ?? room.setpoint)
                                  : config.setpoint,
                            })
                          }
                        >
                          <Power size={14} />
                          {v}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Effective Date *" error={errors.date}>
                    <input
                      type="date"
                      value={config.date}
                      onChange={(e) =>
                        setConfig({ ...config, date: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Start Time *">
                    <input
                      type="time"
                      value={config.start}
                      onChange={(e) =>
                        setConfig({ ...config, start: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="End Time *" error={errors.time}>
                    <input
                      type="time"
                      value={config.end}
                      onChange={(e) =>
                        setConfig({ ...config, end: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <h3 className="form-section-title">Operating mode</h3>
                <div className="mode-grid">
                  {Object.entries(modes).map(([value, label], i) => {
                    const Icon = [Snowflake, Flame, Droplets, Leaf][i];
                    return (
                      <button
                        key={value}
                        disabled={config.power === "OFF" || value === "HEATING"}
                        className={`mode-option ${config.mode === value && config.power === "ON" ? "selected" : ""}`}
                        onClick={() =>
                          setConfig({
                            ...config,
                            mode: value as Configuration["mode"],
                          })
                        }
                      >
                        <Icon size={20} />
                        <strong>{label}</strong>
                        {value === "HEATING" && (
                          <small>Not supported in this demo</small>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="setpoint-section">
                  <div className="section-title">
                    <h3>Target Temperature Setpoint</h3>
                    <span className="muted">
                      Current setpoint{" "}
                      <strong>{room.setpoint.toFixed(1)}°C</strong>
                    </span>
                  </div>
                  <Stepper
                    value={config.setpoint ?? room.setpoint}
                    onChange={(setpoint) => setConfig({ ...config, setpoint })}
                    disabled={config.power === "OFF"}
                  />
                  <p className="muted">
                    {config.power === "OFF"
                      ? "The equipment is planned to remain off during the selected period. Mode and target temperature will not be submitted."
                      : "18–30°C · 0.5°C steps · Standard cooling reference: 23–26°C"}
                  </p>
                </div>
                {exception && (
                  <div className="notice warning">
                    <AlertTriangle size={18} />
                    <span>
                      This target is outside the standard 23–26°C reference
                      range. Review this exception carefully. The original
                      comfort recommendation is preserved.
                    </span>
                  </div>
                )}
                {conflict && (
                  <div className="notice warning">
                    <AlertTriangle size={18} />
                    <span>
                      This period overlaps an existing saved plan for{" "}
                      {item.roomId}. Both are retained as separate demonstration
                      records; no device schedule is overwritten.
                    </span>
                  </div>
                )}
                <div className="notice">
                  <Leaf size={16} />
                  <span>
                    Apply saves an illustrative plan only. It does not operate
                    equipment or change the fixed room sensor snapshot. No
                    overnight schedules.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="request-metadata">
                  <span>Submitted {timestampLabel(item.createdAt)}</span>
                  <Badge
                    tone={
                      item.priority === "HIGH"
                        ? "danger"
                        : item.priority === "MEDIUM"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {item.priority.toLowerCase()} priority
                  </Badge>
                </div>
                <h3 className="request-summary">{item.summary}</h3>
                <Evidence item={item} />
                <section className="suggestion-card">
                  <div className="section-title">
                    <Sparkles size={17} />
                    <h3>AI-generated Suggestion</h3>
                    <Badge tone="success">Demo content</Badge>
                  </div>
                  <p>{item.rationale}</p>
                  <div className="recommendation-values">
                    <span>
                      HVAC <strong>{item.recommendation.power}</strong>
                    </span>
                    <span>
                      Period{" "}
                      <strong>
                        {item.recommendation.start}–{item.recommendation.end}
                      </strong>
                    </span>
                    <span>
                      Target{" "}
                      <strong>
                        {item.recommendation.setpoint === null
                          ? "OFF"
                          : `${item.recommendation.setpoint.toFixed(1)}°C`}
                      </strong>
                    </span>
                  </div>
                  <small>
                    Illustrative recommendation · Predefined content, not a live
                    AI model
                  </small>
                </section>
                <Field label="Administrator Comment (Optional)">
                  <textarea
                    rows={3}
                    value={comment}
                    maxLength={500}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add additional comments or explain your decision…"
                  />
                  <small className="character-count">
                    {comment.length}/500
                  </small>
                </Field>
                {step === "REJECT" && (
                  <div className="reject-panel">
                    <Field label="Rejection reason *">
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      >
                        <option value="">Select a reason</option>
                        {[
                          "Recommendation not justified",
                          "Schedule has changed",
                          "Insufficient evidence",
                          "Operational constraints",
                          "Other",
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <p className="muted">
                      A reason is required. Your comment remains optional.
                    </p>
                  </div>
                )}
              </>
            )}
            {failure && (
              <div className="notice warning" role="alert">
                {failure}
              </div>
            )}
          </div>
          <div className="modal-footer">
            {step === "CONFIGURE" ? (
              <>
                <button
                  className="button secondary"
                  onClick={() => {
                    setConfig({ ...item.recommendation });
                    setStep("REVIEW");
                  }}
                >
                  Back to Review
                </button>
                <button
                  className="button primary"
                  disabled={Object.keys(errors).length > 0}
                  onClick={() => finish()}
                >
                  Apply Settings (Simulated)
                  <Check size={15} />
                </button>
              </>
            ) : step === "REJECT" ? (
              <>
                <button
                  className="button secondary"
                  onClick={() => setStep("REVIEW")}
                >
                  Cancel
                </button>
                <button
                  className="button danger"
                  disabled={!reason}
                  onClick={() => finish(true)}
                >
                  Confirm Rejection
                </button>
              </>
            ) : (
              <>
                <button
                  className="button secondary"
                  onClick={() => setStep("REJECT")}
                >
                  Reject
                </button>
                <button
                  className="button primary"
                  onClick={() => setStep("CONFIGURE")}
                >
                  Approve & Configure
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
