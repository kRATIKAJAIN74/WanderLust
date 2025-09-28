const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const flash = require("connect-flash");
const passport = require("passport");
const {saveRedirectUrl} = require("../middleware.js");
const userController = require("../controller/user.js");

router
.route("/signup")
.get( userController.renderSignup )
.post( wrapAsync(userController.signupUser));

router
.route("/login")
.get(userController.renderLogin)
.post(saveRedirectUrl,
     passport.authenticate("local",
         {failureRedirect: '/login', 
            failureFlash: true }),
        userController.signinUser);

router.get("/logout", userController.logout);

module.exports = router;