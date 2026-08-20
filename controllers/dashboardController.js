const asyncHandler = require("express-async-handler");
const Machine = require("../models/Machine");
const Employee = require("../models/Employee");
const Maintenance = require("../models/Maintenance");
const OilChange = require("../models/OilChange");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

const getDashboardStats = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") {
    const totalOwners = await User.countDocuments({ role: "owner", isActive: true });
    return res.json({ success: true, data: { totalOwners } });
  }

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalMachines,
    runningMachines,
    breakdownMachines,
    underMaintenanceMachines,
    idleMachines,
    totalEmployees,
    maintenanceDue,
    oilChangeDue,
    recentActivity,
  ] = await Promise.all([
    Machine.countDocuments({ isDeleted: false }),
    Machine.countDocuments({ isDeleted: false, status: "Running" }),
    Machine.countDocuments({ isDeleted: false, status: "Breakdown" }),
    Machine.countDocuments({ isDeleted: false, status: "Under Maintenance" }),
    Machine.countDocuments({ isDeleted: false, status: "Idle" }),
    Employee.countDocuments({ isActive: true }),
    Maintenance.countDocuments({ nextMaintenanceDate: { $lte: endOfToday, $ne: null } }),
    OilChange.countDocuments({ nextOilChangeDate: { $lte: endOfToday }, reminderSent: false }),
    ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate("user", "name role"),
  ]);

  res.json({
    success: true,
    data: {
      totalMachines,
      runningMachines,
      breakdownMachines,
      underMaintenanceMachines,
      idleMachines,
      totalEmployees,
      maintenanceDue,
      oilChangeDue,
      recentActivity,
    },
  });
});

module.exports = { getDashboardStats };
