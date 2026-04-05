const menuItems = ["Dashboard", "Practice", "History", "Progress"];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Codexa AI</h2>
        <p>Your AI coding tutor</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item}
            className={`sidebar-link ${
              activePage === item ? "active" : ""
            }`}
            onClick={() => setActivePage(item)}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;