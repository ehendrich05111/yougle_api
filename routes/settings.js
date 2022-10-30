var express = require("express");
var router = express.Router();
const userModel = require("../schemas/user");

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

module.exports = router;
