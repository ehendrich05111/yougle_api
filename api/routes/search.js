var express = require("express");
var router = express.Router();
const { WebClient } = require("@slack/web-api");
let adminDataModel = require("../schemas/adminData");

async function getSlackMessages(token, teamName, query) {
  // TODO: pagination
  const web = new WebClient(token);

  const startTime = new Date().getTime();
  const result = await web.search.messages({
    query: query,
  });
  if (!result.ok) {
    throw new Error("Error with Slack API");
  }

  const endTime = new Date().getTime();

  const searchTime = endTime - startTime;
  await adminDataModel.updateOne(
    {
      name: "data",
    },
    {
      $push: { slackSearchTimes: searchTime },
    }
  );

  return result.messages.matches.map((match) => {
    return {
      teamName: teamName,
      text: match.text,
      channel: match.channel.name,
      timestamp: match.ts,
      username: match.username,
      permalink: match.permalink,
    };
  });
}

router.get("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const { queryText } = req.query;
  if (!queryText) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Please provide a query text!",
    });
  }

  const user = req.user;
  const startTime = new Date().getTime();

  const tasks = user.credentials.map((cred) => {
    if (cred.service === "slack" && cred.isActive) {
      return getSlackMessages(
        cred.data.accessToken,
        cred.data.teamName,
        queryText
      );
    }
    return Promise((resolve) => resolve([]));
  });

  var messages = [];
  for (const task of tasks) {
    messages = messages.concat(await task);
  }

  const endTime = new Date().getTime();
  const searchTime = endTime - startTime;

  return res.status(200).json({
    status: "success",
    data: { messages, searchTime },
    message: null,
  });
});

module.exports = router;
