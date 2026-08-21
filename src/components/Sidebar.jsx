import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu = [
    ["🏠", "Dashboard", "/dashboard"],
    ["👥", "Players", "/players"],
    ["🎮", "Game Content", "/game-content"],
    ["💬", "Community", "/community"],
    ["📝", "Questionnaire", "/questionnaire"],
  ];

  const handleMenu = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        className="mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        ⋮
      </button>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          ⋮
        </button>

        <div className="brand">
          <div className="brand-icon">🌿</div>

          {!collapsed && (
            <div>
              <h2>Eco Hero</h2>
              <p>Admin Panel</p>
            </div>
          )}
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item[2]}
              className={
                location.pathname === item[2]
                  ? "menu-item active"
                  : "menu-item"
              }
              onClick={() => handleMenu(item[2])}
              title={collapsed ? item[1] : ""}
            >
              <span>{item[0]}</span>
              {!collapsed && item[1]}
            </button>
          ))}
        </nav>

        <button
          className="logout"
          onClick={() => {
            navigate("/");
            setMobileOpen(false);
          }}
        >
          🚪 {!collapsed && "Logout"}
        </button>
      </aside>
    </>
  );
}

export default Sidebar;