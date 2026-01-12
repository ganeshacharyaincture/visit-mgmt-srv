import { db } from "../../db"

export async function getHospitals() {
    return await db.query.hospitals.findMany();
}