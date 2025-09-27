import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  userType: text("user_type").notNull(), // 'owner' | 'clinic'
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  hours: text("hours"), // JSON string for operating hours
  services: text("services").array(), // array of services offered
  createdAt: timestamp("created_at").defaultNow(),
});

export const pets = pgTable("pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  species: text("species").notNull(), // dog, cat, etc.
  breed: text("breed"),
  gender: text("gender"), // male, female
  birthDate: timestamp("birth_date"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  color: text("color"),
  microchipId: text("microchip_id"),
  photoUrl: text("photo_url"),
  medicalNotes: text("medical_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").references(() => pets.id).notNull(),
  clinicId: varchar("clinic_id").references(() => clinics.id).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  doctorName: text("doctor_name"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(30), // minutes
  serviceType: text("service_type").notNull(), // checkup, vaccination, dental, surgery, etc.
  status: text("status").notNull(), // pending, confirmed, in-progress, completed, cancelled
  reason: text("reason"),
  notes: text("notes"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  cost: decimal("cost", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").references(() => pets.id).notNull(),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  clinicId: varchar("clinic_id").references(() => clinics.id).notNull(),
  recordType: text("record_type").notNull(), // vaccination, checkup, surgery, etc.
  title: text("title").notNull(),
  description: text("description"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  medications: text("medications").array(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  notes: text("notes"),
  documentUrls: text("document_urls").array(),
  recordDate: timestamp("record_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vaccinations = pgTable("vaccinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").references(() => pets.id).notNull(),
  clinicId: varchar("clinic_id").references(() => clinics.id).notNull(),
  vaccineName: text("vaccine_name").notNull(),
  manufacturer: text("manufacturer"),
  lotNumber: text("lot_number"),
  dateGiven: timestamp("date_given").notNull(),
  nextDueDate: timestamp("next_due_date"),
  veterinarian: text("veterinarian"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  createdAt: true,
});

export const insertPetSchema = createInsertSchema(pets).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
});

export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Pet = typeof pets.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
