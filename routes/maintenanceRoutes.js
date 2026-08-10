const express = require("express");
const router = express.Router();
const { protect, authorize, requireSchedulerKey } = require("../middleware/auth");
const {
  createMaintenance,
  getMaintenanceRecords,
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
  getDueMaintenance,
} = require("../controllers/maintenanceController");

router.get("/due/today", requireSchedulerKey, getDueMaintenance);

router.use(protect);

router.route("/").get(getMaintenanceRecords).post(createMaintenance);
router
  .route("/:id")
  .get(getMaintenanceById)
  .put(updateMaintenance)
  .delete(authorize("owner"), deleteMaintenance);

module.exports = router;
