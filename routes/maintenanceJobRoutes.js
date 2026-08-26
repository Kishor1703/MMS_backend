const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createMaintenanceJob,
  getMaintenanceJobs,
  getMaintenanceJobById,
  updateMaintenanceJob,
  deleteMaintenanceJob,
} = require("../controllers/maintenanceJobController");

router.use(protect);

// A maintenance job is the employee's report.  It is deliberately not a
// general machine-editing endpoint: employees submit their own report and
// their general manager is the only role that can amend it.
router
  .route("/")
  .get(authorize("employee", "general_manager"), getMaintenanceJobs)
  .post(authorize("employee"), createMaintenanceJob);
router
  .route("/:id")
  .get(authorize("employee", "general_manager"), getMaintenanceJobById)
  .put(authorize("general_manager"), updateMaintenanceJob)
  .delete(authorize("general_manager"), deleteMaintenanceJob);

module.exports = router;
