import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// 个人区块链信息表
export const personalBlockchainInfo = sqliteTable("personal_blockchain_info", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    deviceId: text("device_id").notNull(),
    mnemonic: text("mnemonic").notNull(),
    publicKey: text("public_key").notNull(),
    privateKey: text("private_key").notNull(),
    chainType: text("chain_type").notNull(),
    address: text("address").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
}); 