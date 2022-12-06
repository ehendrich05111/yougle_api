var express = require("express");
var router = express.Router();
const { WebClient } = require("@slack/web-api");
const adminDataModel = require("../schemas/adminData");
const User = require("../schemas/user");
const fetch = require("node-fetch");
const { convert } = require("html-to-text");

router.get("/teams?", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const user = req.user;
  let teams_account_indeces = [];
  let filtered_messages = [];
  const { queryText } = req.query;
  if (!queryText) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Please provide a query text!",
    });
  }

  user.credentials.forEach((service, i) => {
    if (service.isActive && service.service === "teams") {
      teams_account_indeces.push(i);
    }
  });

  if (teams_account_indeces.length === 0) {
    return res.status(400).json({
      status: "error",
      data: [],
      message: "No Active Teams accounts connected",
    });
  }
  const startTime = new Date().getTime();

  await Promise.all(
    teams_account_indeces.map(async (i) => {
      try {
        let token = user.credentials[i].data.accessToken;
        let id = user.credentials[i].data.id;

        const chats = await fetch(
          "https://graph.microsoft.com/v1.0/search/query",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({
              requests: [
                {
                  entityTypes: ["chatMessage"],
                  query: {
                    queryString: queryText,
                  },
                },
              ],
            }),
          }
        );
        const chatsData = await chats.json();
        hits = chatsData.value[0].hitsContainers[0].hits;

        await Promise.all(
          hits.map(async (message) => {
            const author = message.resource.from.emailAddress.name;
            const { channelId, teamId } = message.resource.channelIdentity;

            let channelName = "Unknown";
            let webUrl = undefined;

            // TODO: batch request for channel name
            if (channelId && teamId) {
              channel = await fetch(
                `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              channelData = await channel.json();
              channelName = channelData.displayName;
              webUrl = channelData.webUrl;
            } else if (channelId) {
              channel = await fetch(
                `https://graph.microsoft.com/v1.0/chats/${channelId}?$expand=members`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              channelData = await channel.json();
              webUrl = channelData.webUrl;
              channelName = channelData.topic;
              if (!channelName) {
                channelName = `Private Message with ${channelData.members
                  .map((member) => member.displayName)
                  .join(", ")}`;
              }
            } else {
              // no channel id or team id - notes with self
              channelName = "You";
            }

            filtered_messages.push({
              id: message.hitId,
              teamName: "Microsoft Teams",
              text: message.summary,
              channel: channelName,
              timestamp: Date.parse(message.resource.createdDateTime) / 1000,
              username: author,
              permalink: webUrl,
              service: "teams",
            });
          })
        );
      } catch (e) {
        console.log(`Error with Teams API (service index ${i}): ${e.message}`);

        return res.status(500).json({
          status: "error",
          data: null,
          message: `Error with Teams API: ${e.message}`,
        });
      }
    })
  );
  const endTime = new Date().getTime();

  const searchTime = endTime - startTime;
  dogstatsd.timing("yougle.teams.search_time", searchTime);
  return res.status(200).json({
    status: "success",
    data: { messages: filtered_messages, searchTime },
    message: "Teams messages matching query returned",
  });
});

const StatsD = require("hot-shots");
const dogstatsd = new StatsD();

router.get("/slack", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const user = req.user;
  let slack_account_indeces = [];
  let messages = [];
  const { queryText, getDirectMessages, getGroupMessages } = req.query;
  if (!queryText) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Please provide a query text!",
    });
  }

  user.credentials.forEach((service, i) => {
    if (service.isActive && service.service === "slack") {
      slack_account_indeces.push(i);
    }
  });

  if (slack_account_indeces.length === 0) {
    return res.status(400).json({
      status: "error",
      data: [],
      message: "No Active Slack accounts connected",
    });
  }

  const startTime = new Date().getTime();

  await Promise.all(
    slack_account_indeces.map(async (i) => {
      try {
        let token = user.credentials[i].data.accessToken;
        let teamName = user.credentials[i].data.teamName;
        // TODO: pagination
        const web = new WebClient(token);

        let result = await web.search.messages({
          query: queryText,
        });
        if (!result.ok) {
          throw new Error("Error with Slack API");
        }

        result.messages.matches.map((match) => {
          if (
            (match.channel.is_private && getDirectMessages === "true") ||
            (!match.channel.is_private && getGroupMessages === "true")
          ) {
            messages.push({
              id: match.permalink,
              teamName: teamName,
              text: match.text,
              channel: match.channel.name,
              timestamp: parseInt(match.ts),
              username: match.username,
              permalink: match.permalink,
              service: "slack",
            });
          }
        });
      } catch (e) {
        console.log(`Error with Slack API (service index ${i}): ${e.message}`);
      }
    })
  );

  const endTime = new Date().getTime();

  const searchTime = endTime - startTime;
  dogstatsd.timing("yougle.slack.search_time", searchTime);

  await adminDataModel.updateOne(
    {
      name: "data",
    },
    {
      $push: { slackSearchTimes: searchTime },
    }
  );

  return res.status(200).json({
    status: "success",
    data: { messages, searchTime },
    message: "Messagges received from Slack",
  });
});

