var express = require("express");
let userModel = require("../schemas/user");
const jwt = require("jsonwebtoken");

var router = express.Router();

router.post("/", async function(req, res, next){
    const { email } = req.body;
    if(!email){
        return res.status(400).json({
            status: "error",
            data: null,
            message: "Missing email in Delete Request API call"
        })
    }
    let user = await userModel.findOne(({
        email: email
    }))
    if(!user){
        return res.status(401).json({
            status: "error",
            data: null,
            message: "No user with that email exists"
        })
    }

    let deleted = await userModel.deleteOne({
        email: email
    })
    if(!deleted || deleted.deletedCount != 1){
        return res.status(400).json({
            status: "error",
            data: null,
            message: "Unable to delete that user"
        })
    }

    return res.status(200).json({
        status: "success",
        data: user,
        message: "Successfully deleted account"
    })

})

module.exports = router;