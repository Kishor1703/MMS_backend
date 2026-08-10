const asyncHandler = require("express-async-handler");
const Report = require("../models/Report");

// @desc  Request a report. This just records the request; the Python service
//        picks it up (or is called synchronously via its own HTTP endpoint)
//        to actually render the PDF/Excel/CSV and then PATCHes fileUrl back.
// @route POST /api/reports
const requestReport = asyncHandler(async (req, res) => {
  const report = await Report.create({ ...req.body, generatedBy: req.user._id });
  res.status(201).json({ success: true, data: report });
});

const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ generatedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: reports });
});

// @desc  Python service calls this once the file is generated
// @route PATCH /api/reports/:id/complete
// @access Scheduler (x-scheduler-key)
const completeReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }
  report.fileUrl = req.body.fileUrl;
  await report.save();
  res.json({ success: true, data: report });
});

module.exports = { requestReport, getReports, completeReport };
