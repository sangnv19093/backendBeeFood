var express = require("express");
var router = express.Router();
var restaurant = require("../controllers/restautant.controller");

router.get("/listrestaurant", restaurant.getListRestaurant);
router.get("/res/listproduct/search", restaurant.searchProductOnListProduct);
router.get("/listrestaurant/search", restaurant.searchRestaurant);
router.post("/check-register", restaurant.checkRegister);
router.get("/profile/:id", restaurant.getProfile);

module.exports = router;
