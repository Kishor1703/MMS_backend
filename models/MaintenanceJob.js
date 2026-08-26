const mongoose = require("mongoose");

const spareUsedSchema = new mongoose.Schema(
  {
    spareName:   { type: String, required: true, trim: true },
    spareNumber: { type: String, trim: true },
    quantity:    { type: Number, default: 1 },
    photoUrl:    { type: String, trim: true },
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

    // Why the machine stopped
    whyStopped:    { type: String, required: true, trim: true },

    // An empty list means no spares were used.
    sparesUsed: { type: [spareUsedSchema], default: [] },


    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

maintenanceJobSchema.index({ machine: 1, createdAt: -1 });

module.exports = mongoose.model("MaintenanceJob", maintenanceJobSchema);
