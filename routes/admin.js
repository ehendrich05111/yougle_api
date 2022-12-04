var express = require("express");

var router = express.Router();

router.get("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  if (!req.user.isAdmin) {
    return res.status(402).json({
      status: "error",
      data: null,
      message: "You must be an administrator to access this page."
    })
  }

  return res.status(200).json({
    status: "success",
    data: null,
    message: null,
  });
})

module.exports = router;