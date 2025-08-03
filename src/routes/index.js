const {Router} = require("express");
const router = Router();

const authRouter = require("./auth.js");
const adminRouter = require("./admin.js");

router.use("/auth", authRouter);
router.use("/admin", adminRouter);

module.exports = router;