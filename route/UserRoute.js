import { register,login,logout, getAllUsers, deleteUser } from "../controller/UserController.js";
import express from 'express'
const userRouter=express.Router();
userRouter.post('/register',register)
userRouter.post('/login',login)
userRouter.get('/logout',logout)
userRouter.get('/getalluser',getAllUsers)
userRouter.delete('/deleteuser/:id',deleteUser)
export default userRouter