router.get("/reddit?", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const user = req.user;
  let reddit_account_indeces = [];
  let messages = [];
  const { queryText } = req.query;
  if (!queryText) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Please provide a query text!",
    });
  }

  user.credentials.forEach((service, i) => {
    if (service.isActive && service.service === "reddit") {
      reddit_account_indeces.push(i);
    }
  });

  if (reddit_account_indeces.length === 0) {
    return res.status(400).json({
      status: "error",
      data: [],
      message: "No Active Reddit accounts connected",
    });
  }

  const startTime = new Date().getTime();

  await Promise.all(
    reddit_account_indeces.map(async (i) => {
      try {
        let reddit_data = user.credentials[i].data;
        // reddit tokens expire after an hour, so gotta refresh sometimes
        const time_diff = new Date() - user.credentials[i].data.last_refresh;
        const time_diff_min = Math.floor(time_diff / 1000 / 60);
        if (time_diff_min > 50) {
          const authentication_string =
            process.env.NODE_ENV === "production"
              ? `Basic ${btoa(
                  `${process.env.REDDIT_PROD_CLIENT_ID}:${process.env.REDDIT_PROD_CLIENT_SECRET}`
                )}`
              : `Basic ${btoa(
                  `${process.env.REDDIT_DEV_CLIENT_ID}:${process.env.REDDIT_DEV_CLIENT_SECRET}`
                )}`;
          let response = await fetch(
            "https://www.reddit.com/api/v1/access_token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: authentication_string,
              },
              body: `grant_type=refresh_token&refresh_token=${reddit_data.refresh_token}`,
            }
          );
          const new_token_data = await response.json();
          user.credentials[i].data.access_token = new_token_data.access_token;
          reddit_data.access_token = new_token_data.access_token;

          // have to mark modified because mongoose and
          // array changes just don't get along
          user.markModified("credentials");
          await user.save();
        }

        const response = await fetch("https://oauth.reddit.com/message/inbox", {
          method: "GET",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `bearer ${reddit_data.access_token}`,
          },
        });

        const response2 = await fetch("https://oauth.reddit.com/message/sent", {
          method: "GET",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `bearer ${reddit_data.access_token}`,
          },
        });

        const inbox_results = await response.json();
        const sent_results = await response2.json();

        inbox_results.data.children.forEach((message) => {
          if (
            message.data.body.includes(queryText) ||
            message.data.subject.includes(queryText)
          ) {
            messages.push({
              id: message.data.id,
              teamName: "Private Message",
              text: `Subject: ${message.data.subject}\nMessage: ${message.data.body}`,
              channel: message.data.author,
              timestamp: message.data.created,
              username: message.data.author,
              permalink: `https://www.reddit.com/message/messages/${message.data.id}`,
              service: "reddit",
            });
          }
        });

        sent_results.data.children.forEach((message) => {
          if (
            message.data.body.includes(queryText) ||
            message.data.subject.includes(queryText)
          ) {
            messages.push({
              id: message.data.id,
              teamName: "Private Message",
              text: `Subject: ${message.data.subject}\nMessage: ${message.data.body}`,
              channel: message.data.dest,
              timestamp: message.data.created,
              username: message.data.dest,
              permalink: `https://www.reddit.com/message/messages/${message.data.id}`,
              service: "reddit",
            });
          }
        });
      } catch (e) {
        // will allow individual service failures without total failure
        console.log(`Error with Reddit API (service index ${i}): ${e.message}`);
      }
    })
  );

  const endTime = new Date().getTime();

  const searchTime = endTime - startTime;
  dogstatsd.timing("yougle.slack.search_time", searchTime);

  await adminDataModel.updateOne(
    {
      name: "data",
    },
    {
      $push: { redditSearchTimes: searchTime },
    }
  );

  return res.status(200).json({
    status: "success",
    data: { messages, searchTime },
    message: "Results from Reddit",
  });
});

module.exports = router;
