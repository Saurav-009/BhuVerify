import { boolean, integer, pgSequence, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const grievanceNumberSequence = pgSequence("land_record_grievance_number_seq", {
  startWith: 48,
});

export const landRecordGrievancesTable = pgTable("land_record_grievances", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  subject: text("subject").notNull(),
  citizen: text("citizen").notNull(),
  village: text("village").notNull(),
  status: text("status").notNull(),
  priority: text("priority").notNull(),
  created: text("created").notNull(),
  concern: text("concern").notNull(),
  resolution: text("resolution").notNull().default(""),
  citizenCreated: boolean("citizen_created").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const landRecordGrievanceAuditsTable = pgTable("land_record_grievance_audits", {
  id: serial("id").primaryKey(),
  grievanceId: text("grievance_id").notNull(),
  event: text("event").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const landRecordCasesTable = pgTable("land_record_cases", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  village: text("village").notNull(),
  risk: integer("risk").notNull(),
  status: text("status").notNull(),
  priority: text("priority").notNull(),
  decisionAction: text("decision_action"),
  decisionRemarks: text("decision_remarks"),
  decisionTimestamp: text("decision_timestamp"),
  decisionOfficer: text("decision_officer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const landRecordCaseAuditsTable = pgTable("land_record_case_audits", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull(),
  event: text("event").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLandRecordGrievanceSchema = createInsertSchema(landRecordGrievancesTable).omit({ createdAt: true, updatedAt: true });
export const insertLandRecordGrievanceAuditSchema = createInsertSchema(landRecordGrievanceAuditsTable).omit({ id: true, createdAt: true });
export const insertLandRecordCaseSchema = createInsertSchema(landRecordCasesTable).omit({ createdAt: true, updatedAt: true });
export const insertLandRecordCaseAuditSchema = createInsertSchema(landRecordCaseAuditsTable).omit({ id: true, createdAt: true });

export type LandRecordGrievance = z.infer<typeof insertLandRecordGrievanceSchema>;
export type LandRecordGrievanceAudit = z.infer<typeof insertLandRecordGrievanceAuditSchema>;
export type LandRecordCase = z.infer<typeof insertLandRecordCaseSchema>;
export type LandRecordCaseAudit = z.infer<typeof insertLandRecordCaseAuditSchema>;