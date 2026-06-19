import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Contact is required"],
    },
    details: {
      type: String,
      required: [true, "Details are required"],
    },
    returnImage: {
      public_id: String,
      url: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lost",
      required: true,
    },
  },
  { timestamps: true }
);
const ReturnItem = mongoose.model("returnitem", returnItemSchema);
export default ReturnItem;