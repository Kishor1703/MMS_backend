const asyncHandler = require("express-async-handler");
const OilChange = require("../models/OilChange");
const Machine = require("../models/Machine");
const ActivityLog = require("../models/ActivityLog");

// @desc    Log a new oil change. nextOilChangeDate = oilChangeDate + 6 months
//          is computed automatically by the OilChange model's pre-validate hook.
// @route   POST /api/oil-changes
// @access  Owner, assigned Employee
const createOilChange = asyncHandler(async (req, res) => {
  const {
    machine,
    oilChangeDate,
    oilType,
    oilQuantity,
    changedBy,
    remarks,
    reminderMonthsInterval,
  } = req.body;

  const machineDoc = await Machine.findOne({ _id: machine, isDeleted: false });
  if (!machineDoc) {
    res.status(404);
    throw new Error("Machine not found");
  }

  const oilChange = await OilChange.create({
    machine,
    oilChangeDate,
    oilType,
    oilQuantity,
    changedBy,
    remarks,
    reminderMonthsInterval,
  });

  await ActivityLog.create({
    user: req.user?._id,
    action: "CREATE_OIL_CHANGE",
    entityType: "OilChange",
    entityId: oilChange._id,
    details: { machine, oilChangeDate },
  });

  res.status(201).json({ success: true, data: oilChange });
});

// @desc    List oil change history, optionally filtered by machine
// @route   GET /api/oil-changes?machine=<id>
// @access  Owner, Employee
const getOilChanges = asyncHandler(async (req, res) => {
  const { machine, page = 1, limit = 20 } = req.query;
  const query = {};
  if (machine) query.machine = machine;

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    OilChange.find(query)
      .populate("machine", "machineName machineNumber")
      .populate("changedBy", "name employeeId")
      .sort({ oilChangeDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    OilChange.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: records,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// @desc    Get a single oil change record
// @route   GET /api/oil-changes/:id
const getOilChangeById = asyncHandler(async (req, res) => {
  const record = await OilChange.findById(req.params.id)
    .populate("machine", "machineName machineNumber")
    .populate("changedBy", "name employeeId");

  if (!record) {
    res.status(404);
    throw new Error("Oil change record not found");
  }
  res.json({ success: true, data: record });
});

// @desc    Update an oil change record. If oilChangeDate changes, the
//          nextOilChangeDate is automatically recalculated by the model hook,
//          and the reminder flag resets so a fresh reminder will fire.
// @route   PUT /api/oil-changes/:id
// @access  Owner, assigned Employee
const updateOilChange = asyncHandler(async (req, res) => {
  const record = await OilChange.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Oil change record not found");
  }

  Object.assign(record, req.body);
  await record.save(); // triggers pre-validate hook to recompute nextOilChangeDate

  res.json({ success: true, data: record });
});

// @desc    Delete an oil change record
// @route   DELETE /api/oil-changes/:id
// @access  Owner
const deleteOilChange = asyncHandler(async (req, res) => {
  const record = await OilChange.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Oil change record not found");
  }
  await record.deleteOne();
  res.json({ success: true, message: "Oil change record deleted" });
});

// @desc    Records due today (or overdue) that haven't had a reminder sent.
//          Called internally by the Python scheduler once a day.
// @route   GET /api/oil-changes/due/today
// @access  Scheduler (x-scheduler-key) or Owner
const getDueOilChanges = asyncHandler(async (req, res) => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const due = await OilChange.find({
    nextOilChangeDate: { $lte: endOfToday },
    reminderSent: false,
  })
    .populate("machine", "machineName machineNumber assignedEmployees")
    .populate({
      path: "machine",
      populate: { path: "assignedEmployees", select: "name phoneNumber email" },
    });

  res.json({ success: true, data: due });
});

// @desc    Mark a record's reminder as sent (called by scheduler after it
//          successfully dispatches SMS/WhatsApp/Email).
// @route   PATCH /api/oil-changes/:id/mark-reminder-sent
// @access  Scheduler (x-scheduler-key)
const markReminderSent = asyncHandler(async (req, res) => {
  const record = await OilChange.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Oil change record not found");
  }
  record.reminderSent = true;
  record.reminderSentAt = new Date();
  await record.save({ validateBeforeSave: false });
  res.json({ success: true, data: record });
});

module.exports = {
  createOilChange,
  getOilChanges,
  getOilChangeById,
  updateOilChange,
  deleteOilChange,
  getDueOilChanges,
  markReminderSent,
};
