import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialState } from "./data";
import type { Approval, Configuration, Rule, State } from "./types";
const KEY = "hku-cooling-workbench-v1";
function load(): State {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      value?.version === 1 &&
      Array.isArray(value.approvals) &&
      Array.isArray(value.rules) &&
      Array.isArray(value.activities)
    )
      return value;
  } catch {
    /* Use seed data if unavailable; writes are checked on every action. */
  }
  return structuredClone(initialState);
}
interface Store {
  state: State;
  toast: string;
  notify: (message: string) => void;
  process: (
    id: string,
    config: Configuration | null,
    comment: string,
    reason?: string,
    reviewedAt?: string,
  ) => boolean;
  saveRule: (rule: Rule) => boolean;
  toggleRule: (id: string) => boolean;
  reset: () => void;
}
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);
  const ref = useRef(state);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 5000);
  };
  const commit = (next: State) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      ref.current = next;
      setState(next);
      return true;
    } catch {
      notify(
        "Could not save locally. Please free browser storage and try again.",
      );
      return false;
    }
  };
  const process: Store["process"] = (
    id,
    config,
    comment,
    reason,
    reviewedAt,
  ) => {
    const current = ref.current;
    const item = current.approvals.find((a) => a.id === id);
    if (!item || item.status !== "PENDING") return false;
    const now = new Date().toISOString();
    const status = config ? "COMPLETED" : "REJECTED";
    const updated: Approval = {
      ...item,
      dataClassification: "SIMULATED",
      status,
      comment,
      reason,
      reviewedAt: now,
      config: config
        ? {
            ...config,
            dataClassification: "SIMULATED",
            mode: config.power === "OFF" ? null : config.mode,
            setpoint: config.power === "OFF" ? null : config.setpoint,
            appliedAt: now,
          }
        : undefined,
      timeline: [
        { title: "Request created", at: item.createdAt },
        { title: "Reviewed by Facility Administrator", at: reviewedAt || now },
        { title: config ? "Approval confirmed" : "Request rejected", at: now },
        ...(config
          ? [
              { title: "Simulated configuration saved", at: now },
              { title: "Workflow completed", at: now },
            ]
          : []),
      ],
    };
    return commit({
      ...current,
      approvals: current.approvals.map((a) => (a.id === id ? updated : a)),
      activities: [
        {
          id: crypto.randomUUID(),
          dataClassification: "SIMULATED",
          at: now,
          title: config
            ? "Cooling configuration approved and saved (simulated)"
            : "Recommendation rejected by Facility Administrator",
          roomId: item.roomId,
          approvalId: id,
          source: "System",
          status,
        },
        ...current.activities,
      ],
    });
  };
  const saveRule = (rule: Rule) => {
    const next = {
      ...rule,
      dataClassification: "SIMULATED" as const,
      name: rule.name.trim(),
      id:
        rule.id ||
        `RUL-${String(Math.max(2, ...ref.current.rules.map((r) => Number(r.id.split("-")[1]) || 0)) + 1).padStart(3, "0")}`,
      updatedAt: new Date().toISOString(),
    };
    return commit({
      ...ref.current,
      rules: rule.id
        ? ref.current.rules.map((r) => (r.id === rule.id ? next : r))
        : [...ref.current.rules, next],
    });
  };
  const toggleRule = (id: string) => {
    const rule = ref.current.rules.find((r) => r.id === id);
    if (!rule || rule.system || rule.status === "DRAFT") return false;
    return saveRule({
      ...rule,
      status: rule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  };
  return (
    <Context.Provider
      value={{
        state,
        toast,
        notify,
        process,
        saveRule,
        toggleRule,
        reset: () => {
          if (commit(structuredClone(initialState)))
            notify(
              "Demo data restored. All five requests are back in the Inbox.",
            );
        },
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
