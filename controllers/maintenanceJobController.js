const asyncHandler = require("express-async-handler");
const MaintenanceJob = require("../models/MaintenanceJob");
const Machine = require("../models/Machine");

// POST /api/maintenance-jobs
const createMaintenanceJob = asyncHandler(async (req, res) => {
  const machine = await Machine.findOne({ _id: req.body.machine, isDeleted: false });
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }
  const job = await MaintenanceJob.create(req.body);
  res.status(201).json({ success: true, data: job });
});

// GET /api/maintenance-jobs?machine=<id>&page=1&limit=20
const getMaintenanceJobs = asyncHandler(async (req, res) => {
  const { machine, page = 1, limit = 20 } = req.query;
  const query = {};
  if (machine) query.machine = machine;

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    MaintenanceJob.find(query)
      .populate("machine", "machineName machineNumber")
      .populate("performedBy", "name employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    MaintenanceJob.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: records,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// GET /api/maintenance-jobs/:id
const getMaintenanceJobById = asyncHandler(async (req, res) => {
  const job = await MaintenanceJob.findById(req.params.id)
    .populate("machine", "machineName machineNumber")
    .populate("performedBy", "name employeeId");
  if (!job) {
    res.status(404);
    throw new Error("Maintenance job not found");
  }
  res.json({ success: true, data: job });
});

// PUT /api/maintenance-jobs/:id
const updateMaintenanceJob = asyncHandler(async (req, res) => {
  const job = await MaintenanceJob.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Maintenance job not found");
  }
  Object.assign(job, req.body);
  await job.save();
  res.json({ success: true, data: job });
});

// DELETE /api/maintenance-jobs/:id  (owner only)
const deleteMaintenanceJob = asyncHandler(async (req, res) => {
  const job = await MaintenanceJob.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Maintenance job not found");
  }
  await job.deleteOne();
  res.json({ success: true, message: "Maintenance job deleted" });
});

module.exports = {
  createMaintenanceJob,
  getMaintenanceJobs,
  getMaintenanceJobById,
  updateMaintenanceJob,
  deleteMaintenanceJob,
};
