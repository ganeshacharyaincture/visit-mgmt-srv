import express from "express";
const router = express.Router();
import hosptialsContollerInstance from "@/controllers/hospitals.controller";

// define all hosptials routes here
router.get("/getHospitals", hosptialsContollerInstance.getHospitals);

export default router;