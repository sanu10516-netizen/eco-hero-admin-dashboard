import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    ["🏠", "Dashboard", "/dashboard"],
    ["👥", "Players", "/players"],
    ["🎮", "Game Content", "/game-content"],
    ["💬", "Community", "/community"],
    ["📝", "Questionnaire", "/questionnaire"],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">🌿</div>
        <div>
          <h2>Eco Hero</h2>
          <p>Admin Panel</p>
        </div>
      </div>

      <nav>
        {menu.map((item) => (
          <button
            key={item[2]}
            className={location.pathname === item[2] ? "menu-item active" : "menu-item"}
            onClick={() => navigate(item[2])}
          >
            <span>{item[0]}</span>
            {item[1]}
          </button>
        ))}
      </nav>

      <button className="logout" onClick={() => navigate("/")}>
        🚪 Logout
      </button>
    </aside>
  );
}

export default Sidebar;