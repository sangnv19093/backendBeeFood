const { default: mongoose } = require("mongoose");
var db = require("./db");

const evaluteSchema = new mongoose.Schema(
  {
    star: { type: Number },
    totalEvaluate: { type: Number },
    totalStar: { type: Number },
    average: { type: Number },
  },
  {
    collection: "evaluates",
    timestamps: true,
  }
);
evaluteModel = db.mongoose.model("evaluteModel", evaluteSchema);
module.exports = {
  evaluteModel,
};
