
import express from "express";
import { createReview, deleteReview, getAllReviews } from "../controller/ReviewController.js";
import { RestrictLogin } from "../middleware/RestrictLogin.js";
const reviewsRoute=express.Router();
reviewsRoute.post('/createreviews',RestrictLogin,createReview)
reviewsRoute.get('/getreviews',getAllReviews)
reviewsRoute.delete('/deletereview/:id',deleteReview)
export default reviewsRoute
