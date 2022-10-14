import { Alert, Button, TextField, Typography } from "@mui/material";
import React from "react";
import logo_full from "../images/logo_full.png";
import FullPageCard from "./FullPageCard";
import { API_BASE } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  return (
    <FullPageCard loading={loading}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src={logo_full}
          alt="Yougle logo"
          style={{ height: "100px" }}
        ></img>
        <h2 style={{ textAlign: "center" }}>Reset password</h2>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography>
        Enter your email address and we'll send you a link to reset your
        password.
      </Typography>
      <TextField
        label="Email"
        variant="outlined"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button
        sx={{ textTransform: "none" }}
        onClick={() => navigate("/changepassword")}
      >
        Already received a reset code?
      </Button>
      <div>
        <Button
          variant="contained"
          style={{ float: "right" }}
          onClick={() => {
            setLoading(true);
            setError("");

            fetch(`${API_BASE}/resetPassword/requestReset`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email }),
            })
              .then((res) => res.json())
              .then((res) => {
                if (res.status !== "success") {
                  throw new Error(res.message);
                }
                setLoading(false);
                navigate("/changepassword");
              })
              .catch((err) => {
                setLoading(false);
                setError(err.message);
              });
          }}
        >
          Next
        </Button>
      </div>
    </FullPageCard>
  );
}
