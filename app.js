var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var jwt = require("jsonwebtoken");
var dotenv = require("dotenv");
var mongoose = require("mongoose");

dotenv.config();
const { MongoClient } = require("mongodb");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var testAPIRouter = require("./routes/testAPI");
var capitalizationAPIRouter = require("./routes/capitalizationAPI");
var signUpRouter = require("./routes/signUp");
var signInRouter = require("./routes/signIn");
var resetPasswordRouter = require("./routes/resetPassword");
var connectServiceRouter = require("./routes/connectService");
var disconnectServiceRouter = require("./routes/disconnectService");
var getServicesRouter = require("./routes/getServices");
var saveMessageRouter = require("./routes/saveMessage");
var searchHistoryRouter = require("./routes/searchHistory");
var searchRouter = require("./routes/search");
var changeNameRouter = require("./routes/changeName");
var changeEmailRouter = require("./routes/changeEmail");
var changePasswordRouter = require("./routes/changePassword");
var settingsRouter = require("./routes/settings");
var getProfileRouter = require("./routes/getProfile");
var deleteAccountRouter = require("./routes/deleteAccount");
var getNumAccountsRouter = require("./routes/getNumAccounts");
var adminRouter = require("./routes/admin");
var app = express();

var userModel = require("./schemas/user");
var { SearchResult } = require("./schemas/searchResult");
var settingsModel = require("./schemas/settings");
var signInModel = require("./schemas/signIn");

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.0asnqmt.mongodb.net/?retryWrites=true&w=majority`;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected Successfully");
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(async function (req, res, next) {
  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "JWT"
  ) {
    jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.SECRET_KEY,
      async function (err, decode) {
        if (err) req.user = undefined;
        else {
          const dbUser = await userModel.findOne(decode);
          if (dbUser) {
            req.user = dbUser;
          }
        }

        next();
      }
    );
  } else {
    req.user = undefined;
    next();
  }
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/testAPI", testAPIRouter);
app.use("/capitalize", capitalizationAPIRouter);
app.use("/signUp", signUpRouter);
app.use("/signIn", signInRouter);
app.use("/resetPassword", resetPasswordRouter);
// TODO: POST, GET, DELETE services instead of multiple routes
app.use("/connectService", connectServiceRouter);
app.use("/disconnectService", disconnectServiceRouter);
app.use("/services", getServicesRouter);
app.use("/saveMessage", saveMessageRouter);
app.use("/searchHistory", searchHistoryRouter);
app.use("/search", searchRouter);
app.use("/changeName", changeNameRouter);
app.use("/changeEmail", changeEmailRouter);
app.use("/changePassword", changePasswordRouter);
app.use("/settings", settingsRouter);
app.use("/profile", getProfileRouter);
app.use("/deleteAccount", deleteAccountRouter);
app.use("/getNumAccounts", getNumAccountsRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
