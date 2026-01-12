import express from "express";
const router = express.Router();
import * as hosptialsContollerInstance from "./hospitals.controller";

// define all hosptials routes here
router.get("/getHospitals", hosptialsContollerInstance.getHospitals);

export default router;