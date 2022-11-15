var express = require("express");
var router = express.Router();
const { WebClient } = require("@slack/web-api");
const adminDataModel = require("../schemas/adminData");
const User = require("../schemas/user");
const fetch = require("node-fetch");
const { convert } = require("html-to-text");

async function getTeamsMessages(token, id, query) {
  const startTime = new Date().getTime();
  const chats_response = await fetch(
    "https://graph.microsoft.com/v1.0/me/chats",
    {
      method: "GET",
      headers: {
        Authorization: token,
      },
    }
  );
  const chats = await chats_response.json();
  if (!chats_response.ok) {
    if (chats.error.code === "InvalidAuthenticationToken") {
      throw new Error(
        "Expired token. You may need to re-add a token by going to the Add Services page."
      );
    }
  }
  let filtered_messages = [];
  for (const chat of chats.value) {
    let chat_id = chat.id;
    if (chat.chatType == "oneOnOne") {
      let other_person = "";
      const chat_members = await fetch(
        "https://graph.microsoft.com/v1.0/me/chats/" + chat_id + "/members",
        {
          method: "GET",
          headers: {
            Authorization: token,
          },
        }
      );
      const chat_members_json = await chat_members.json();
      for (const chat_member of chat_members_json.value) {
        //there are really only 2 people in a oneOnOne chat
        if (chat_member.userId != id) {
          other_person = chat_member.displayName;
          break;
        }
      }

      const chat_messages = await fetch(
        "https://graph.microsoft.com/v1.0/me/chats/" + chat_id + "/messages",
        {
          method: "GET",
          headers: {
            Authorization: token,
          },
        }
      );
      const messages = await chat_messages.json();
      messages.value.forEach((message) => {
        if (message.from !== null && message.body.content.includes(query)) {
          author = message.from.user.displayName;
          filtered_messages.push({
            id: message.id,
            teamName: "Microsoft Teams",
            text: convert(message.body.content),
            channel: "Private Chat with " + other_person,
            timestamp: Date.parse(message.createdDateTime) / 1000,
            username: message.from.user.displayName,
            permalink: message.webUrl,
            service: "teams",
          });
        }
      });
    }
  }
  const endTime = new Date().getTime();

  const searchTime = endTime - startTime;
  dogstatsd.timing("yougle.teams.search_time", searchTime);
  return filtered_messages;
}

const StatsD = require("hot-shots");
const dogstatsd = new StatsD();

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
  dogstatsd.timing("yougle.slack.search_time", searchTime);

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
      id: match.permalink,
      teamName: teamName,
      text: match.text,
      channel: match.channel.name,
      timestamp: parseInt(match.ts),
      username: match.username,
      permalink: match.permalink,
      service: "slack",
    };
  });
}

async function getRedditMessages(redditData, user, idx, query) {
  const startTime = new Date().getTime();

  // slack tokens expire after an hour, so gotta refresh sometimes
  const time_diff = new Date() - user.credentials[idx].data.last_refresh;
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
    let response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authentication_string,
      },
      body: `grant_type=refresh_token&refresh_token=${redditData.refresh_token}`,
    });
    const new_token_data = await response.json();
    user.credentials[idx].data.access_token = new_token_data.access_token;
    redditData.access_token = new_token_data.access_token;

    // have to mark modified because mongoose and
    // array changes just don't get along
    user.markModified("credentials");
    await user.save();
  }

  const response = await fetch("https://oauth.reddit.com/message/inbox", {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `bearer ${redditData.access_token}`,
    },
  });

  const response2 = await fetch("https://oauth.reddit.com/message/sent", {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `bearer ${redditData.access_token}`,
    },
  });

  const inbox_results = await response.json();
  const sent_results = await response2.json();

  let search_results = [];

  inbox_results.data.children.forEach((message) => {
    if (
      message.data.body.includes(query) ||
      message.data.subject.includes(query)
    ) {
      search_results.push({
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
      message.data.body.includes(query) ||
      message.data.subject.includes(query)
    ) {
      search_results.push({
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

  return search_results;
}

router.get("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const { queryText, searchSlack, searchTeams } = req.query;

  if (!queryText) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Please provide a query text!",
    });
  }

  const user = req.user;
  const startTime = new Date().getTime();

  var taskMessages = [];
  try {
    taskMessages = await Promise.all(
      user.credentials.map(async (cred, idx) => {
        try {
          if (
            cred.service === "slack" &&
            cred.isActive &&
            searchSlack === "true"
          ) {
            return await getSlackMessages(
              cred.data.accessToken,
              cred.data.teamName,
              queryText
            );
          } else if (
            cred.service === "teams" &&
            cred.isActive &&
            searchTeams === "true"
          ) {
            return await getTeamsMessages(
              cred.data.accessToken,
              cred.data.id,
              queryText
            );
          } else if (cred.service === "reddit" && cred.isActive) {
            return await getRedditMessages(cred.data, user, idx, queryText);
          }
        } catch (e) {
          throw new Error(
            `Error with ${cred.service} API (service index ${idx}): ${e.message}`
          );
        }
        return new Promise((resolve) => resolve([]));
      })
    );
  } catch (e) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: e.message,
    });
  }

  const messages = taskMessages.flat();

  const endTime = new Date().getTime();
  const searchTime = endTime - startTime;
  dogstatsd.timing("yougle.search.time", searchTime);
  dogstatsd.distribution("yougle.search.results", messages.length);

  // update search history
  if (user.settings.trackHistory) {
    try {
      await User.updateOne(
        {
          _id: user._id,
        },
        {
          $push: { history: { $each: [queryText], $slice: -100 } },
        }
      );
    } catch (error) {
      return res.status(500).json({
        status: "error",
        data: null,
        message: `Error updating history: ${error.message}`,
      });
    }
  }

  return res.status(200).json({
    status: "success",
    data: { messages, searchTime },
    message: null,
  });
});

module.exports = router;
