import Review from "../model/ReviewModel.js";

export const createReview=async(req,res)=>{
    try {
        const {reviews}=req.body;
        if(!reviews){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }   
        const review=await Review.create({
            user:req.userId,
            reviews
        })
        return res.status(201).json({
            success:true,
            message:"Review created successfully",
            review
        })
    } catch (error) {
        return res.status(500).json({
            success:false,      
            message:"Server Error",
            error:error.message
        })
    }
}

export const getAllReviews=async(req,res)=>{
    try {
        const reviews=await Review.find().populate("user","name email")
        return res.status(200).json({
            success:true,
            message:"Reviews fetched successfully",
            reviews
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error",
            error:error.message
        })
    }
}

export const deleteReview=async(req,res)=>{
    try {
        const review=await Review.findById(req.params.id)
        if(!review){
            return res.status(404).json({
                success:false,
                message:"Review not found"
            })
        }
       
         const deletedReview=await Review.findByIdAndDelete(req.params.id)
        return res.status(200).json({
            success:true,
            message:"Review deleted successfully",
            review:deletedReview
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error",
            error:error.message
        })
    }
}
