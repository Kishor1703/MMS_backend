const express = require("express");
const router = express.Router();
const { protect, authorize, requireSchedulerKey } = require("../middleware/auth");
const { requestReport, getReports, completeReport } = require("../controllers/reportController");

router.patch("/:id/complete", requireSchedulerKey, completeReport);

router.use(protect);
router.route("/").get(authorize("admin", "owner", "general_manager"), getReports).post(authorize("admin", "owner", "general_manager"), requestReport);

module.exports = router;
