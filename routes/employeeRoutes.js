const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

router.use(protect, authorize("admin", "owner", "general_manager"));

router.route("/").get(getEmployees).post(createEmployee);
router
  .route("/:id")
  .get(getEmployeeById)
  .put(authorize("admin", "owner"), updateEmployee)
  .delete(authorize("admin", "owner"), deleteEmployee);

module.exports = router;
