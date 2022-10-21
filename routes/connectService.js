const express = require("express");
const fetch = require("node-fetch");
var msal = require('@azure/msal-node');
const router = express.Router();
const userModel = require("../schemas/user");


const msalConfig = {
  auth: {
    clientId: process.env.TEAMS_APP_ID,
    authority: "https://login.microsoftonline.com/" + process.env.TEAMS_TENANT_ID,
    clientSecret: process.env.TEAMS_APP_SECRET_VALUE
  },
  loggerOptions: {
    loggerCallback(loglevel, message, containsPii) {
        console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: "Info",
  } 
}

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

router.post("/teamsRedirect", async function (req, res, next){
  if(req.body.state){
    console.log(req);
    //console.log(req.body.state);
    //const state = JSON.parse(cryptoProvider.base64Decode(req.body.state));
    //console.log(req.session);
    //console.log(req.body);

    authCodeRequest = {
      redirectUri: 'http://localhost:9000/connectService/teamsRedirect',
      code: req.body.code,
      scopes: [ 'User.Read', 'Team.ReadBasic.All'],
    }
    const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest);
    console.log("Access token:");
    console.log(tokenResponse);

    try{

      //if the user already has an access token, just replace it

      let email = tokenResponse.account.username;
      const user = await userModel.findOne({ email });
      if (!user) {
        res.redirect("http://localhost:3000/login");
      }
      if (
        user.credentials && user.credentials.some((cred) => cred.service == "Teams")
      ) {
        
        let index = user.credentials.findIndex((cred) => cred.service == "Teams");
        user.credentials[index].data.accessToken = tokenResponse.accessToken;
        user.credentials[index].data.id = tokenResponse.uniqueId;
        user.credentials[index].data.teamName = ""
        user.markModified("credentials");
        await user.save();
        console.log("Successfully replaced user access token!!!!!!");
      } else {

        const credential = {
          isActive: true,
          service: "Teams",
          data: {
            accessToken: tokenResponse.accessToken,
            id: tokenResponse.uniqueId,
            teamName: ""
          },
        };
        user.credentials.push(credential);

        await user.save();
      }
    } catch (error) {
      console.log("There was an error");
      console.log(error);
    }

    res.redirect("http://localhost:3000/login", );

  }
});

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
