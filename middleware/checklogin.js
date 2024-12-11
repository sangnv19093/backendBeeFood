const sanPhamDangDuyetModel = require("../models/sanPhamDangDuyet.model");

exports.yeu_cau_dang_nhap = async (req, res, next) => {
  if (req.session.user) {
    if (req.session.user.role === "user") {
      console.log("đã đăng nhập user");
      return res.render("index", {
        message: "Đã đăng nhập user",
        req: req,
      });
    }
    if (req.session.user.role === "admin") {
      const latestProducts = await sanPhamDangDuyetModel.sanPhamDangDuyetModel
        .find({ trangthai: 0 })
        .sort({ createdAt: -1 })
        .limit(5);
      console.log(latestProducts);
      req.session.choduyet = latestProducts;
      console.log("đã đăng nhập admin");
      return res.render("index-admin", {
        message: "Đã đăng nhập admin",
        req: req,
      });
    }
  } else {
    console.log("chưa đăng nhập");
    return res.render("authorize/authorize", {
      message: "",
      req: req,
    });
  }
};

exports.yeu_cau_dang_nhap_admin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    return res.render("home/home", {
      message: "Bạn phải đăng nhập tài khoản Admin để sử dụng chức năng này",
      req: req,
    });
  }
};

exports.khong_yc_dang_nhap = (req, res, next) => {
  if (!req.session.user) {
    next();
  } else {
    return res.redirect("/users");
  }
};
