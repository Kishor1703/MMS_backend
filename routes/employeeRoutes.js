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

router.use(protect, authorize("owner"));

router.route("/").get(getEmployees).post(createEmployee);
router.route("/:id").get(getEmployeeById).put(updateEmployee).delete(deleteEmployee);

module.exports = router;
