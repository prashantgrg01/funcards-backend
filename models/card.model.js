const mongoose = require("mongoose");

const cardSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  function_name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  parameters: {
    type: [String],
  },
  example_code: {
    type: String
  }
});

const Card = mongoose.model("Card", cardSchema);
module.exports = Card;