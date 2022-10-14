import { CircularProgress } from "@mui/material";
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../api/api";
import { useAuth } from "../contexts/AuthContext";

function connectService(serviceName, code, token) {
  return fetch(`${API_BASE}/connectService`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      serviceName: serviceName,
      code: code,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status !== "success") {
        throw new Error(res.message);
      }
      return res;
    });
}

export default function OAuthCallback(props) {
  const { token } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  React.useEffect(() => {
    connectService(props.serviceName, code, token)
      .then(() => {
        navigate("/services");
      })
      .catch((err) => {
        setLoading(false);
        setErrorMessage(err.message);
      });
  }, [code, navigate, props.serviceName, token]);

  return loading ? (
    <CircularProgress />
  ) : (
    <p>Error connecting to Slack. Error: {errorMessage}</p>
  );
}
