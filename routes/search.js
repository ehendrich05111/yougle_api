var express = require("express");
var router = express.Router();
const { WebClient } = require("@slack/web-api");
const adminDataModel = require("../schemas/adminData");
const User = require("../schemas/user");
const fetch = require("node-fetch");


async function getTeamsMessages(token, id, query){
  const chats_response = await fetch("https://graph.microsoft.com/v1.0/me/chats", {
    method: "GET",
    headers: {
      "Authorization": token
    }
  });
  const chats = await chats_response.json();
  if(!chats_response.ok){
    if(chats.error.code === "InvalidAuthenticationToken"){
      throw new Error("Expired token. You may need to re-add a token by going to the Add Services page.")
    }
  }
  let filtered_messages = []
  for(const chat of chats.value){

    let chat_id = chat.id;
    if(chat.chatType == "oneOnOne"){

      let other_person = ""
      const chat_members = await fetch("https://graph.microsoft.com/v1.0/me/chats/" + chat_id + "/members", {
        method: "GET",
        headers: {
          "Authorization": token
        }
      })
      const chat_members_json = await chat_members.json()
      for(const chat_member of chat_members_json.value){
        //there are really only 2 people in a oneOnOne chat
        if(chat_member.userId != id){
          other_person = chat_member.displayName
          break;
        }
      }
      

      const chat_messages = await fetch("https://graph.microsoft.com/v1.0/me/chats/" + chat_id + "/messages", {
        method: "GET",
        headers: {
          "Authorization": token,
        }
      })
      const messages = await chat_messages.json()
      messages.value.forEach((message) => {
        if(message.from !== null && message.body.content.includes(query)){
          author = message.from.user.displayName;
          filtered_messages.push({
            teamName: "Microsoft Teams",
            text: message.body.content,
            channel: "Private Chat with " + other_person,
            timestamp: Date.parse(message.createdDateTime) / 1000,
            username: message.from.user.displayName,
            permalink: message.webUrl,
            service: "Teams"
          })
        }
      });
    }
  }
  return filtered_messages;
}

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
    console.log(match.ts);
    return {
      teamName: teamName,
      text: match.text,
      channel: match.channel.name,
      timestamp: parseInt(match.ts),
      username: match.username,
      permalink: match.permalink,
      service: "Slack"
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
    } else if (cred.service === "Teams" && cred.isActive) {
      return getTeamsMessages(cred.data.accessToken, cred.data.id, queryText);
    }
    return Promise((resolve) => resolve([]));
  });

  var messages = [];
  for (const task of tasks) {
    messages = messages.concat(await task);
  }

  const endTime = new Date().getTime();
  const searchTime = endTime - startTime;

  // update search history
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

  return res.status(200).json({
    status: "success",
    data: { messages, searchTime },
    message: null,
  });
});

module.exports = router;
