var express = require("express");
const app = require("../app");
var router = express.Router();

router.use(express.json())

router.post("/", function(req, res){
    console.log(req.body);
    console.log(req.user);
    res.send(req.body.textFieldString.toUpperCase())
});

module.exports = router;