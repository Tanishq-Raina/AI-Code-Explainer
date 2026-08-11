// Inline SVG icons — keeps the app dependency-free
// while still giving us crisp 1.5px stroke icons.
const Icon = ({ children }) => (
  <svg
    className="sidebar-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const DashboardIcon = () => (
  <Icon>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
);

const PracticeIcon = () => (
  <Icon>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </Icon>
);

const ProgressIcon = () => (
  <Icon>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 4 4 5-5" />
  </Icon>
);

const SimulatorIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M7 9h10" />
    <path d="M7 13h5" />
    <circle cx="17" cy="13" r="1.5" />
  </Icon>
);

const BookIcon = () => (
  <Icon>
    <path d="M6 4h12a2 2 0 0 1 2 2v14a1 1 0 0 1-1.4.91L12 17.18l-6.6 3.73A1 1 0 0 1 4 20V6a2 2 0 0 1 2-2z" />
    <path d="M6 6v14l6-3.4L18 20V6" />
  </Icon>
);

const VideoIcon = () => (
  <Icon>
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <polygon points="10 9 15 12 10 15" fill="currentColor" stroke="none" />
    <line x1="6" y1="21" x2="18" y2="21" />
  </Icon>
);

const SparkleIcon = () => (
  <Icon>
    <path d="M12 3l1.8 4.8L18 9.5l-4.2 1.7L12 16l-1.8-4.8L6 9.5l4.2-1.7L12 3z" />
    <path d="M19 14l.8 2 2 .8-2 .8L19 19.5l-.8-1.9-2-.8 2-.8L19 14z" />
  </Icon>
);

const menuItems = [
  { label: "Dashboard", icon: DashboardIcon },
  { label: "Practice", icon: PracticeIcon },
  { label: "Progress", icon: ProgressIcon },
  { label: "Simulator", icon: SimulatorIcon },
  { label: "Study", icon: BookIcon },
  { label: "Video Gen", icon: VideoIcon },
];

function Sidebar({ activePage, setActivePage, onToggle }) {
  return (
    <aside className="sidebar">
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label="Hide sidebar"
        title="Hide sidebar"
      >
        ◀
      </button>

      <div className="sidebar-brand">
        <div className="sidebar-logo-mark">{"{C}"}</div>
        <div className="sidebar-brand-text">
          <h2>Codexa AI</h2>
          <p>Java Tutor</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>
        {menuItems.map(({ label, icon: IconCmp }) => (
          <button
            key={label}
            className={`sidebar-link ${activePage === label ? "active" : ""}`}
            onClick={() => setActivePage(label)}
          >
            <IconCmp />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-dot" />
          <span>AI ONLINE</span>
        </div>
        <p className="sidebar-footer-text">
          Powered by LM Studio &amp; Java engine
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
