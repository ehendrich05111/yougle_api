const mongoose = require("mongoose");

const CredentialSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    required: true,
  },
  service: { type: String, enum: ["slack", "teams", "reddit"], required: true },
  data: mongoose.Schema.Types.Mixed,
});

module.exports = { CredentialSchema };
