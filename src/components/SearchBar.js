import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import { Paper, InputBase, IconButton } from "@mui/material";
import { API_BASE } from "../api/api";
import { useAuth } from "../contexts/AuthContext";

export function SearchBar(props) {
  const { token } = useAuth();
  const [query, setQuery] = React.useState(props.query || "");

  const submitQuery = () => {
    props.onSubmit(query);
    fetch(
      `${API_BASE}/search?` +
        new URLSearchParams({
          queryText: query,
        }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
      .then((res) => {
        if (res.status === 200) {
          props.onResponse(res);
        } else if (res.status === 401) {
          alert("Please log in first.");
        } else {
          throw new Error();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <Paper
      component="form"
      variant="outlined"
      className="Search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        submitQuery();
      }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search your chats..."
        value={query}
        inputProps={{ "aria-label": "search your chats..." }}
        onChange={(event) => setQuery(event.target.value)}
      />
      <IconButton
        type="button"
        sx={{ p: "10px" }}
        aria-label="search"
        onClick={submitQuery}
      >
        <SearchIcon />
      </IconButton>
    </Paper>
  );
}
