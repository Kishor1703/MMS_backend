const express = require("express");
const router = express.Router();
const { protect, requireSchedulerKey } = require("../middleware/auth");
const { requestReport, getReports, completeReport } = require("../controllers/reportController");

router.patch("/:id/complete", requireSchedulerKey, completeReport);

router.use(protect);
router.route("/").get(getReports).post(requestReport);

module.exports = router;
