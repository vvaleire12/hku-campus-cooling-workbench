import { useEffect, useState } from "react";
import {
  BrowserRouter,
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  UserRound,
  MapPin,
  Leaf,
  ShieldCheck,
  RotateCcw,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { crest } from "./assets";
import { StoreProvider, useStore } from "./store";
import { dateLabel } from "./logic";
import { Modal } from "./components/ui";
import Overview from "./pages/Overview";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import Approvals from "./pages/Approvals";
import History from "./pages/History";
import Rules from "./pages/Rules";
const navigation = [
  { path: "/overview", label: "Overview Dashboard", icon: LayoutDashboard },
  { path: "/buildings-rooms", label: "Buildings & Rooms", icon: Building2 },
  { path: "/approval-center", label: "Approval Center", icon: ClipboardCheck },
  {
    path: "/rules-settings",
    label: "Rules & Settings",
    icon: SlidersHorizontal,
  },
];
function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { state, reset } = useStore();
  const location = useLocation();
  const pending = state.approvals.filter((a) => a.status === "PENDING").length;
  const current =
    navigation.find((n) => location.pathname.startsWith(n.path)) ||
    navigation[0];
  useEffect(() => {
    document.title = `${current.label} · Campus cooling Workbench`;
    setProfile(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname, current.label]);
  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      <header className="brand-header">
        <Link
          to="/overview"
          className="university-brand"
          aria-label="The University of Hong Kong home"
        >
          <img src={crest} alt="HKU coat of arms" />
          <div>
            <span className="university-chinese">香 港 大 學</span>
            <span className="university-english">
              THE UNIVERSITY OF HONG KONG
            </span>
          </div>
        </Link>
        <span className="brand-divider" />
        <Link to="/overview" className="workbench-brand">
          Campus cooling <strong>Workbench</strong>
        </Link>
        <div className="header-right">
          <span className="campus-id">
            <MapPin size={14} />
            HKU Main Campus
          </span>
          <span className="environment-badge">
            <i />
            DEMO ENVIRONMENT
          </span>
          <div className="profile-wrap">
            <button
              className="profile-button"
              aria-label="Administrator profile"
              aria-expanded={profile}
              onClick={() => setProfile(!profile)}
            >
              <span className="avatar">
                <UserRound size={20} />
              </span>
              <span className="profile-name">
                Facility Admin<small>Administrator</small>
              </span>
              <ChevronDown size={13} />
            </button>
            {profile && (
              <div className="profile-menu">
                <strong>Facility Administrator</strong>
                <span>Administrative demo view</span>
                <p>No authentication or real facility access.</p>
                <button
                  onClick={() => {
                    setProfile(false);
                    setResetting(true);
                  }}
                >
                  <RotateCcw size={14} />
                  Reset demo data
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <aside className="sidebar">
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <NavLink
              to={n.path}
              title={n.label}
              aria-label={n.label}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              key={n.path}
            >
              <n.icon size={19} strokeWidth={1.7} />
              <span>{n.label}</span>
              {n.path === "/approval-center" && pending > 0 && (
                <i className="nav-count">{pending}</i>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-purpose">
            <span className="purpose-icon">
              <Leaf size={21} />
            </span>
            <strong>
              A cooler campus.
              <br />A lighter footprint.
            </strong>
            <p>
              Thoughtful operations for
              <br />a more sustainable future.
            </p>
          </div>
          <div className="admin-view">
            <ShieldCheck size={14} />
            <span>Admin View</span>
            <span className="small-dot" />
          </div>
          <button
            className="collapse-button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <div className="workspace-bar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={12} />
            <strong>{current.label}</strong>
            {location.pathname.includes("/rooms/") && (
              <>
                <ChevronRight size={12} />
                <span>Room details</span>
              </>
            )}
          </div>
          <span className="today-label">
            {dateLabel(new Date().toISOString(), {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/buildings-rooms" element={<Rooms />} />
            <Route
              path="/buildings-rooms/rooms/:roomId"
              element={<RoomDetails />}
            />
            <Route path="/approval-center" element={<Approvals />} />
            <Route path="/approval-center/history/:id" element={<History />} />
            <Route path="/rules-settings" element={<Rules />} />
            <Route
              path="/operating-rules"
              element={<Navigate to="/rules-settings" replace />}
            />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Page not found</h1>
                  <Link className="button primary" to="/overview">
                    Return to Overview
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
        <div className="global-footer">
          <span>
            <FlaskConical size={12} />
            Campus cooling Workbench · Prototype v0.1
          </span>
          <span>Illustrative data. No real facility control.</span>
        </div>
      </div>
      {resetting && (
        <Modal
          title="Restore the demonstration?"
          onClose={() => setResetting(false)}
        >
          <div className="modal-body">
            <p>
              This restores the original five pending requests, three historical
              records and two system rules. Your locally saved decisions and
              user-created rules will be removed.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setResetting(false)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                reset();
                setResetting(false);
              }}
            >
              Restore demo data
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;
export default function App() {
  return (
    <Router>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </Router>
  );
}
