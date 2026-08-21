import "../styles/Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <div>
        <h3>Admin Dashboard</h3>
        <p>Manage Eco Hero Adventure</p>
      </div>

      <div className="admin">
        <span>👤</span>
        <div>
          <b>Admin</b>
          <small>Administrator</small>
        </div>
      </div>
    </header>
  );
}

export default Navbar;