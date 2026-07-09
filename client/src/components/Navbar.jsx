import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  return (
    <header style={{
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky",
      top: 0,
      background: "rgba(10,10,12,0.9)",
      backdropFilter: "blur(8px)",
      zIndex: 100
    }}>
      <nav className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px"
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 32, height: 32, background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "#0a0a0c"
          }}>U</div>
          <span className="font-display" style={{ fontSize: "22px", fontWeight: 700 }}>
            UXGuard <span style={{ color: "var(--accent)" }}>AI</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: "8px" }}>
          <NavLink to="/scan" label="URL Scan" active={location.pathname === "/scan"} />
          <NavLink to="/code" label="Code Analysis" active={location.pathname === "/code"} />
        </div>
      </nav>
    </header>
  );
}

function NavLink({ to, label, active }) {
  return (
    <Link to={to} style={{
      padding: "10px 18px",
      fontSize: "14px",
      fontWeight: 600,
      color: active ? "var(--accent)" : "var(--text-secondary)",
      borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
      transition: "color 0.15s ease"
    }}>
      {label}
    </Link>
  );
}
