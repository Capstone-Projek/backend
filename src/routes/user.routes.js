const express = require("express");
const multer = require("multer");
const userController = require("../controllers/user.controller");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.put("/user/profile", userController.updateUserProfile);

router.post(
  "/user/profile/image",
  upload.single("profile_image"),
  userController.updateProfileImage
);

module.exports = router;
