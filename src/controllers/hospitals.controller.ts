import { db } from "@/db/index";

export async function getHospitals() {
    return await db.query.hospitals.findMany();
}

export default { getHospitals}