const express = require("express");
const router = express.Router();
const { protect, authorize, requireSchedulerKey } = require("../middleware/auth");
const { requestReport, getReports, downloadReport, deleteReport, completeReport } = require("../controllers/reportController");

router.patch("/:id/complete", requireSchedulerKey, completeReport);

router.use(protect);
<<<<<<< HEAD
// Report access: admin sees everything, owner & manager view/export,
// employees only see their own generated reports.
const REPORT_ROLES = ["admin", "employee", "general_manager", "owner"];
router.route("/").get(authorize(...REPORT_ROLES), getReports).post(authorize(...REPORT_ROLES), requestReport);
=======
// Generated exports are available to operational roles that need them.
router
  .route("/")
  .get(authorize("admin", "owner", "general_manager", "employee"), getReports)
  .post(authorize("employee"), requestReport);
router.get("/:id/download", authorize("admin", "owner", "general_manager", "employee"), downloadReport);
router.delete("/:id", authorize("admin", "owner", "general_manager", "employee"), deleteReport);
>>>>>>> ffaf46d9a88b7de760bc8cb49649a90ae1f59cb0

module.exports = router;
