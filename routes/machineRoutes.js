const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  updateMachineStatus,
  deleteMachine,
  assignMachine,
} = require("../controllers/machineController");

router.use(protect);

router
  .route("/")
  .get(getMachines)
  .post(authorize("admin", "owner"), createMachine);

router
  .route("/:id")
  .get(getMachineById)
  .put(authorize("admin", "owner"), updateMachine)
  .delete(authorize("admin", "owner"), deleteMachine);

router.patch("/:id/status", updateMachineStatus); // owner or assigned employee
router.post("/:id/assign", authorize("admin", "owner"), assignMachine);

module.exports = router;
