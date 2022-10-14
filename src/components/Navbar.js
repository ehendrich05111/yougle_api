import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { IconButton } from "@mui/material";
import { Logout } from "@mui/icons-material";

export default function Navbar(props) {
  const barColor = props.navColor;

  const { handleLogout } = useAuth();

  const signOut = () => {
    handleLogout();
  };

  return (
    <div className="Navbar" style={{ backgroundColor: barColor }}>
      <div className="Bar">
        <Link to="/search" className="Nav-link">
          Search
        </Link>
        <Link to="/services" className="Nav-link">
          Services
        </Link>
        <Link to="/saved" className="Nav-link">
          Saved
        </Link>
      </div>
      <div id="account-buttons">
        <IconButton onClick={signOut} sx={{ m: 2 }}>
          <Logout />
        </IconButton>
      </div>
    </div>
  );
}
