import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, UserRound } from "lucide-react";
import { typeLabels } from "../data";
import { buildingName, timestampLabel } from "../logic";
import { useStore } from "../store";
import {
  Badge,
  CardHeading,
  DemoLabel,
  Empty,
  PageHeading,
} from "../components/ui";
import { ConfigurationSummary, Evidence } from "../components/ApprovalReview";
export default function History() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state } = useStore();
  const item = state.approvals.find(
    (a) => a.id === id && a.status !== "PENDING",
  );
  const back = new URLSearchParams(params.get("return") || "");
  back.delete("itemId");
  back.set("view", "history");
  if (!item)
    return (
      <Empty
        title="Historical record not found"
        action={
          <Link className="button primary" to="/approval-center?view=history">
            Back to History
          </Link>
        }
      />
    );
  return (
    <>
      <Link className="back-link" to={`/approval-center?${back}`}>
        <ArrowLeft size={15} />
        Back to History
      </Link>
      <PageHeading
        eyebrow="HISTORICAL REQUEST · READ ONLY"
        title={item.id}
        subtitle={`${typeLabels[item.type]} · ${item.roomId} · ${buildingName(item.roomId.split("-")[0])}`}
        actions={
          <Badge tone={item.status === "COMPLETED" ? "success" : "neutral"}>
            {item.status === "COMPLETED" ? "Completed" : "Rejected"}
          </Badge>
        }
      />
      <div className="context-strip">
        <span>
          Submitted {timestampLabel(item.createdAt)} · Processed{" "}
          {timestampLabel(item.reviewedAt!)}
        </span>
        <DemoLabel />
      </div>
      <div className="history-layout">
        <div>
          <section className="card history-section">
            <CardHeading
              title="Original Request Summary"
              subtitle="Evidence preserved at the time of the original request"
            />
            <div className="card-body">
              <h3>{item.summary}</h3>
              <Evidence item={item} />
              <div className="suggestion-card">
                <h3>Original recommendation</h3>
                <p>{item.rationale}</p>
              </div>
            </div>
          </section>
          <section className="card history-section">
            <CardHeading title="Administrator Decision" />
            <div className="card-body">
              <div className="reviewer">
                <UserRound size={22} />
                <div>
                  <strong>Facility Administrator</strong>
                  <span>{timestampLabel(item.reviewedAt!)}</span>
                </div>
                <Badge
                  tone={item.status === "COMPLETED" ? "success" : "neutral"}
                >
                  {item.status === "COMPLETED" ? "Approved" : "Rejected"}
                </Badge>
              </div>
              {item.reason && (
                <p>
                  <strong>Reason:</strong> {item.reason}
                </p>
              )}
              <p>{item.comment || "No administrator comment provided."}</p>
            </div>
          </section>
          <section className="card history-section">
            <CardHeading title="Applied Facility Configuration" />
            <div className="card-body">
              {item.config ? (
                <ConfigurationSummary config={item.config} />
              ) : (
                <div className="notice">
                  No facility configuration was applied because the request was
                  rejected.
                </div>
              )}
              <p className="muted">
                Read-only saved snapshot · No real HVAC commands were
                transmitted.
              </p>
            </div>
          </section>
        </div>
        <section className="card timeline-card">
          <CardHeading
            title="Workflow Timeline"
            subtitle="The recorded decision journey"
          />
          <ol className="timeline">
            {item.timeline?.map((e, i) => (
              <li key={i}>
                <i>
                  <Check size={11} />
                </i>
                <strong>{e.title}</strong>
                <span>{timestampLabel(e.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
