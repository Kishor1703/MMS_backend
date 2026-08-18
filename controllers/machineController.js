const asyncHandler = require("express-async-handler");
const Machine = require("../models/Machine");
const Maintenance = require("../models/Maintenance");
const OilChange = require("../models/OilChange");
const SparePart = require("../models/SparePart");
const Employee = require("../models/Employee");
const ActivityLog = require("../models/ActivityLog");

const isAssignedEmployee = async (user, machineId) => {
  if (user.role !== "employee") return false;
  const employee = await Employee.findOne({ user: user._id, isActive: true });
  return Boolean(employee?.assignedMachines.some((id) => String(id) === String(machineId)));
};

const canViewMachine = async (user, machineId) =>
  ["admin", "owner", "general_manager"].includes(user.role) ||
  isAssignedEmployee(user, machineId);

const logActivity = (req, action, entityType, entityId, details = {}) =>
  ActivityLog.create({
    user: req.user?._id,
    action,
    entityType,
    entityId,
    details,
    ipAddress: req.ip,
  });

// @desc    Create a machine
// @route   POST /api/machines
// @access  Owner
const createMachine = asyncHandler(async (req, res) => {
  const {
    machineId,
    machineName,
    machineNumber,
    machineType,
    company,
    modelNumber,
    serialNumber,
    purchaseDate,
    installationDate,
    warrantyExpiry,
    machineImage,
    status,
  } = req.body;

  if (!machineId || !machineName || !machineNumber) {
    res.status(400);
    throw new Error("machineId, machineName and machineNumber are required");
  }

  const exists = await Machine.findOne({
    $or: [{ machineId }, { machineNumber }],
  });
  if (exists) {
    res.status(409);
    throw new Error("A machine with this ID or number already exists");
  }

  const machine = await Machine.create({
    machineId,
    machineName,
    machineNumber,
    machineType,
    company,
    modelNumber,
    serialNumber,
    purchaseDate,
    installationDate,
    warrantyExpiry,
    machineImage,
    status,
  });

  await logActivity(req, "CREATE_MACHINE", "Machine", machine._id, {
    machineName,
  });

  res.status(201).json({ success: true, data: machine });
});

// @desc    List machines (with search + filters + pagination)
// @route   GET /api/machines
// @access  Owner, Employee (employee sees only assigned machines)
const getMachines = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const query = { isDeleted: false };

  if (status) query.status = status;

  if (search) {
    query.$or = [
      { machineName: { $regex: search, $options: "i" } },
      { machineNumber: { $regex: search, $options: "i" } },
      { machineType: { $regex: search, $options: "i" } },
    ];
  }

  // Employees only see machines assigned to them
  if (req.user.role === "employee") {
    const employee = await Employee.findOne({ user: req.user._id });
    query._id = { $in: employee ? employee.assignedMachines : [] };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [machines, total] = await Promise.all([
    Machine.find(query)
      .populate("assignedEmployees", "name employeeId department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Machine.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: machines,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// @desc    Get a single machine profile page (info + all related history)
// @route   GET /api/machines/:id
// @access  Owner, assigned Employee
const getMachineById = asyncHandler(async (req, res) => {
  const machine = await Machine.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).populate("assignedEmployees", "name employeeId department phoneNumber");

  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }
  if (!(await canViewMachine(req.user, machine._id))) {
    res.status(403);
    throw new Error("You can only access machines assigned to you");
  }

  const [maintenanceHistory, oilChangeHistory, spareHistory] =
    await Promise.all([
      Maintenance.find({ machine: machine._id }).sort({ maintenanceDate: -1 }),
      OilChange.find({ machine: machine._id }).sort({ oilChangeDate: -1 }),
      SparePart.find({ machine: machine._id }).sort({ replacementDate: -1 }),
    ]);

  res.json({
    success: true,
    data: {
      machine,
      maintenanceHistory,
      oilChangeHistory,
      spareHistory,
      upcomingMaintenance: maintenanceHistory
        .filter((m) => m.nextMaintenanceDate && m.nextMaintenanceDate > new Date())
        .sort((a, b) => a.nextMaintenanceDate - b.nextMaintenanceDate)[0] || null,
    },
  });
});

// @desc    Update a machine
// @route   PUT /api/machines/:id
// @access  Owner
const updateMachine = asyncHandler(async (req, res) => {
  const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }
  Object.assign(machine, req.body);
  await machine.save();

  await logActivity(req, "UPDATE_MACHINE", "Machine", machine._id, req.body);

  res.json({ success: true, data: machine });
});

// @desc    Update machine status only (Running/Under Maintenance/Breakdown/Idle)
// @route   PATCH /api/machines/:id/status
// @access  Owner, assigned Employee
const updateMachineStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["Running", "Under Maintenance", "Breakdown", "Idle"];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${allowed.join(", ")}`);
  }

  const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }
  const canUpdateStatus =
    ["admin", "owner"].includes(req.user.role) ||
    (await isAssignedEmployee(req.user, machine._id));
  if (!canUpdateStatus) {
    res.status(403);
    throw new Error("You can only update the status of an assigned machine");
  }

  machine.status = status;
  await machine.save();

  await logActivity(req, "UPDATE_MACHINE_STATUS", "Machine", machine._id, { status });

  res.json({ success: true, data: machine });
});

// @desc    Soft-delete a machine
// @route   DELETE /api/machines/:id
// @access  Owner
const deleteMachine = asyncHandler(async (req, res) => {
  const machine = await Machine.findById(req.params.id);
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }

  machine.isDeleted = true;
  await machine.save();

  await logActivity(req, "DELETE_MACHINE", "Machine", machine._id);

  res.json({ success: true, message: "Machine deleted" });
});

// @desc    Assign machine to one or more employees
// @route   POST /api/machines/:id/assign
// @access  Owner
const assignMachine = asyncHandler(async (req, res) => {
  const { employeeIds } = req.body; // array of Employee _ids
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    res.status(400);
    throw new Error("employeeIds must be a non-empty array");
  }

  const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }

  machine.assignedEmployees = Array.from(
    new Set([...machine.assignedEmployees.map(String), ...employeeIds])
  );
  await machine.save();

  await Employee.updateMany(
    { _id: { $in: employeeIds } },
    { $addToSet: { assignedMachines: machine._id } }
  );

  await logActivity(req, "ASSIGN_MACHINE", "Machine", machine._id, { employeeIds });

  res.json({ success: true, data: machine });
});

module.exports = {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  updateMachineStatus,
  deleteMachine,
  assignMachine,
};
