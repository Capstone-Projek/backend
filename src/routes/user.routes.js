const express = require("express");
const multer = require("multer");
const userController = require("../controllers/user.controller");
const verifyToken = require("../middlewares/verifyToken");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.put("/user/profile", verifyToken, userController.updateUserProfile);

router.post(
  "/user/profile/image",
  verifyToken,
  upload.single("profile_image"),
  userController.updateProfileImage
);

module.exports = router;
