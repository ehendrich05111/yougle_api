const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { CredentialSchema } = require("./credentials");
const { SettingsSchema } = require("./settings");
const { SearchResultSchema } = require("./searchResult");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  history: {
    type: [String],
    required: true,
  },
  credentials: {
    type: [CredentialSchema],
    required: true,
  },
  savedMessages: {
    type: [SearchResultSchema],
    required: true,
  },
  accountCreated: {
    type: Date,
    required: true,
  },
  lastSignIn: {
    type: Date,
    required: false,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
  settings: {
    type: SettingsSchema,
    required: true,
  },
  numSearches: {
    type: Number,
    required: true,
  },
  tempKey: {
    type: {
      code: String,
      expiresAt: {
        type: Date,
        default: () =>
          new Date(
            new Date().getTime() +
              60000 * parseInt(process.env.PASSWORD_RESET_EXPIRATION_MINUTES)
          ),
      },
    },
  },
});

const User = mongoose.model("User", UserSchema);

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(this.password, password);
};

module.exports = User;
