const mongoose = require("mongoose");

const SearchResultSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  result: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  reference: {
    type: String,
    required: true,
  },
});

const SearchResult = mongoose.model("SearchResult", SearchResultSchema);

module.exports = { SearchResult, SearchResultSchema };
