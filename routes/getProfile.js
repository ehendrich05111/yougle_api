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

  return res.status(200).json({
    status: "success",
    data: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
    },
    message: null,
  });
});

module.exports = router;
