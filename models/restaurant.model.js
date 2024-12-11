const { default: mongoose } = require("mongoose");
var db = require("./db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const chuoi_ky_tu_bi_mat = process.env.TOKEN_SEC_KEY;
const bcrypt = require("bcrypt");
const restaurantSchema = new mongoose.Schema(
  {
    name: String,
    account: String,
    password: { type: String, required: true },
    image: String,
    role: { type: String, required: false, default: "user" },
    address: String,
    timeon: String,
    timeoff: String,
    address: String,
    email: String,
    phone: String,
    totalEvaluate: { type: Number, default: 0 },
    totalStar: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
  },
  {
    collection: "restaurants",
    timestamps: true,
  }
);
/**
 * Hàm tạo token để đăng nhập với API
 * @returns {Promise<*>}
 */
restaurantSchema.methods.generateAuthToken = async function () {
  const restaurant = this;
  console.log(restaurant);
  const token = jwt.sign(
    { _id: restaurant._id, account: restaurant.account },
    chuoi_ky_tu_bi_mat
  );

  restaurant.token = token;
  await restaurant.save();
  return token;
};

restaurantSchema.statics.findByCredentials = async (account, password) => {
  const restaurant = await restaurantModel.findOne({ account });
  if (!restaurant) {
    throw new Error({ error: "Không tồn tại nhà hàng" });
  }
  const isPasswordMatch = await bcrypt.compare(password, restaurant.password);
  if (!isPasswordMatch) {
    throw new Error({ error: "Sai password" });
  }
  return restaurant;
};

restaurantModel = db.mongoose.model("restaurantModel", restaurantSchema);
module.exports = {
  restaurantModel,
};
