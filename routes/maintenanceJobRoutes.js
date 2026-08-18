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

router.route("/").get(getMaintenanceJobs).post(createMaintenanceJob);
router
  .route("/:id")
  .get(getMaintenanceJobById)
  .put(updateMaintenanceJob)
  .delete(authorize("owner"), deleteMaintenanceJob);

module.exports = router;
