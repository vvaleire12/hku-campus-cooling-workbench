import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Maximize, Minus, Plus, ArrowUpRight, MapPinned } from "lucide-react";
import { buildings, rooms } from "../data";
import { campusMap } from "../assets";
import { useStore } from "../store";
import { CardHeading } from "./ui";
export default function CampusMap() {
  const navigate = useNavigate();
  const { state } = useStore();
  const [active, setActive] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const selected = buildings.find((b) => b.id === active);
  const groupRooms = rooms.filter((r) => r.buildingId === active);
  return (
    <section className="card campus-map">
      <CardHeading
        title="A campus-wide perspective"
        subtitle="Explore buildings and their cooling operations"
        action={
          <span className="subtle-tag">
            <MapPinned size={12} /> HKU Main Campus
          </span>
        }
      />
      <div className="map-viewport">
        <div className="map-canvas" style={{ width: `${zoom * 100}%` }}>
          <img
            src={campusMap}
            alt="Original HKU campus map with building abbreviations and roads"
          />
          <svg viewBox="0 0 1283 736" aria-label="Interactive campus buildings">
            <defs>
              {buildings.map((b) => (
                <clipPath key={b.id} id={`clip-${b.id}`}>
                  <path d={b.path} fillRule="evenodd" clipRule="evenodd" />
                </clipPath>
              ))}
            </defs>
            {buildings.map((b) => (
              <g
                key={b.id}
                className={`building-region ${active === b.id ? "highlighted" : ""}`}
                style={{ transformOrigin: `${b.x}px ${b.y}px` }}
                onMouseEnter={() => setActive(b.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(b.id)}
                onBlur={() => setActive(null)}
                onClick={() =>
                  navigate(`/buildings-rooms?buildingId=${b.id}&entry=map`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/buildings-rooms?buildingId=${b.id}&entry=map`);
                  }
                }}
              >
                <image
                  pointerEvents="none"
                  href={campusMap}
                  width="1283"
                  height="736"
                  clipPath={`url(#clip-${b.id})`}
                />
                <path
                  role="link"
                  tabIndex={0}
                  aria-label={`${b.name}, ${rooms.filter((r) => r.buildingId === b.id).length} monitored classrooms`}
                  d={b.path}
                  fillRule="evenodd"
                  className={
                    rooms.some((r) => r.buildingId === b.id)
                      ? "monitored-footprint"
                      : "other-footprint"
                  }
                />
              </g>
            ))}
          </svg>
        </div>
        {selected && (
          <div className="map-tooltip" role="tooltip">
            <div>
              <strong>{selected.id}</strong>
              <ArrowUpRight size={15} />
            </div>
            <p>{selected.name}</p>
            {groupRooms.length ? (
              <>
                <span>{groupRooms.length} monitored classrooms</span>
                <span>
                  {groupRooms.filter((r) => r.power === "ON").length} AC ON ·{" "}
                  {
                    state.approvals.filter(
                      (a) =>
                        a.status === "PENDING" &&
                        groupRooms.some((r) => r.id === a.roomId),
                    ).length
                  }{" "}
                  pending alerts
                </span>
              </>
            ) : (
              <span>No monitored classrooms yet</span>
            )}
          </div>
        )}
        <div className="map-controls">
          <button
            aria-label="Zoom in map"
            disabled={zoom >= 2}
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          >
            <Plus size={15} />
          </button>
          <button
            aria-label="Zoom out map"
            disabled={zoom <= 1}
            onClick={() => setZoom(Math.max(1, zoom - 0.25))}
          >
            <Minus size={15} />
          </button>
          <button aria-label="Reset map zoom" onClick={() => setZoom(1)}>
            <Maximize size={14} />
          </button>
        </div>
        <span className="map-caption">
          Hover to explore · Click a building to view rooms
        </span>
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-square green" /> Monitored buildings
        </span>
        <span>
          <i className="legend-square gray" /> Other campus buildings
        </span>
        <span className="map-count">{buildings.length} building regions</span>
      </div>
    </section>
  );
}
