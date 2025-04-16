const express = require("express");
const { login, register, logout, sendOTP ,verifyOTP, resendOTP, sendchangepwdMail, updatepwd} = require("../controllers/signin");
const router = express.Router();

// router.post("/register", register);

router.post("/login", login);
router.get("/logout",logout);

router.post("/sendotp",register)
router.post("/verifyotp",verifyOTP)
router.post("/resendotp",resendOTP)
router.post("/updatepwd",sendchangepwdMail)
router.post("/changepwd",updatepwd)//finally changes the password in db



module.exports = router;
