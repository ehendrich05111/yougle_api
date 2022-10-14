import React from "react";
import {
  Alert,
  CircularProgress,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Button,
  IconButton,
  Dialog,
} from "@mui/material";
import useSWR from "swr";
import { API_BASE, fetcher } from "../../api/api";
import FullPageCard from "../FullPageCard";
import { Delete } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useSnackbar } from "notistack";

const serviceName = {
  slack: "Slack",
};

export default function Services() {
  const { token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { data, error, mutate } = useSWR(["/services", token], fetcher);
  const [serviceToDisconnect, setServiceToDisconnect] = React.useState(null);

  const serviceInfos = data?.data || [];
  const errorMessage =
    data?.status !== "success" ? error?.message : data?.message;

  function disconnectService() {
    setServiceToDisconnect(null);
    fetch(`${API_BASE}/disconnectService`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        serviceId: serviceToDisconnect._id,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status !== "success") {
          throw new Error(res.message);
        }

        enqueueSnackbar("Service disconnected.", {
          variant: "success",
        });
        mutate({
          ...data,
          data: data.data.filter((s) => s._id !== res.data._id),
        });
      })
      .catch((err) => {
        enqueueSnackbar(`Error disconnecting service: ${err.message}`, {
          variant: "error",
        });
      });
  }

  return (
    <FullPageCard navbar>
      <Dialog
        open={!!serviceToDisconnect}
        onClose={() => setServiceToDisconnect(null)}
      >
        <div style={{ padding: 15 }}>
          <h2>Confirm disconnect</h2>
          <p>
            Are you sure you want to disconect {serviceToDisconnect?.data?.name}
            ?
          </p>
          <div>
            <Button
              variant="outlined"
              onClick={() => setServiceToDisconnect(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ float: "right" }}
              onClick={disconnectService}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Dialog>
      {serviceInfos.length > 0 ? (
        <h2 style={{ textAlign: "center" }}>Manage Services</h2>
      ) : (
        <h2 style={{ textAlign: "center" }}>Add a Service!</h2>
      )}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {!data && !error && <CircularProgress />}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Service</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {serviceInfos.map((serviceInfo) => (
            <TableRow key={serviceInfo._id}>
              <TableCell>
                {serviceName[serviceInfo.service]} - {serviceInfo.name}
              </TableCell>
              <TableCell>
                <IconButton
                  onClick={() => {
                    setServiceToDisconnect(serviceInfo);
                  }}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div style={{ alignSelf: "center" }}>
        <a href="https://slack.com/oauth/v2/authorize?client_id=4150752765812.4141695798086&scope=&user_scope=search:read">
          <img
            alt="Add to Slack"
            height="40"
            width="139"
            src="https://platform.slack-edge.com/img/add_to_slack.png"
            srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
          />
        </a>
      </div>
    </FullPageCard>
  );
}
