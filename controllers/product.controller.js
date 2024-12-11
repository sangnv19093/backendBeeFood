var productModel = require("../models/product.model");
var restaurantModel = require("../models/restaurant.model");
var userModel = require("../models/users.model.js");

const { History } = require("../models/history.js");
const firebase = require("../firebase/index.js");
process.env.TZ = "Asia/Ho_Chi_Minh";
const moment = require("moment-timezone");
const { error } = require("firebase-functions/logger");
const evaluteModel = require("../models/evaluate.js");
const { logger } = require("firebase-functions/v1");
const timestamp = moment().tz("Asia/Ho_Chi_Minh").toISOString();

exports.getSuggest = async (req, res, next) => {
  try {
    const list = await productModel.productModel
      .find({ isHide: false })
      .populate("restaurantId");
    const data = list.map((product) => {
      const restaurantName = product.restaurantId.name;
      return { ...product._doc };
    });

    if (list) {
      return res
        .status(200)
        .json({ data: data, msg: "Lấy dữ liệu thành công" });
    } else {
      return res.status(400).json({ msg: "Không có dữ liệu" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
// lấy theo danh mục
exports.getProductDanhMuc = async (req, res, next) => {
  try {
    const nameDanhMuc = req.params.category;
    const products = await productModel.productModel
      .find({
        category: nameDanhMuc,
        isHide: false,
      })
      .populate("restaurantId");
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(204).json({ msg: error.message });
  }
};
exports.ngungKinhDoanhProduct = async (req, res, next) => {
  const id = req.params.id;
  const sp = await productModel.productModel.findById({ _id: id });
  try {
    const product = await productModel.productModel.findByIdAndUpdate(
      {
        _id: id,
      },
      { isHide: !sp.isHide }
    );

    if (!product) {
      return res.status(204).json({ msg: "Sản phẩm không tồn tại" });
    }
    res.redirect("/showProduct");
  } catch (error) {
    return res.status(204).json({ msg: error.message });
  }
};
exports.editProduct = async (req, res, next) => {
  const id = req.params.id;
  const product = await productModel.productModel.findById({
    _id: id,
  });
  return product;
};
exports.dataProductRestaurant = async (req, res, next) => {
  const id = req.session.user?._id;
  try {
    let list = await productModel.productModel.find({
      restaurantId: id,
    });
    if (list) {
      list.sort((a, b) => {
        if (a.isHide && !b.isHide) return 1;
        if (!a.isHide && b.isHide) return -1;
        return 0;
      });
      return list;
    } else {
      return res.status(400).json({ msg: "Lay du lieu san pham thanh cong" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getProductInRestaurant = async (req, res, next) => {
  const restaurantId = req.params.id;
  try {
    const list = await productModel.productModel
      .find({ restaurantId, isHide: false })
      .populate("restaurantId");
    if (list) {
      return res
        .status(200)
        .json({ data: list, msg: "Lay du lieu san pham thanh cong" });
    } else {
      return res.status(400).json({ msg: "Lay du lieu san pham thanh cong" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.getProduct = async (req, res, next) => {
  try {
    const product = await productModel.productModel.findById(req.params.id);

    if (!product) {
      return res.status(204).json({ msg: "Sản phẩm không tồn tại" });
    }

    res.status(200).json(product);
  } catch (error) {
    return res.status(204).json({ msg: error.message });
  }
};
exports.getProductByName = async (req, res, next) => {
  const productName = req.body.name;
  try {
    const products = await productModel.productModel
      .find({
        name: { $regex: productName, $options: "simx" },
        isHide: false,
      })
      .populate("restaurantId");

    if (products.length === 0) {
      return res.json({ msg: "Không tìm thấy sản phẩm nào." });
    }

    res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.editDataProduct = async (req, res, next) => {
  const id = req.session.user?._id;
  const idProduct = req.params.id;
  const nameFile = req.file.originalname;
  const blob = firebase.bucket.file(nameFile);
  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobWriter.on("finish", () => {
    const product = {
      ...req.body,
      realPrice: Number.parseInt(req.body.realPrice),
      discountPrice: Number.parseInt(req.body.discountPrice),
      description: String(req.body.description),
      restaurantId: id,
      image: `https://firebasestorage.googleapis.com/v0/b/beefoodconsole.appspot.com/o/${nameFile}?alt=media`,
    };
    productModel.productModel
      .findByIdAndUpdate({ _id: idProduct }, product)
      .then(() => {
        res.redirect("/showProduct");
      });
  });
  blobWriter.end(req.file.buffer);
};
exports.addProduct = async (req, res, next) => {
  const id = req.session.user?._id;

  if (!req.file) {
    return res.status(400).send("Không có file được tải lên!");
  }
  const nameFile = req.file.originalname;
  const blob = firebase.bucket.file(nameFile);
  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

   
  // Kiểm tra giá trị số
  const realPrice = Number.parseInt(req.body.realPrice, 10);
  const discountPrice = Number.parseInt(req.body.discountPrice, 10);

  if (isNaN(realPrice) || isNaN(discountPrice)) {
    return res.render("addProduct", { error: "Giá trị giá tiền không hợp lệ!" });
  }

  if (realPrice < 0 || discountPrice < 0) {
    return res.render("addProduct", { error: "Giá trị không được là số âm!" });
  }

  blobWriter.on("finish", () => {
    const product = {
      ...req.body,
      realPrice,
      discountPrice,
      description: String(req.body.description),
      restaurantId: id,
      image: `https://firebasestorage.googleapis.com/v0/b/datn-de212-15d26.appspot.com/o/${nameFile}?alt=media`,
      createdAt: timestamp,
    };

     // Thêm vào cơ sở dữ liệu
     productModel.productModel
     .create(product)
     .then(() => {
       res.redirect("/showProduct");
     })
     .catch((error) => {
       console.error("Lỗi khi lưu sản phẩm:", error);
       res.status(500).send("Đã xảy ra lỗi khi thêm sản phẩm.");
     });
 });

 blobWriter.on("error", (error) => {
   console.error("Lỗi khi tải lên file:", error);
   res.status(500).send("Lỗi khi tải lên file.");
 });

 blobWriter.end(req.file.buffer);
  
};

// web
exports.getListProduct = async (req, res, next) => {
  try {
    const listrestaurant = await restaurantModel.restaurantModel.find();

    let productsQuery = { isHide: false };

    if (
      req.query.categoryFilter &&
      req.query.categoryFilter.trim().toLowerCase() !== "tatca"
    ) {
      productsQuery.category = req.query.categoryFilter.trim();
    }

    if (
      req.query.restaurantFilter &&
      req.query.restaurantFilter.trim().toLowerCase() !== "tatca"
    ) {
      productsQuery.restaurantId = req.query.restaurantFilter.trim();
    }
    if (req.query.name && req.query.name.trim() !== "") {
      // Sử dụng biểu thức chính quy để tìm kiếm sản phẩm theo tên
      productsQuery.name = { $regex: new RegExp(req.query.name.trim(), "i") };
    }
    const itemsPerPage = 15;
    const page = parseInt(req.query.page) || 1;

    const totalCount = await productModel.productModel.countDocuments(
      productsQuery
    );
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const skip = (page - 1) * itemsPerPage;

    const products = await productModel.productModel
      .find(productsQuery)
      .skip(skip)
      .limit(itemsPerPage);

    const restaurantIds = products.map((product) => product.restaurantId);

    const restaurants = await restaurantModel.restaurantModel.find({
      _id: { $in: restaurantIds },
    });

    const restaurantMap = new Map();
    restaurants.forEach((restaurant) => {
      restaurantMap.set(restaurant._id.toString(), restaurant.name);
    });

    const productsWithRestaurantName = products.map((product) => {
      return {
        ...product.toObject(),
        restaurantName: restaurantMap.get(product.restaurantId.toString()),
      };
    });

    const pagination = {
      currentPage: page,
      totalItems: totalCount,
      itemsPerPage: itemsPerPage,
      totalPages: totalPages,
      baseUrl: "/listproduct",
    };

    res.render("product/listProduct", {
      list: productsWithRestaurantName,
      listRestaurant: listrestaurant,
      pagination: pagination,
      req: req,
    });
  } catch (error) {
    return res.status(204).json({ msg: error.message });
  }
};

exports.postEvaluate = async (req, res, next) => {
  try {
    const star = Number(req.body.star);
    let evaluateRecord = await restaurantModel.restaurantModel.findById(
      req.body.restaurantId
    );

    evaluateRecord.totalStar += star;
    evaluateRecord.totalEvaluate += 1;
    evaluateRecord.average =
      evaluateRecord.totalStar / evaluateRecord.totalEvaluate;
    await evaluateRecord.save();
    return res
      .json({
        msg: "Đánh giá đã được cập nhật thành công",
        data: evaluateRecord,
      })
      .status(200);
  } catch (error) {
    console.error("Lỗi khi xử lý đánh giá:", error);
    return res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi xử lý đánh giá" });
  }
};
// lấy theo danh mục
exports.getProductDanhMuc = async (req, res, next) => {
  try {
    const nameDanhMuc = req.params.category;
    const products = await productModel.productModel.find({
      category: nameDanhMuc,
      isHide: false,
    });
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(204).json({ msg: error.message });
  }
};

exports.getRevenue = async (req, res, next) => {
  const currentDate = moment().startOf("day");
  moment.tz.setDefault("Asia/Ho_Chi_Minh");

  // Lấy thời gian hiện tại
  const currentDate2 = moment();

  // Lấy đầu ngày của ngày hiện tại
  const startOfToday = currentDate2
    .startOf("day")
    .format("YYYY-MM-DDTHH:mm:ssZ");
  const startOfThisMonth = moment().startOf("month").toISOString();
  const startOfThisYear = moment().startOf("year").toISOString();

  try {
    const datePart = startOfToday.split("T")[0];
    const bills = await History.find({ status: 3 });
    const billsToday = [];
    for (const bill of bills) {
      // Cắt chuỗi trường time của bản ghi
      const billDatePart = bill.time.toISOString().split("T")[0];
      if (billDatePart === datePart) {
        billsToday.push(bill);
      }
    }
    const dataForChartToday = organizeDataByHour(billsToday);
    // Lấy các hóa đơn trong tháng có status = 4
    const billsThisMonth = await History.find({
      time: { $gte: startOfThisMonth },
      status: 3,
    });
    const dataForChartMonth = organizeDataByMonth(billsThisMonth);

    // Lấy các hóa đơn trong năm có status = 4
    const billsThisYear = await History.find({
      time: { $gte: startOfThisYear },
      status: 3,
    });

    // Tạo mảng userIds từ các hóa đơn
    const userIdsToday = Array.from(
      new Set(billsToday.map((bill) => bill.userId))
    );
    const userIdsThisMonth = Array.from(
      new Set(billsThisMonth.map((bill) => bill.userId))
    );
    const userIdsThisYear = Array.from(
      new Set(billsThisYear.map((bill) => bill.userId))
    );

    // Lấy tổng totalprice từ các hóa đơn
    const totalRevenueToday = billsToday.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );

    const totalRevenueThisMonth = billsThisMonth.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );

    const totalRevenueThisYear = billsThisYear.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );
    res.render("revenue/adminRevenue", {
      req: req,
      bills: billsToday,
      billsThisMonth: billsThisMonth,
      billsThisYear: billsThisYear,
      userIdsToday: userIdsToday,
      userIdsThisMonth: userIdsThisMonth,
      userIdsThisYear: userIdsThisYear,
      totalRevenueToday: totalRevenueToday,
      totalRevenueThisMonth: totalRevenueThisMonth,
      totalRevenueThisYear: totalRevenueThisYear,

      categoriesToday: dataForChartToday.formattedDateArray,
      dataToday: dataForChartToday.data,
      revenueToday: dataForChartToday.revenue,

      categoriesMonth: dataForChartMonth.categories,
      dataMonth: dataForChartMonth.data,
      revenueMonth: dataForChartMonth.revenue,

      topSelling: topSelling(bills),
      recent: await recent(bills),
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu từ bảng Bill:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu từ bảng Bill");
  }
};

function organizeDataByHour(bills) {
  const organizedData = {};
  const categories = [];
  const data = [];
  const revenue = [];

  bills.forEach((bill) => {
    // Lấy giờ từ trường time
    const hour = new Date(bill.time).getHours();

    // Tạo khung giờ nếu chưa tồn tại
    if (!organizedData[hour]) {
      organizedData[hour] = {
        bills: [],
        billCount: 0,
        totalPrices: 0,
      };
    }

    // Thêm bill vào khung giờ tương ứng
    organizedData[hour].bills.push(bill);
    organizedData[hour].billCount += 1;
    organizedData[hour].totalPrices += bill.toltalprice;

    // Thêm giờ vào mảng categories nếu chưa tồn tại
    if (!categories.includes(hour)) {
      categories.push(hour);
    }
  });

  // Sắp xếp mảng categories để đảm bảo thứ tự tăng dần
  categories.sort((a, b) => a - b);

  // Đổ dữ liệu vào mảng data và revenue theo thứ tự categories
  categories.forEach((hour) => {
    data.push(organizedData[hour].billCount);
    revenue.push(organizedData[hour].totalPrices);
  });

  const formattedCategories = categories.map((hour) => {
    const formattedHour = (hour - 7 + 24) % 24;
    return formattedHour.toString().padStart(2, "0") + ":00";
  });
  const currentDate = "2023-12-18";

  // Chuyển đổi thành mảng mới với chuỗi
  const formattedDateArray = formattedCategories.map((hour) => {
    return `${currentDate}T${hour}:00.000Z`;
  });
  return { formattedDateArray, data, revenue };
}

function organizeDataByMonth(bills) {
  // Lấy ra các ngày (không bao gồm giờ) duy nhất từ danh sách hóa đơn
  const uniqueDays = [
    ...new Set(
      bills.map((bill) =>
        new Date(bill.time).toISOString().split("T")[0].trim()
      )
    ),
  ];

  // Sắp xếp ngày tăng dần
  const categories = uniqueDays.sort();

  // Tính số lượng hóa đơn cho mỗi ngày
  const data = categories.map(
    (day) =>
      bills.filter((bill) => {
        const billDate = new Date(bill.time).toISOString().split("T")[0].trim();
        return billDate === day;
      }).length
  );

  // Tính tổng doanh thu cho mỗi ngày
  const revenue = categories.map((day) =>
    bills
      .filter(
        (bill) => new Date(bill.time).toISOString().split("T")[0].trim() === day
      )
      .reduce((total, bill) => total + bill.toltalprice, 0)
  );
  return { categories, data, revenue };
}

function topSelling(bills) {
  const productInfo = {};

  // Lặp qua tất cả các hóa đơn
  for (const bill of bills) {
    // Lặp qua tất cả các sản phẩm trong hóa đơn
    for (const product of bill.products) {
      const productId = product.productId.toString(); // Chuyển ObjectId thành chuỗi để sử dụng làm khóa

      // Tăng số lần xuất hiện của productId
      if (productInfo[productId]) {
        productInfo[productId].quantity += product.quantity;
        productInfo[productId].totalRevenue += product.price * product.quantity;
      } else {
        productInfo[productId] = {
          name: product.name,
          quantity: product.quantity,
          totalRevenue: product.price * product.quantity,
          imageURL: product.image, // Thêm link ảnh
          price: product.price, // Thêm giá tiền
        };
      }
    }
  }

  // Sắp xếp productInfo theo số lần xuất hiện giảm dần
  const sortedProducts = Object.keys(productInfo).sort(
    (a, b) => productInfo[b].quantity - productInfo[a].quantity
  );

  // Lấy ra thông tin của 10 sản phẩm xuất hiện nhiều nhất
  const topProducts = sortedProducts.slice(0, 10).map((productId) => ({
    name: productInfo[productId].name,
    quantity: productInfo[productId].quantity,
    totalRevenue: productInfo[productId].totalRevenue,
    imageURL: productInfo[productId].imageURL, // Link ảnh
    price: productInfo[productId].price, // Giá tiền
  }));
  return topProducts;
}

async function recent(bills) {
  try {
    // Sắp xếp mảng bills theo thời gian giảm dần
    const sortedBills = bills.sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );

    // Chọn 6 phần tử đầu tiên
    const recentBills = sortedBills.slice(0, 6);

    // Lấy thông tin cần thiết từ mỗi đơn hàng
    const result = await Promise.all(
      recentBills.map(async (bill) => {
        // Lấy tên món ăn từ sản phẩm đầu tiên của đơn hàng
        const productName = bill.products[0].name;

        // Lấy thông tin người dùng từ userModel
        const user = await userModel.userModel.findById(bill.userId);
        const userName = user ? user.username : null;

        // Lấy thông tin nhà hàng từ restaurantsModel
        const restaurant = await restaurantModel.restaurantModel.findById(
          bill.products[0].restaurantId
        );
        const restaurantName = restaurant ? restaurant.name : null;

        // Định dạng thời gian
        const timeAgo = getTimeAgo(bill.time);

        return {
          productName,
          restaurantName,
          userName,
          time: timeAgo,
        };
      })
    );
    console.log(result);
    return result;
  } catch (error) {
    console.error("Error in recent function:", error);
    return [];
  }
}
function getTimeAgo(timeString) {
  const currentTime = new Date();
  currentTime.setHours(currentTime.getHours() + 7);
  const postTime = new Date(timeString);
  const timeDifference = Math.floor((currentTime - postTime) / 1000); // Chuyển đổi sang giây

  const minutes = Math.floor(timeDifference / 60);
  const hours = Math.floor(timeDifference / 3600);
  const days = Math.floor(timeDifference / 86400);

  if (minutes < 1) {
    return "Vừa xong";
  } else if (minutes < 60) {
    return `${minutes} phút`;
  } else if (hours < 24) {
    return `${hours} giờ`;
  } else {
    return `${days} ngày`;
  }
}
