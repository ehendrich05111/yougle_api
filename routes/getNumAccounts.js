var express = require("express");

let userModel = require("../schemas/user");

var router = express.Router();

router.get("/", async function(req, res, next){
    if (req.user === undefined) {
        return res.status(401).json({
          status: "error",
          data: null,
          message: "Please log in first!",
        });
    }
    if(!req.user.isAdmin){
        return res.status(402).json({
            status: "error",
            data: null,
            message: "You must be an administrator to access this"
        })
    }
    try {
        const {start, end} = req.body;
        //start and end are seconds since the epoch
        //if they are provided in the body, then we search between 
        //the start and end dates, otherwise we just return all
        //docs

        let numAccounts;
        if(start !== undefined && end !== undefined){
            numAccounts = await userModel.countDocuments({
                accountCreated: {

                    $gte: new Date(start * 1000),
                    $lte: new Date(end * 1000)
                }
            })
        } else {
            numAccounts = await userModel.countDocuments();
        }
        return res.status(200).json({
            status: "success",
            data: numAccounts,
            message: "Successfully retrieved the number of accounts"
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "error",
            data: null,
            message: "Unknown error"
        })
    }
})

module.exports = router;