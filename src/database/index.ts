import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// 创建数据库连接
const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { schema }); 