import { claimItem, getClaimInfo, deleteClaim, getAllClaims } from "../controller/ClaimItemController.js";
import upload from "../middleware/Multer.js";
import { RestrictLogin } from "../middleware/RestrictLogin.js";
import express from 'express'
const claimRouter=express.Router()
claimRouter.post('/claimitem/:id',upload.single('claimImage'),RestrictLogin,claimItem)
claimRouter.get('/getclaiminfo',RestrictLogin,getClaimInfo)
claimRouter.delete('/claimitem/:id',RestrictLogin,deleteClaim)
claimRouter.get('/allgetclaims',RestrictLogin,getAllClaims)
export default claimRouter