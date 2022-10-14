import { Box, Card, LinearProgress } from "@mui/material";

export default function FullPageCard({ loading, navbar, children }) {
  return (
    <Box
      className={navbar ? "navbarpage" : ""}
      sx={{
        height: navbar ? undefined : "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        variant="outlined"
        sx={{
          marginX: 2,
          paddingX: 5,
          paddingBottom: 5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 1,
          position: "relative",
          opacity: loading ? "0.7" : "1",
          maxWidth: 400,
        }}
      >
        <LinearProgress
          sx={{
            marginX: -5,
            visibility: loading ? "visible" : "hidden",
            opacity: "100%",
          }}
        />
        {children}
      </Card>
    </Box>
  );
}
