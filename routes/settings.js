var express = require("express");
var router = express.Router();
const userModel = require("../schemas/user");
const { Settings } = require("../schemas/settings");

router.get("/", async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        data: null,
        message: "Please log in first!",
      });
    }

    return res.status(200).json({
      status: "success",
      data: req.user.settings.toJSON(),
      message: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong on our side",
    });
  }
});

router.put("/", async function (req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Please provide settings",
    });
  }

  try {
    const settings = new Settings(req.body);
    const error = settings.validateSync();
    if (error) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: error.toString(),
      });
    }

    await userModel.updateOne(
      { _id: req.user._id },
      { $set: { settings: req.body } }
    );

    return res.status(200).json({
      status: "success",
      data: null,
      message: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
});

module.exports = router;
