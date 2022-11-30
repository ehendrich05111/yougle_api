var express = require("express");

let userModel = require("../schemas/user");

var router = express.Router();

router.post("/deleteSingle", async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Please login first!",
      });
    }

    const { user } = req;
    const idx = req.body.index;

    if (idx === undefined) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "No history element specified",
      });
    }

    if (idx < 0 || idx >= user.history.length) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Index out of range",
      });
    }

    user.history.splice(idx, 1);
    user.markModified("searchHistory");
    await user.save((err, doc) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          data: null,
          message: "Error connecting to Database",
        });
      }
      return res.status(200).json({
        status: "success",
        data: user.history,
        message: "History item removed",
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

router.delete("/", async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Please login first!",
      });
    }

    if (req.user.history.length === 0) {
      return res.status(200).json({
        status: "success",
        data: null,
        message: "Search history already empty",
      });
    }

    const result = await userModel.updateOne(
      { _id: req.user._id },
      { $set: { history: [] } }
    );

    if (result.modifiedCount) {
      return res.status(200).json({
        status: "success",
        data: null,
        message: null,
      });
    } else {
      return res.status(500).json({
        status: "error",
        data: null,
        message: "Error connecting to DB",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

router.get("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }
  let searchHistory = await userModel.findOne(
    { email: req.user.email },
    "history"
  );
  if (!searchHistory) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Error with the database: unable to retrieve search history",
    });
  }
  return res.status(200).json({
    status: "success",
    data: searchHistory,
    message: "Successfully retrieved search history",
  });
});

router.post("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const user = req.user;
  const { query } = req.body;
  if (query === undefined) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Error with request information",
    });
  }

  if (user.settings.trackHistory) {
    try {
      await userModel.updateOne(
        {
          _id: user._id,
        },
        {
          $push: { history: { $each: [query], $slice: -100 } },
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
    data: null,
    message: "History updated",
  });
});

module.exports = router;
