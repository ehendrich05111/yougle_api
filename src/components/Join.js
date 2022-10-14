import React, { useEffect } from "react";
import { API_BASE } from "../api/api";
import FullPageCard from "./FullPageCard";
import logo_full from "../images/logo_full.png";
import { Checkbox, FormControlLabel } from "@mui/material";
import { Box, Button, TextField, Alert } from "@mui/material";

export default function Join() {
  // TODO: allow form to be submitted with enter

  const [email, setEmail] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confPass, setConfPass] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [errorText, setErrorText] = React.useState("");
  const [successText, setSuccessText] = React.useState("");

  const [terms, setTerms] = React.useState(false);
  const [filled, setFilled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const [passMatch, setPassMatch] = React.useState(false);
  const [displayErr, setDisplayErr] = React.useState(false);

  // Only re-render DOM if the following criteria is met:
  // 1. The confirmation password field changes so that password mismatch
  //    error is displayed correctly.
  // 2. Other fields are missing so that the missing information error is
  //    is displayed correctly.
  useEffect(() => {
    if (confPass) {
      setPassMatch(confPass === password);
    }
    firstName && lastName && email ? setFilled(true) : setFilled(false);
  }, [password, confPass, email, firstName, lastName]);

  // Helper function to handle passage of data to and from backend
  const handleSubmit = () => {
    setDisplayErr(true);
    setErrorText("");
    setSuccessText("");

    if (!passMatch || !terms || !filled) {
      setLoading(false);
    } else {
      setLoading(true);
      fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status !== "success") {
            throw new Error(res.message);
          }
          setLoading(false);
          setSuccessText(res.message);
        })
        .catch((err) => {
          setLoading(false);
          setErrorText(err.message);
        });
    }
  };

  // Rendered element
  return (
    <FullPageCard loading={loading}>
      <div className="Main-card">
        <img
          src={logo_full}
          alt="Yougle logo"
          style={{ height: "4vw", padding: "1.5em 0 0" }}
        />
        <p
          style={{
            textAlign: "center",
            fontSize: "1.8em",
            padding: "0 0 0.5em",
          }}
        >
          Create your Yougle Account
        </p>
      </div>
      <form className="Col-box">
        {/* All the errors */}
        {displayErr && !passMatch && !password && (
          <Alert severity="warning">Please enter a password.</Alert>
        )}
        {displayErr && !filled && (
          <Alert severity="warning">Please fill in all the fields</Alert>
        )}
        {displayErr && !passMatch && (
          <Alert severity="warning">Passwords do not match.</Alert>
        )}
        {displayErr && clicked && !terms && (
          <Alert severity="info">
            Please agree to the lack of terms and conditions
          </Alert>
        )}
        {errorText && <Alert severity="error">{errorText}</Alert>}
        {successText && <Alert severity="success">{successText}</Alert>}
        {/* End errors */}
        <Box className="Row-box">
          <TextField
            label="First name"
            variant="outlined"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <TextField
            label="Last name"
            variant="outlined"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </Box>
        <TextField
          label="Email"
          variant="outlined"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={{ width: "100%" }}
          required
        />
        <Box className="Pass-box">
          <Box className="Row-box">
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              value={password}
              required
              onChange={(event) => setPassword(event.target.value)}
            />
            <TextField
              label="Confirm Password"
              variant="outlined"
              type="password"
              value={confPass}
              required
              onChange={(e) => {
                setConfPass(e.target.value);
              }}
            />
          </Box>
          <p style={{ fontSize: "0.8em" }}>
            Use 8 or more characters with a mix of letters, numbers, and symbols
          </p>
        </Box>
        <FormControlLabel
          control={<Checkbox onChange={(e) => setTerms(e.target.checked)} />}
          label="I agree to a lack of terms and conditions"
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 5,
          }}
        >
          <Button variant="outlined" style={{ float: "left" }} href="/login">
            Sign in instead
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setClicked(true);
              handleSubmit();
            }}
          >
            Start searching!
          </Button>
        </Box>
      </form>
    </FullPageCard>
  );
}
