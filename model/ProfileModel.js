import mongoose from "mongoose";
const profileSchema = new mongoose.Schema(
  {
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    profilePicture: {
        url: { type: String },
        public_id: { type: String }
    },
    bio: {
         type: String
         },
        },
  { timestamps: true }
);
const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
