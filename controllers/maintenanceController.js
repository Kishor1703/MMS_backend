const asyncHandler = require("express-async-handler");
const Maintenance = require("../models/Maintenance");
const Machine = require("../models/Machine");

const createMaintenance = asyncHandler(async (req, res) => {
  const machine = await Machine.findOne({ _id: req.body.machine, isDeleted: false });
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }
  const record = await Maintenance.create(req.body);
  res.status(201).json({ success: true, data: record });
});

const getMaintenanceRecords = asyncHandler(async (req, res) => {
  const { machine, page = 1, limit = 20 } = req.query;
  const query = {};
  if (machine) query.machine = machine;

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    Maintenance.find(query)
      .populate("machine", "machineName machineNumber")
      .populate("performedBy", "name employeeId")
      .sort({ maintenanceDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Maintenance.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: records,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

const getMaintenanceById = asyncHandler(async (req, res) => {
  const record = await Maintenance.findById(req.params.id)
    .populate("machine", "machineName machineNumber")
    .populate("performedBy", "name employeeId");
  if (!record) {
    res.status(404);
    throw new Error("Maintenance record not found");
  }
  res.json({ success: true, data: record });
});

const updateMaintenance = asyncHandler(async (req, res) => {
  const record = await Maintenance.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Maintenance record not found");
  }
  Object.assign(record, req.body);
  await record.save();
  res.json({ success: true, data: record });
});

const deleteMaintenance = asyncHandler(async (req, res) => {
  const record = await Maintenance.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Maintenance record not found");
  }
  await record.deleteOne();
  res.json({ success: true, message: "Maintenance record deleted" });
});

// @desc  Records whose nextMaintenanceDate is due today/overdue (scheduler use)
const getDueMaintenance = asyncHandler(async (req, res) => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const due = await Maintenance.find({
    nextMaintenanceDate: { $lte: endOfToday, $ne: null },
  }).populate({
    path: "machine",
    populate: { path: "assignedEmployees", select: "name phoneNumber email" },
  });

  res.json({ success: true, data: due });
});

module.exports = {
  createMaintenance,
  getMaintenanceRecords,
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
  getDueMaintenance,
};
