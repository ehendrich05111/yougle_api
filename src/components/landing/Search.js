import React from "react";
import { SearchBar } from "../SearchBar";
import logo_full from "../../images/logo_full.png";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Link,
  Paper,
  Typography,
} from "@mui/material";
import { API_BASE, fetcher } from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";
import useSWR from "swr";
import slack_icon from "../../images/slack_icon.jpeg";
import { Star } from "@mui/icons-material";

function SearchResult({
  teamName,
  text,
  channel,
  timestamp,
  username,
  permalink,
}) {
  // TODO: save message
  const date = new Date(parseInt(timestamp) * 1000);
  return (
    <Paper variant="outlined" sx={{ width: "fit-content", padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "center",
        }}
      >
        <Typography variant="h6">
          {teamName} #{channel}
        </Typography>
        <img
          src={slack_icon}
          alt="Slack logo"
          style={{ objectFit: "contain" }}
        />
        <IconButton variant="small">
          <Star />
        </IconButton>
      </Box>
      <Link href={permalink} target="_blank" rel="noopener noreferrer">
        View in Slack
      </Link>
      <Typography variant="body1">
        {username}, {date.toLocaleDateString()}
      </Typography>
      <Typography variant="body2">{text}</Typography>
    </Paper>
  );
}

export default function Search() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: actually sort by date
  const [sortByDate, setSortByDate] = React.useState(true);
  const query = searchParams.get("q") || "";

  const fetchURL =
    `${API_BASE}/search?` + new URLSearchParams({ queryText: query });

  // TODO: error handling
  const { data } = useSWR(query ? [fetchURL, token] : null, fetcher);

  const searchBar = (
    <SearchBar
      query={query}
      onSubmit={(newQuery) => {
        console.log(newQuery);
        setSearchParams({ q: newQuery });
      }}
    />
  );

  if (!query) {
    return (
      <div className="Main navbarpage">
        <img className="Yougle-logo" src={logo_full} alt="Yougle logo" />
        {searchBar}
      </div>
    );
  }
  return (
    <Box sx={{ margin: 2 }}>
      <Box sx={{ display: "flex", gap: 5 }}>
        <img
          className="Yougle-logo"
          src={logo_full}
          alt="Yougle logo"
          style={{ height: "50px" }}
        />
        {searchBar}
      </Box>
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 1 }}
      >
        {data ? (
          <>
            {
              <Box sx={{ display: "flex", gap: 5, alignItems: "center" }}>
                <Typography>
                  Found {data.data.messages.length} results in{" "}
                  {data.data.searchTime / 1000} seconds
                </Typography>
                <FormGroup sx={{ margin: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        value={sortByDate}
                        onChange={(event) =>
                          setSortByDate(event.target.checked)
                        }
                      />
                    }
                    label="Sort by date?"
                  />
                </FormGroup>
              </Box>
            }
            {data.data.messages.map((result) => (
              <SearchResult key={result.permalink} {...result} />
            ))}
          </>
        ) : null}
      </Box>
    </Box>
  );
}
