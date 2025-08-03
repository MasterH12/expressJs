const {Router} = require("express");
const router = Router();

const authRouter = require("./auth.js");

router.use("/auth", authRouter);

module.exports = router;