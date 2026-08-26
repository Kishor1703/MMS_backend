const express = require("express");
const router = express.Router();
const { protect, authorize, requireSchedulerKey } = require("../middleware/auth");
const { requestReport, getReports, completeReport } = require("../controllers/reportController");

router.patch("/:id/complete", requireSchedulerKey, completeReport);

router.use(protect);
// Generated exports are available to employees only.  Owners must not be
// able to enter the report section.
router.route("/").get(authorize("employee"), getReports).post(authorize("employee"), requestReport);

module.exports = router;
