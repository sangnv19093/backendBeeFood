var userModel = require("../models/users.model");
const bcrypt = require("bcrypt");

exports.listUser = async (req, res, next) => {
  try {
    let list = await userModel.userModel.find();
    console.log(list);
    if (list) {
      return res
        .status(200)
        .json({ data: list, msg: "Lấy dữ liệu thành công" });
    } else {
      return res.status(204).json({ msg: "Không có dữ liệu" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.register = async (req, res, next) => {
  try {
    // Kiểm tra tên ngdung
    const existingUsername = await userModel.userModel.findOne({
      username: req.body.username,
    });
    if (existingUsername) {
      return res.status(501).json({ msg: "Tên người dùng đã được sử dụng" });
    }
    // Kiểm tra sdt
    const existingPhone = await userModel.userModel.findOne({
      phone: req.body.phone,
    });
    if (existingPhone) {
      return res.status(502).json({ msg: "Số điện thoại đã được sử dụng" });
    }
    if (req.body.password !== req.body.rePassword) {
      return res.status(500).json({ msg: "Mật khẩu nhập lại không đúng" });
    }
    //
    const salt = await bcrypt.genSalt(10);
    const user = new userModel.userModel(req.body);
    user.password = await bcrypt.hash(req.body.password, salt);
    await user.generateAuthToken();
    let new_u = await user.save();
    return res.status(200).json({ user: new_u });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: error.message });
  }
};
exports.update = async (req, res, next) => {
  const userId = req.params.id;
  const { phone, currentPassword, gender, birthday, password } = req.body;

  try {
    // Tìm người dùng theo ID
    const user = await userModel.userModel.findById(userId).exec();

    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    // Cập nhật số điện thoại nếu có
    if (phone) {
      user.phone = phone;
    }

    // Kiểm tra mật khẩu cũ nếu có mật khẩu mới
    if (password && currentPassword) {
      const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json({ error: "Mật khẩu cũ không chính xác." });
      }

      // Cập nhật mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Cập nhật giới tính nếu có
    if (gender) {
      user.gender = gender;
    }

    // Cập nhật ngày sinh nếu có
    if (birthday) {
      user.birthday = birthday;
    }

    // Lưu lại thông tin người dùng đã cập nhật
    const updatedUser = await user.save();

    // Trả về thông tin người dùng đã cập nhật
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Lỗi khi cập nhật thông tin người dùng" });
  }
};


exports.login = async (req, res, next) => {
  console.log(req.body);

  try {
    const user = await userModel.userModel.findOne({
      username: req.body.username,
    });
    console.log(user);
    if (!user) {
      console.log("Không tồn tại tài khoản");
      return res.status(401).json({ msg: "Không tồn tại tài khoản" });
    } else {
      const isPasswordMatch = await bcrypt.compare(
        req.body.password,
        user.password
      );
      // Kiểm tra xem tài khoản có bị khóa hay không
      if (user.isLocked) {
        return res.status(403).json({ msg: "Tài khoản của bạn đã bị khóa" });
      }
      if (!isPasswordMatch) {
        console.log("sai mật khẩu");
        return res.status(401).json({ msg: "sai mật khẩu" });
      } else {
        console.log("Đăng nhập thành công");
        return res
          .status(200)
          .json({ data: user, msg: "Đăng nhập thành công" });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ msg: "Sai tài khoản hoặc mật khẩu" });
  }
};

exports.infoUser = async (req, res, next) => {
  try {
    const user = await userModel.userModel.findById(req.params.id);
    if (!user) {
      return res.json({ msg: "User không tồn tại" }).status(404);
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ msg: error.message });
  }
};

// Thêm hàm resetPassword
exports.resetPassword = async (req, res, next) => {
  try {
    const { username, phone } = req.body;

    if (!username || !phone) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và số điện thoại' });
    }

    const user = await userModel.userModel.findOne({ username: username, phone: phone });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với thông tin này.' });
    }

    const hashedPassword = await bcrypt.hash('1', 10); // Mật khẩu mới "1"
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Mật khẩu mới là "1".' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý.' });
  }
};

exports.lockUser = async (req, res) => {
  console.log('Locking user with ID:', req.params.id); // Log ID
  try {
    const userId = req.params.id;
    const user = await userModel.userModel.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại!' });

    user.isLocked = true;
    await user.save();

    res.json({ success: true, message: 'Tài khoản đã bị khóa!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};

exports.unlockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userModel.userModel.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại!' });

    user.isLocked = false;
    await user.save();

    res.json({ success: true, message: 'Tài khoản đã được mở khóa!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};
