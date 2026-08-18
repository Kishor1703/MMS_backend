const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    maintenanceDate: { type: Date, required: true, default: Date.now },
    maintenanceType: {
      type: String,
      enum: ["Preventive", "Corrective", "Breakdown", "Inspection", "Other"],
      required: true,
    },
    description: { type: String, trim: true },
    machineRunningHours: { type: Number },
    nextMaintenanceDate: { type: Date },
    technicianName: { type: String, trim: true },
    remarks: { type: String, trim: true },
    photos: [{ type: String }],
    videos: [{ type: String }],
    reportPdf: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    approvalStatus: {
      type: String,
      enum: ["Submitted", "Approved", "Rejected"],
      default: "Submitted",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

maintenanceSchema.index({ machine: 1, maintenanceDate: -1 });
maintenanceSchema.index({ nextMaintenanceDate: 1 });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
