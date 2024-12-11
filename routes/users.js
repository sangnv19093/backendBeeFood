var express = require("express");
var router = express.Router();
var user = require("../controllers/user.controllers");
var restaurant = require("../controllers/restautant.controller");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/*Authorize*/
router.post("/signup", restaurant.webregister);
router.post("/login", restaurant.weblogin);
router.get("/logout", restaurant.weblogout);

module.exports = router;
