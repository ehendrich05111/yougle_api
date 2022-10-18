const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

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
  } else {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Unrecognized service name",
    });
  }
});

module.exports = router;
