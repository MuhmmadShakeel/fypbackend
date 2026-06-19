import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import userRouter from './route/UserRoute.js'
import reviewsRoute from './route/ReviewsRoute.js'
import lostRouter from './route/LostRoute.js'
import foundRoute from './route/FoundRoute.js'
import ProfileRoute from './route/ProfileRoute.js'
import claimRouter from './route/ClimItemRoute.js'
import returnRouter from './route/ReturnItemRoute.js'
const app=express()
import dotenv from 'dotenv'
dotenv.config()
app.use(express.json())
const PORT=process.env.PORT || 4000
const MONGO_URI=process.env.MONGO_URI
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
mongoose.connect(MONGO_URI)

.then(()=>{
    console.log("Connected to database  Successfully")
})
.catch((error)=>{
     console.log("error in database connection",error)
})
app.use('/api/v1/user',userRouter)
app.use('/api/v2/reviews',reviewsRoute)
app.use('/api/v3/lostposts',lostRouter)
app.use('/api/v4/foundposts',foundRoute)
app.use('/api/v5/profile',ProfileRoute)
app.use('/api/v6/claim',claimRouter)
app.use('/api/v7/return',returnRouter)
app.listen(PORT,()=>{
    console.log("Port Is running at",PORT)
})