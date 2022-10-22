const express = require("express");
const fetch = require("node-fetch");
var msal = require("@azure/msal-node");
const router = express.Router();

const msalConfig = {
  auth: {
    clientId: process.env.TEAMS_APP_ID,
    authority: "https://login.microsoftonline.com/common", // + process.env.TEAMS_TENANT_ID,
    clientSecret: process.env.TEAMS_APP_SECRET_VALUE,
  },
  loggerOptions: {
    loggerCallback(loglevel, message, containsPii) {
      console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: "Info",
  },
};

const msalInstance = new msal.ConfidentialClientApplication(msalConfig);

async function connectSlack(user, code, res) {
  try {
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_id=${process.env.SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}&code=${code}&redirect_uri=https%3A%2F%2Fyougle.herokuapp.com%2Fslack_callback`,
    });

    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: data.error,
      });
    }

    if (
      user.credentials &&
      user.credentials.some(
        (cred) => cred.service === "slack" && cred.data.teamId === data.team.id
      )
    ) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Slack account with given team already connected",
      });
    }

    const credential = {
      isActive: true,
      service: "slack",
      data: {
        teamId: data.team.id,
        teamName: data.team.name,
        accessToken: data.authed_user.access_token,
      },
    };
    user.credentials.push(credential);

    await user.save();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }

  return res.status(200).json({
    status: "success",
    data: null,
    message: `Successfully connected to Slack`,
  });
}

async function connectTeams(user, code, res) {
  authCodeRequest = {
    redirectUri: "https://yougle.local.gd:3000/teams_callback",
    code: code,
    scopes: [
      "User.Read",
      "Chat.Read",
      "Chat.ReadWrite",
      // "ChannelMessage.Read.All",
    ],
  };

  const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest);

  try {
    const credential = {
      isActive: true,
      service: "teams",
      data: {
        id: tokenResponse.uniqueId,
        accessToken: tokenResponse.accessToken,
        teamName: tokenResponse.account.username,
      },
    };

    if (
      user.credentials &&
      user.credentials.some(
        (cred) =>
          cred.service === "teams" && cred.data.id === credential.data.id
      )
    ) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Teams account with ID already connected",
      });
    }

    user.credentials.push(credential);
    await user.save();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }

  console.log(user.credentials);
  return res.status(200).json({
    status: "success",
    data: null,
    message: `Successfully connected to Teams`,
  });
}

router.post("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const { serviceName } = req.body;
  if (serviceName === "slack") {
    const { code } = req.body;
    return await connectSlack(req.user, code, res);
  } else if (serviceName === "teams") {
    const { code } = req.body;
    return await connectTeams(req.user, code, res);
  } else {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Unrecognized service name",
    });
  }
});

module.exports = router;
