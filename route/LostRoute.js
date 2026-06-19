import { createLost, deleteLost, getAllLost, getLostById, getLostByUserId, updateLost } from "../controller/LostController.js";
import upload from "../middleware/Multer.js";
import { RestrictLogin } from "../middleware/RestrictLogin.js";
import express from "express";

const lostRouter = express.Router();

lostRouter.post(
  "/createlost",
  RestrictLogin,
  upload.single("lostimage"),
  createLost
);

lostRouter.get("/getlost", getAllLost);

lostRouter.get("/getlost/:id", getLostById);

lostRouter.get("/getlostbyuserid", RestrictLogin, getLostByUserId);

lostRouter.put("/updatelost/:id", RestrictLogin, upload.single("lostimage"), updateLost);

lostRouter.delete("/deletelost/:id", RestrictLogin, deleteLost);

export default lostRouter;