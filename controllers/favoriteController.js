const Favorite = require("../models/favorite");
const Product = require("../models/product.model");
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.body.userId;
    const _id = req.body._id;
    const isLiked = req.body.isLiked;

    const product = await Product.productModel
      .findById(_id, "name image realPrice description likeCount")
      .populate("restaurantId");

    if (!product) {
      return res.status(404).json({ msg: "Sản phẩm không tồn tại" });
    }

    console.log("Trước khi cập nhật - product:", product);

    let favorite = await Favorite.favoriteModel.findOne({ userId });

    if (!favorite) {
      favorite = new Favorite.favoriteModel({ userId });
    }

    const { name, image, realPrice, description, restaurantId, totalLikes } =
      product;

    const productIndex = favorite.listFavorite.findIndex((p) =>
      p._id.equals(_id)
    );

    if (!isLiked) {
      favorite.listFavorite = favorite.listFavorite.filter((p) => {
        if (p._id.equals(_id)) {
          p.likeCount = Math.max(p.likeCount - 1, 0);
          return false;
        }
        return true;
      });
      product.totalLikes = Math.max(totalLikes - 1, 0);
      product.likeCount = Math.max(product.likeCount - 1, 0);
    } else {
      if (productIndex === -1) {
        favorite.listFavorite.push({
          _id,
          name,
          image,
          realPrice,
          description,
          restaurantId,
          isLiked,
          likeCount: 1,
        });
        product.totalLikes += 1;
        product.likeCount += 1;
      } else {
        favorite.listFavorite[productIndex].isLiked = isLiked;
        favorite.listFavorite[productIndex].likeCount += 1;
        product.totalLikes += 1;
        product.likeCount += 1;
      }
    }

    console.log("Sau khi cập nhật - product:", product);

    await favorite.populate("listFavorite.restaurantId");
    console.log("likeCount sau khi cập nhật:", product.likeCount);

    await favorite
      .save()
      .then(() => console.log("Favorite đã lưu thành công"))
      .catch((err) => console.error("Lỗi khi lưu favorite:", err));

    await product
      .save()
      .then(() => console.log("Product đã lưu thành công"))
      .catch((err) => console.error("Lỗi khi lưu product:", err));

    return res
      .status(200)
      .json({ data: favorite, msg: "Lấy dữ liệu thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

exports.getAllFavorite = async (req, res) => {
  try {
    const favorites = await Favorite.favoriteModel
      .find()
      .populate("listFavorite.restaurantId");
    res.status(200).json(favorites);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getListProductFavoritebyUid = async (req, res) => {
  try {
    const userId = req.params.userId;

    const listproducts = await Favorite.favoriteModel
      .find({ userId: userId })
      .populate("listFavorite.restaurantId");

    if (!listproducts || listproducts.length === 0) {
      return res.status(404).json({ msg: "Không tìm thấy sản phẩm yêu thích" });
    }

    res.status(200).json(listproducts);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm yêu thích:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
  }
};

exports.getLikes = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ msg: "Nhà hàng chưa đăng nhập" });
    }
    const restaurantId = user._id;
    const favoriteFoods = await Product.productModel.find({
      restaurantId: restaurantId,
      likeCount: { $gt: 0 },
    });
    res.status(200).json(favoriteFoods);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: "Đã xảy ra lỗi khi lấy dữ liệu món ăn yêu thích" });
  }
};
exports.getTop = async (req, res) => {
  try {
    const favoriteFoods = await Product.productModel
      .find({
        likeCount: { $gt: 0 },
        isHide: false, // Thêm điều kiện kiểm tra isHide
      })
      .populate("restaurantId");

    const data = favoriteFoods.map((product) => {
      return { ...product._doc };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: "Đã xảy ra lỗi khi lấy dữ liệu món ăn yêu thích" });
  }
};
