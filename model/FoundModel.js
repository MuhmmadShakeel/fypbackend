import mongoose from "mongoose";
const foundSchema = new mongoose.Schema(
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
    foundimage: {
      public_id: String,    
        url: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "user",    
    },
    contactInfo: {
      type: String,
      required: [true, "Contact information is required"],
    },
  },
  { timestamps: true }
);
const Found = mongoose.model("Found", foundSchema);
export default Found;