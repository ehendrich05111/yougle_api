import { Alert, Button, TextField, Typography } from "@mui/material";
import React from "react";
import logo_full from "../images/logo_full.png";
import FullPageCard from "./FullPageCard";
import { API_BASE } from "../api/api";
import { useSearchParams } from "react-router-dom";

export default function ChangePassword() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = React.useState(searchParams.get("code") || "");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // TODO: put this in a form
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
      {success && <Alert severity="success">{success}</Alert>}
      <Typography>Please enter the code you received in your email.</Typography>
      <TextField
        label="Reset code given via email"
        variant="outlined"
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
      <TextField
        label="Email"
        variant="outlined"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextField
        label="New password"
        variant="outlined"
        type="password"
        value={password}
        autoComplete="on"
        onChange={(event) => setPassword(event.target.value)}
      />
      <div>
        <Button
          variant="contained"
          style={{ float: "right" }}
          onClick={() => {
            setLoading(true);
            setError("");
            setSuccess("");

            fetch(`${API_BASE}/resetPassword/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email,
                code: code,
                newPassword: password,
              }),
            })
              .then((res) => res.json())
              .then((res) => {
                if (res.status !== "success") {
                  throw new Error(res.message);
                }
                setLoading(false);
                setSuccess(res.message);
              })
              .catch((err) => {
                setLoading(false);
                setError(err.message);
              });
          }}
        >
          Change password
        </Button>
      </div>
    </FullPageCard>
  );
}
