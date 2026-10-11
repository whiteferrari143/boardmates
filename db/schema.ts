import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('sessions', {
 token: text('token').primaryKey(), playerId: text('player_id').notNull().unique(), name: text('name').notNull(), expires: integer('expires').notNull(),
 lastSeen: integer('last_seen').notNull().default(0), nameChanged: integer('name_changed').notNull().default(0),
}, table=>[index('idx_sessions_last_seen').on(table.lastSeen)]);
export const rooms = sqliteTable('rooms', { code: text('code').primaryKey(), data: text('data').notNull(), version: integer('version').notNull().default(0), updated: integer('updated').notNull() });
export const seats = sqliteTable('seats', { playerId:text('player_id').primaryKey(), roomCode:text('room_code').notNull(), leaseUntil:integer('lease_until').notNull() });
export const chatMessages = sqliteTable('chat_messages', {
 id:integer('id').primaryKey({autoIncrement:true}), requestId:text('request_id').notNull().unique(),
 playerId:text('player_id').notNull(), name:text('name').notNull(), body:text('body').notNull(), created:integer('created').notNull(),
}, table=>[index('idx_chat_messages_player_created').on(table.playerId,table.created)]);
