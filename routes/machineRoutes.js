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
  .post(authorize("owner"), createMachine);

router
  .route("/:id")
  .get(getMachineById)
  .put(authorize("owner"), updateMachine)
  .delete(authorize("owner"), deleteMachine);

router.patch("/:id/status", updateMachineStatus); // owner or assigned employee
router.post("/:id/assign", authorize("owner"), assignMachine);

module.exports = router;
