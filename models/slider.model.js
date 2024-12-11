const { default: mongoose } = require("mongoose");
var db = require("./db");

const sliderSchema = new mongoose.Schema(
  {
    image: String,
  },
  {
    collection: "sliders",
    timestamps: true,
  }
);
sliderModel = db.mongoose.model("slider", sliderSchema);
module.exports = {
  sliderModel,
};
