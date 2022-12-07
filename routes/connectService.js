const express = require("express");
const fetch = require("node-fetch");
var msal = require("@azure/msal-node");
const router = express.Router();

const msalConfig = {
  auth: {
    clientId: process.env.TEAMS_APP_ID,
    authority:
      "https://login.microsoftonline.com/" + process.env.TEAMS_TENANT_ID,
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
    const redirectUri =
      process.env.NODE_ENV === "production"
        ? "https%3a%2f%2fyougle.herokuapp.com%2fslack_callback"
        : "https%3a%2f%2fyougle.local.gd%3a3000%2fslack_callback";
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_id=${process.env.SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}&code=${code}&redirect_uri=${redirectUri}`,
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
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://yougle.herokuapp.com/teams_callback"
      : "https://yougle.local.gd:3000/teams_callback";
  authCodeRequest = {
    redirectUri: redirectUri,
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

  return res.status(200).json({
    status: "success",
    data: null,
    message: `Successfully connected to Teams`,
  });
}

async function connectReddit(user, code, res) {
  try {
    const redirect_uri =
      process.env.NODE_ENV === "production"
        ? "https%3a%2f%2fyougle.herokuapp.com%2freddit_callback"
        : "https%3a%2f%2fyougle.local.gd%3a3000%2freddit_callback";

    const authentication_string =
      process.env.NODE_ENV === "production"
        ? `Basic ${btoa(
            `${process.env.REDDIT_PROD_CLIENT_ID}:${process.env.REDDIT_PROD_CLIENT_SECRET}`
          )}`
        : `Basic ${btoa(
            `${process.env.REDDIT_DEV_CLIENT_ID}:${process.env.REDDIT_DEV_CLIENT_SECRET}`
          )}`;
    let response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authentication_string,
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`,
    });
    const reddit_token_data = await response.json();

    response = await fetch("https://oauth.reddit.com/api/v1/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `bearer ${reddit_token_data.access_token}`,
      },
    });
    const user_reddit_data = await response.json();

    const existing_account = user.credentials.find(
      (credential) =>
        credential.service === "reddit" &&
        credential.data.name === user_reddit_data.name
    );

    if (existing_account) {
      return res.status(400).json({
        status: "failure",
        data: null,
        message: "The user has already connected with this Reddit Account",
      });
    }

    const credential = {
      isActive: true,
      service: "reddit",
      data: {
        name: user_reddit_data.name,
        access_token: reddit_token_data.access_token,
        refresh_token: reddit_token_data.refresh_token,
        last_refresh: new Date(),
      },
    };
    user.credentials.push(credential);

    const updated_user = await user.save();
    const success = updated_user.credentials.find(
      (credential) =>
        credential.service === "reddit" &&
        credential.data.name === user_reddit_data.name
    );

    if (success) {
      return res.status(200).json({
        status: "success",
        data: null,
        message: "Account added",
      });
    } else {
      return res.status(500).json({
        status: "failure",
        data: null,
        message: "Unable to save credentials to database",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failure",
      message: "Something went wrong connecting to Reddit",
      data: null,
    });
  }
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
  } else if (serviceName === "reddit") {
    const { code } = req.body;
    return await connectReddit(req.user, code, res);
  } else {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Unrecognized service name",
    });
  }
});

module.exports = router;
