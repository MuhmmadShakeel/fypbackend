import mongoose from "mongoose";
const reviewSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
      reviews:{
        type:String,
        required:true
      },
})
const Review=mongoose.model("Review",reviewSchema)
export default Review