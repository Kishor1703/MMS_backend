const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: [
        "Daily",
        "Weekly",
        "Monthly",
        "Yearly",
        "Machine",
        "Employee",
        "Oil Change",
        "Spare",
      ],
      required: true,
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dateRangeStart: { type: Date },
    dateRangeEnd: { type: Date },
    filters: { type: mongoose.Schema.Types.Mixed },
    format: { type: String, enum: ["pdf", "excel", "csv"], default: "pdf" },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
