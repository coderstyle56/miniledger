import fs from "fs";
import path from "path";
import  { pool } from "./db"

async function migrate() {
    const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(sql);
    console.log("Migration done");
    await pool.end();
}
 migrate().catch((err) => {
    console.error("Migration failed:",err);
    process.exit(1)
 })