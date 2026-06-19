import mongoose from "mongoose";

const lostSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    lostimage: {
      public_id: String,
      url: String,
    },
      userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
  },
  },
  { timestamps: true }
);

 const Lost = mongoose.model("lost", lostSchema);
 export default Lost