var sliderModel = require("../models/slider.model");

exports.getSliders = async (req, res, next) => {
  try {
    let list = await sliderModel.sliderModel.find();
    console.log(list);
    if (list) {
      return res
        .status(200)
        .json({ data: list, msg: "Lấy  dữ liệu voucher thành công" });
    } else {
      return res.status(400).json({ msg: "Không có dữ liệu Image slider" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
