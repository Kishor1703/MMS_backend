const mongoose = require("mongoose");

const spareUsedSchema = new mongoose.Schema(
  {
    spareName:   { type: String, required: true, trim: true },
    spareNumber: { type: String, trim: true },
    quantity:    { type: Number, default: 1 },
    price:       { type: Number, default: 0 },
  },
  { _id: false }
);

const maintenanceJobSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },

    // Step 1 — Why stopped + Downtime
    whyStopped:    { type: String, required: true, trim: true },
    downtimeStart: { type: Date, required: true },
    downtimeEnd:   { type: Date },
    downtimeHours: { type: Number }, // auto-computed on save

    // Step 2 — Engineer timeline + Work done
    engineerStarted:  { type: Date, required: true },
    engineerName:     { type: String, required: true, trim: true },
    engineerPhone:    { type: String, required: true, trim: true },
    workDone:         { type: String, trim: true },
    engineerFinished: { type: Date },

    // Step 3 — Spares used
    sparesUsed: { type: [spareUsedSchema], default: [] },

    // Step 4 — Cost + resolution
    totalCost:           { type: Number, default: 0 },
    finalStatus:         {
      type: String,
      enum: ["Resolved", "Partially Fixed", "Escalated", "Pending"],
      default: "Pending",
    },
    nextMaintenanceDate: { type: Date },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

// Auto-compute downtimeHours whenever downtimeEnd is set
maintenanceJobSchema.pre("save", function (next) {
  if (this.downtimeStart && this.downtimeEnd) {
    const diffMs = new Date(this.downtimeEnd) - new Date(this.downtimeStart);
    this.downtimeHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  }
  next();
});

maintenanceJobSchema.index({ machine: 1, createdAt: -1 });

module.exports = mongoose.model("MaintenanceJob", maintenanceJobSchema);
