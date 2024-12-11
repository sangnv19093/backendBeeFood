var express = require("express");
const router = express.Router();
const moment = require("moment");
const multer = require("multer");

var apiU = require("../controllers/user.controllers");
var apiOder = require("../controllers/orderControllers");
var apiVoucher = require("../controllers/voucher.controller");

var apiHistory = require("../controllers/historyOrderController");
var apiSlider = require("../controllers/slider.controller");
var apiComment = require("../controllers/comment.controller");
var apiRestaurant = require("../controllers/restautant.controller");
var apiProduct = require("../controllers/product.controller");
var apiRestaurant = require("../controllers/restautant.controller");
var apiSanPhamDangDuyet = require("../controllers/sanPhamDangDuyet.controller");
var hisToryModel = require("../models/history");
var apifavorite = require("../controllers/favoriteController");
var apiNotify = require("../controllers/notify.controller");

const upload = multer({ storage: multer.memoryStorage() });
//notify
router.get("/notify/:id", apiNotify.getNotifyById);
//user
router.get("/users", apiU.listUser);
router.get("/users/info/:id", apiU.infoUser);
router.post("/users/register", apiU.register);
router.post("/users/login", apiU.login);
router.post("/users/update/:id", apiU.update);

// đơn hàng
router.get("/order", apiOder.getOrders);

router.post("/add/order", apiOder.createOrder);
router.delete("/deleteorder/:id", apiOder.deleteOrder);
router.put("/updateorder/:id", apiOder.updateOrder);
router.delete("/deletebyUid/:id", apiOder.deletebyUid);
router.get("/order/:userId", apiOder.getOrdersByUser);
//voucher

router.get("/tinhtoanvoucherhethan", apiVoucher.tinhtoansovoucherhethang);

router.post(
  "/voucher/createVoucher",
  upload.single("image"),
  apiVoucher.addVoucher
);
router.get(
  "/voucher/getVoucherInRestaurant/:id",
  apiVoucher.getVoucherInRestaurant
);
router.post("/voucher/huydonhang", apiVoucher.huyDonHang);
router.get("/voucher/getVoucher", apiVoucher.getVoucher);
router.post("/voucher/delete/:id", apiVoucher.deleteVoucher);
router.post("/voucher/decrease", apiVoucher.handleDecreseVoucher);
router.post(
  "/voucher/editVoucher/:id",
  upload.single("image"),
  apiVoucher.editVoucher
);
// yêu thích
router.post("/favorite", apifavorite.toggleLike);
router.get("/favorite/getAll", apifavorite.getAllFavorite);
router.get(
  "/favorite/getbyUid/:userId",
  apifavorite.getListProductFavoritebyUid
);
router.get("/getLike", apifavorite.getLikes);
router.get("/getTop", apifavorite.getTop);
router.get("/don-hang/:id", apiHistory.getChiTiet);
router.post("/history/create", apiHistory.createOrderSuccess);
router.get("/history", apiHistory.getHistory);
router.get("/ordersByUser/:userId", apiHistory.getUserHistory);
router.delete("/history/delete", apiHistory.deleteHistory);
router.delete("/history/deleteAll", apiHistory.deleteHistoryAll);
router.put(
  "/updateOrderStatus/:orderId",
  apiHistory.updateOrderStatusByRestaurant
);
router.put("/user/cancel", apiHistory.cancelOrder);
//doanh thu
router.get("/thongke/:slug", async (req, res) => {
  const slugData = req.params.slug;
  const user = req.session.user;
  const restaurantId = user._id;
  let dayData;
  switch (slugData) {
    case "today":
      dayData = 0;
      break;
    case "weekago":
      dayData = 7;
      break;
    case "monthago":
      dayData = 30;
      break;
    case "threeago":
      dayData = 90;
      break;
    case "sixago":
      dayData = 180;
      break;
    case "yearago":
      dayData = 365;
      break;
    default:
      dayData = 0;
  }
  const currentDate = moment();
  const timeAgo = moment(currentDate).subtract(dayData, "days");
  const query = { "products.restaurantId": restaurantId, status: 3 };
  if (dayData === 0) {
    query.time = { $gte: currentDate.toDate() };
  } else {
    query.time = { $gte: timeAgo.toDate(), $lt: currentDate.toDate() };
  }

  const result = await hisToryModel.History.find(query);
  let total = 0;
  result.forEach((rs) => {
    total += rs?.toltalprice;
  });

  return res.json({
    total: total,
  });
});

//ép về date
router.get("/ordersByRestaurant", apiHistory.getOrdersByRestaurant);
router.get("/orderStatistics/:slug", apiHistory.getOrders);

// top nhà hàng
router.get("/topRestaurants", apiHistory.getTopRestaurants);
//slider
router.get("/slider/getAll", apiSlider.getSliders);
//comment
router.get("/comment/getAll", apiComment.getComment);
router.post("/comment/create", apiComment.postComment);

//restaurant
router.get("/restaurant/getAll", apiRestaurant.getRestaurants);
router.post("/restaurant/create", apiRestaurant.createRestaurant);
router.get("/restaurant/:id", apiRestaurant.getInfoRestaurantById);

router.post("/restaurant/delete/:id", apiRestaurant.deleteRestaurant);
//products
router.post("/product/delete/:id", apiProduct.ngungKinhDoanhProduct);
router.get("/product/id/:id", apiProduct.getProduct);
router.post("/search", async (req, res) => {
  const dataRes = await apiProduct.dataProductRestaurant(req, res);
  const data = dataRes.filter((dt, index) => dt.name.includes(req.body.search));
  res.render("product/showProduct", {
    list: data,
    req: req,
  });
});
router.post("/search/donhang", async (req, res) => {
  const dataRes = await apiProduct.dataProductRestaurant(req, res);
  const data = dataRes.filter((dt, index) => dt.name.includes(req.body.search));
  res.render("product/showProduct", {
    list: data,
    req: req,
  });
});

router.get("/product/suggest", apiProduct.getSuggest);
router.post("/product/getbyname", apiProduct.getProductByName);
router.get("/productDanhmuc/:category", apiProduct.getProductDanhMuc);

router.get(
  "/product/getProductsInRestaurant/:id",
  apiProduct.getProductInRestaurant
);
router.post(
  "/product/editProduct/:id",
  upload.single("image"),
  apiProduct.editDataProduct
);

router.post(
  "/restaurant/editProfile",
  upload.single("image"),
  apiRestaurant.editProfile
);
router.post(
  "/product/addProduct",
  upload.single("image"),
  apiSanPhamDangDuyet.addProduct
);

//restaurant
router.get("/restaurant/getAll", apiRestaurant.getRestaurants);

//report
router.post("/evaluate", apiProduct.postEvaluate);

// Thêm dòng này:
router.post("/users/reset-password", apiU.resetPassword);
// Khóa tài khoản
router.post("/users/lock/:id", apiU.lockUser);

// Mở khóa tài khoản
router.post('/users/unlock/:id', apiU.unlockUser);


router.post("/revenue/date-range", apiHistory.getRevenueByDateRange);

module.exports = router;
