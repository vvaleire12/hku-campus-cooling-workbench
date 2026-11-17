export type DataClassification =
  "ILLUSTRATIVE" | "FIELD_OBSERVED" | "VERIFIED_SOURCE" | "SIMULATED";
export interface Provenance {
  dataClassification: DataClassification;
}
export type Power = "ON" | "OFF";
export type Mode = "COOLING" | "HEATING" | "DEHUMIDIFY" | "ENERGY_SAVING";
export type Status = "PENDING" | "COMPLETED" | "REJECTED";
export type ApprovalType =
  | "COMFORT_FEEDBACK"
  | "SCHEDULE_OPTIMIZATION"
  | "WEATHER_ADJUSTMENT"
  | "RULE_BASED_ALERT";
export interface Building extends Provenance {
  id: string;
  name: string;
  path: string;
  x: number;
  y: number;
}
export interface Room extends Provenance {
  id: string;
  buildingId: string;
  floor: string;
  type: "LECTURE" | "SEMINAR" | "TUTORIAL";
  capacity: number;
  occupied: boolean;
  power: Power;
  temperature: number;
  setpoint: number;
  humidity: number;
}
export interface Schedule extends Provenance {
  id: string;
  roomId: string;
  date: string;
  code: string;
  name: string;
  start: string;
  end: string;
  status: "CONFIRMED" | "CANCELLED";
  expected: "LOW" | "MEDIUM" | "HIGH";
}
export interface Configuration extends Provenance {
  power: Power;
  date: string;
  start: string;
  end: string;
  mode: Mode | null;
  setpoint: number | null;
  appliedAt?: string;
}
export interface TimelineEvent {
  title: string;
  at: string;
}
export interface Approval extends Provenance {
  id: string;
  type: ApprovalType;
  roomId: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: Status;
  createdAt: string;
  summary: string;
  evidence: string[];
  feedback?: [number, number, number];
  feedbackWindow?: [string, string];
  recommendation: Configuration;
  rationale: string;
  comment?: string;
  reason?: string;
  reviewedAt?: string;
  config?: Configuration;
  timeline?: TimelineEvent[];
  ruleId?: string;
}
export type Trigger =
  | "CLASS_SCHEDULE"
  | "ROOM_OCCUPANCY"
  | "INDOOR_TEMPERATURE"
  | "OUTDOOR_TEMPERATURE"
  | "COMFORT_FEEDBACK";
export interface Condition {
  type: Trigger;
  operator: "GT" | "LT";
  value: number;
  expected: string;
  exists: boolean;
  window: number;
  sentiment: "TOO_COLD" | "TOO_WARM";
}
export interface Rule extends Provenance {
  id: string;
  name: string;
  category: string;
  description: string;
  building: string;
  room: string;
  conditions: Condition[];
  power: Power;
  mode: Mode;
  setpoint: number;
  start: string;
  end: string;
  relative: boolean;
  lead: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "DRAFT" | "INACTIVE";
  system: boolean;
  updatedAt: string;
}
export interface Activity extends Provenance {
  id: string;
  at: string;
  title: string;
  roomId: string;
  approvalId?: string;
  source: string;
  status: Status;
}
export interface State {
  version: 1;
  approvals: Approval[];
  rules: Rule[];
  activities: Activity[];
}
