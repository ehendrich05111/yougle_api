var express = require("express");
const app = require("../app");
var router = express.Router();

router.use(express.json());

router.post("/", function (req, res) {
  res.send(req.body.textFieldString.toUpperCase());
});

module.exports = router;
