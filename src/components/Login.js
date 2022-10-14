import { Box, Button, TextField, Alert } from "@mui/material";
import React from "react";
import logo_full from "../images/logo_full.png";
import FullPageCard from "./FullPageCard";
import { API_BASE } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  function onLogin(e) {
    e.preventDefault();

    setLoading(true);
    fetch(`${API_BASE}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status !== "success") {
          throw new Error(res.message);
        }

        setLoading(false);
        handleLogin("JWT " + res.data.token);

        res.data.hasServices ? navigate("/") : navigate("/services");
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }

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
        <h2 style={{ textAlign: "center" }}>Sign in</h2>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5em",
        }}
        onSubmit={onLogin}
      >
        <TextField
          label="Email"
          variant="outlined"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          autoComplete="on"
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button sx={{ textTransform: "none" }} href="/forgotpassword">
          Forgot password?
        </Button>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 5 }}>
          <Button variant="outlined" href="/signup">
            Create account
          </Button>
          <Button variant="contained" style={{ float: "right" }} type="submit">
            Let's go!
          </Button>
        </Box>
      </form>
    </FullPageCard>
  );
}
