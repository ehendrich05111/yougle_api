var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();

router.post("/", async function (req, res, next) {
  try {
    const { searchResult } = req.body;
    if (searchResult) {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          status: "error",
          data: null,
          message: "Please log in first!",
        });
        return;
      }

      if (
        user.savedMessages.some(
          (message) =>
            message.service === searchResult.service &&
            message.id === searchResult.id
        )
      ) {
        res.status(400).json({
          status: "error",
          data: null,
          message: "Message already saved",
        });
        return;
      }

      const result = await userModel.updateOne(
        { _id: user._id },
        { $push: { savedMessages: searchResult } },
        { runValidators: true }
      );
      if (result.modifiedCount) {
        res
          .status(200)
          .json({ status: "success", data: null, message: "Message saved" });
        return;
      } else {
        res.status(500).json({
          status: "error",
          data: null,
          message: "Error connecting to DB",
        });
        return;
      }
    } else {
      res.status(400).json({
        status: "error",
        data: null,
        message: "Error with user information",
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

router.get("/", async function (req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  return res.status(200).json({
    status: "success",
    data: user.savedMessages,
    message: null,
  });
});

router.delete("/", async function (req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const { messageId } = req.query;
  if (!messageId) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Missing message ID",
    });
  }

  try {
    const result = await userModel.updateOne(
      { _id: user._id },
      { $pull: { savedMessages: { _id: messageId } } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({
        status: "error",
        data: null,
        message: "Message not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
  return res.status(200).json({
    status: "success",
    data: user.savedMessages,
    message: null,
  });
});

module.exports = router;
