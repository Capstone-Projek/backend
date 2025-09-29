const express = require("express");
const router = express.Router();
const authController = require("../controllers/authentication.controller");

router.post("/regis", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refresh);
router.post("/logout", authController.logout);

module.exports = router;
