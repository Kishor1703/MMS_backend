const asyncHandler = require("express-async-handler");
const SparePart = require("../models/SparePart");
const Machine = require("../models/Machine");

const createSparePart = asyncHandler(async (req, res) => {
  const machine = await Machine.findOne({ _id: req.body.machine, isDeleted: false });
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }
  const record = await SparePart.create(req.body);
  res.status(201).json({ success: true, data: record });
});

const getSpareParts = asyncHandler(async (req, res) => {
  const { machine, page = 1, limit = 20 } = req.query;
  const query = {};
  if (machine) query.machine = machine;

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    SparePart.find(query)
      .populate("machine", "machineName machineNumber")
      .populate("replacedBy", "name employeeId")
      .sort({ replacementDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    SparePart.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: records,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

const getSparePartById = asyncHandler(async (req, res) => {
  const record = await SparePart.findById(req.params.id)
    .populate("machine", "machineName machineNumber")
    .populate("replacedBy", "name employeeId");
  if (!record) {
    res.status(404);
    throw new Error("Spare part record not found");
  }
  res.json({ success: true, data: record });
});

const updateSparePart = asyncHandler(async (req, res) => {
  const record = await SparePart.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Spare part record not found");
  }
  Object.assign(record, req.body);
  await record.save();
  res.json({ success: true, data: record });
});

const deleteSparePart = asyncHandler(async (req, res) => {
  const record = await SparePart.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Spare part record not found");
  }
  await record.deleteOne();
  res.json({ success: true, message: "Spare part record deleted" });
});

module.exports = {
  createSparePart,
  getSpareParts,
  getSparePartById,
  updateSparePart,
  deleteSparePart,
};
