import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { X, ArrowRight, FlaskConical, Inbox } from "lucide-react";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function DemoLabel({ compact = false }: { compact?: boolean }) {
  return (
    <span className="demo-label">
      <FlaskConical size={13} />
      {compact
        ? "Illustrative data"
        : "Illustrative data · simulated operations"}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function CardHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={25} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function ArrowLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowRight size={15} />
    </button>
  );
}
export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  function labelControls(nodes: ReactNode): ReactNode {
    return Children.map(nodes, (child) => {
      if (!isValidElement(child)) return child;
      const element = child as ReactElement<{
        children?: ReactNode;
        "aria-label"?: string;
        "aria-describedby"?: string;
        "aria-invalid"?: boolean;
      }>;
      if (
        typeof element.type === "string" &&
        ["input", "select", "textarea"].includes(element.type)
      ) {
        return cloneElement(element, {
          "aria-label": element.props["aria-label"] || label,
          "aria-describedby": error ? `${id}-error` : undefined,
          "aria-invalid": !!error,
        });
      }
      return element.props.children
        ? cloneElement(element, {}, labelControls(element.props.children))
        : element;
    });
  }
  return (
    <label className={`field ${error ? "invalid" : ""}`}>
      <span>{label}</span>
      {labelControls(children)}
      {error && (
        <small id={`${id}-error`} className="error">
          {error}
        </small>
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Modal({
  title,
  children,
  onClose,
  locked = false,
  wide = false,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
  wide?: boolean;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!locked) closeRef.current();
      }
      if (e.key === "Tab") {
        const elements = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
        );
        if (!elements?.length) {
          e.preventDefault();
          return;
        }
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [locked]);
  return (
    <div
      className={`modal-overlay ${drawer ? "drawer-overlay" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !locked) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={`${drawer ? "drawer" : "modal"} ${wide ? "wide" : ""}`}
      >
        <div className="modal-heading">
          <h2 id={id}>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            disabled={locked}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Stepper({
  value,
  onChange,
  min = 18,
  max = 30,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className={`temperature-stepper ${disabled ? "disabled" : ""}`}>
      <button
        className="step-button"
        aria-label="Decrease target temperature"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 0.5))}
      >
        −
      </button>
      <div>
        <strong>
          {value.toFixed(1)}
          <span>°C</span>
        </strong>
        <small>Proposed target temperature</small>
      </div>
      <button
        className="step-button"
        aria-label="Increase target temperature"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 0.5))}
      >
        +
      </button>
    </div>
  );
}
