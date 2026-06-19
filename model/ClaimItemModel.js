import mongoose, { Schema } from "mongoose";

const claimItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    details: {
      type: String,
      required: true,
      trim: true,
    },

    claimImage: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Found",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const ClaimItem = mongoose.model("ClaimItem", claimItemSchema);

export default ClaimItem;