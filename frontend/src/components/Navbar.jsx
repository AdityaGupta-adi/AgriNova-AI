import { FaLeaf } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">

      <div className="logo">
        <FaLeaf size={30} />
        <h2>AgriNova AI</h2>
      </div>

      <div className="nav-links">

        <Link to="/">
          🏠 Home
        </Link>

        <Link to="/dashboard">
          📊 Dashboard
        </Link>

        <Link to="/login">
          👤 Login
        </Link>

      </div>

    </nav>
  );
}