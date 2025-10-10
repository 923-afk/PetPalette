import { type User, type InsertUser, type Clinic, type InsertClinic, type Pet, type InsertPet, type Appointment, type InsertAppointment, type MedicalRecord, type InsertMedicalRecord, type Vaccination, type InsertVaccination } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;

  // Clinic methods
  getClinic(id: string): Promise<Clinic | undefined>;
  getClinicByUserId(userId: string): Promise<Clinic | undefined>;
  getClinics(): Promise<Clinic[]>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, clinic: Partial<Clinic>): Promise<Clinic>;

  // Pet methods
  getPet(id: string): Promise<Pet | undefined>;
  getPetsByOwner(ownerId: string): Promise<Pet[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: string, pet: Partial<Pet>): Promise<Pet>;
  deletePet(id: string): Promise<void>;

  // Appointment methods
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByOwner(ownerId: string): Promise<Appointment[]>;
  getAppointmentsByClinic(clinicId: string): Promise<Appointment[]>;
  getAppointmentsByDate(clinicId: string, date: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  // Medical record methods
  getMedicalRecord(id: string): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPet(petId: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: string, record: Partial<MedicalRecord>): Promise<MedicalRecord>;

  // Vaccination methods
  getVaccination(id: string): Promise<Vaccination | undefined>;
  getVaccinationsByPet(petId: string): Promise<Vaccination[]>;
  createVaccination(vaccination: InsertVaccination): Promise<Vaccination>;
  updateVaccination(id: string, vaccination: Partial<Vaccination>): Promise<Vaccination>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clinics: Map<string, Clinic> = new Map();
  private pets: Map<string, Pet> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private medicalRecords: Map<string, MedicalRecord> = new Map();
  private vaccinations: Map<string, Vaccination> = new Map();

  constructor() {
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo owner user
    const demoOwner: User = {
      id: "owner-1",
      email: "owner.demo@example.com",
      password: "$2b$10$demo.password.hash", // In real app, this would be properly hashed
      firstName: "Sarah",
      lastName: "Johnson",
      userType: "owner",
      phone: "+1-555-0123",
      address: "123 Main St, Anytown, ST 12345",
      createdAt: new Date(),
    };
    this.users.set(demoOwner.id, demoOwner);

    // Demo clinic user
    const demoClinicUser: User = {
      id: "clinic-user-1",
      email: "clinic.demo@example.com",
      password: "$2b$10$demo.password.hash",
      firstName: "Dr. Michael",
      lastName: "Smith",
      userType: "clinic",
      phone: "+1-555-0456",
      address: "456 Veterinary Ave, Petville, ST 12346",
      createdAt: new Date(),
    };
    this.users.set(demoClinicUser.id, demoClinicUser);

    // Demo clinic
    const demoClinic: Clinic = {
      id: "clinic-1",
      userId: "clinic-user-1",
      name: "Westside Animal Clinic",
      description: "Full-service veterinary clinic providing comprehensive care for pets",
      address: "456 Veterinary Ave, Petville, ST 12346",
      phone: "+1-555-0456",
      email: "contact@westsideanimal.com",
      hours: JSON.stringify({
        monday: "8:00-18:00",
        tuesday: "8:00-18:00",
        wednesday: "8:00-18:00",
        thursday: "8:00-18:00",
        friday: "8:00-18:00",
        saturday: "9:00-15:00",
        sunday: "closed"
      }),
      services: ["General Checkup", "Vaccination", "Dental Care", "Surgery", "Emergency Care"],
      createdAt: new Date(),
    };
    this.clinics.set(demoClinic.id, demoClinic);

    // Demo pets
    const demoPet1: Pet = {
      id: "pet-1",
      ownerId: "owner-1",
      name: "Max",
      species: "dog",
      breed: "Golden Retriever",
      gender: "male",
      birthDate: new Date("2021-03-15"),
      weight: "32.5",
      color: "Golden",
      microchipId: "123456789012345",
      photoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
      medicalNotes: "Friendly and energetic. No known allergies.",
      createdAt: new Date(),
    };
    this.pets.set(demoPet1.id, demoPet1);

    const demoPet2: Pet = {
      id: "pet-2",
      ownerId: "owner-1",
      name: "Luna",
      species: "cat",
      breed: "Persian",
      gender: "female",
      birthDate: new Date("2022-01-20"),
      weight: "4.2",
      color: "White",
      microchipId: "123456789012346",
      photoUrl: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400",
      medicalNotes: "Indoor cat. Requires regular grooming.",
      createdAt: new Date(),
    };
    this.pets.set(demoPet2.id, demoPet2);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      address: insertUser.address ?? null,
      phone: insertUser.phone ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Clinic methods
  async getClinic(id: string): Promise<Clinic | undefined> {
    return this.clinics.get(id);
  }

  async getClinicByUserId(userId: string): Promise<Clinic | undefined> {
    return Array.from(this.clinics.values()).find(clinic => clinic.userId === userId);
  }

  async getClinics(): Promise<Clinic[]> {
    return Array.from(this.clinics.values());
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const id = randomUUID();
    const clinic: Clinic = { 
      ...insertClinic, 
      id, 
      createdAt: new Date(),
      description: insertClinic.description ?? null,
      hours: insertClinic.hours ?? null,
      services: insertClinic.services ?? null
    };
    this.clinics.set(id, clinic);
    return clinic;
  }

  async updateClinic(id: string, clinicData: Partial<Clinic>): Promise<Clinic> {
    const clinic = this.clinics.get(id);
    if (!clinic) throw new Error("Clinic not found");
    const updatedClinic = { ...clinic, ...clinicData };
    this.clinics.set(id, updatedClinic);
    return updatedClinic;
  }

  // Pet methods
  async getPet(id: string): Promise<Pet | undefined> {
    return this.pets.get(id);
  }

  async getPetsByOwner(ownerId: string): Promise<Pet[]> {
    return Array.from(this.pets.values()).filter(pet => pet.ownerId === ownerId);
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const id = randomUUID();
    const pet: Pet = { 
      ...insertPet, 
      id, 
      createdAt: new Date(),
      breed: insertPet.breed ?? null,
      gender: insertPet.gender ?? null,
      birthDate: insertPet.birthDate ?? null,
      weight: insertPet.weight ?? null,
      color: insertPet.color ?? null,
      microchipId: insertPet.microchipId ?? null,
      photoUrl: insertPet.photoUrl ?? null,
      medicalNotes: insertPet.medicalNotes ?? null
    };
    this.pets.set(id, pet);
    return pet;
  }

  async updatePet(id: string, petData: Partial<Pet>): Promise<Pet> {
    const pet = this.pets.get(id);
    if (!pet) throw new Error("Pet not found");
    const updatedPet = { ...pet, ...petData };
    this.pets.set(id, updatedPet);
    return updatedPet;
  }

  async deletePet(id: string): Promise<void> {
    this.pets.delete(id);
  }

  // Appointment methods
  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByOwner(ownerId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => apt.ownerId === ownerId);
  }

  async getAppointmentsByClinic(clinicId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => apt.clinicId === clinicId);
  }

  async getAppointmentsByDate(clinicId: string, date: string): Promise<Appointment[]> {
    const targetDate = new Date(date);
    return Array.from(this.appointments.values()).filter(apt => 
      apt.clinicId === clinicId && 
      apt.appointmentDate.toDateString() === targetDate.toDateString()
    );
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt: new Date(),
      doctorName: insertAppointment.doctorName ?? null,
      duration: insertAppointment.duration ?? null,
      reason: insertAppointment.reason ?? null,
      notes: insertAppointment.notes ?? null,
      diagnosis: insertAppointment.diagnosis ?? null,
      treatment: insertAppointment.treatment ?? null,
      cost: insertAppointment.cost ?? null
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: string, appointmentData: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");
    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<void> {
    this.appointments.delete(id);
  }

  // Medical record methods
  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }

  async getMedicalRecordsByPet(petId: string): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values())
      .filter(record => record.petId === petId)
      .sort((a, b) => {
        const dateA = a.recordDate ? new Date(a.recordDate).getTime() : 0;
        const dateB = b.recordDate ? new Date(b.recordDate).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = randomUUID();
    const record: MedicalRecord = { 
      ...insertRecord, 
      id, 
      createdAt: new Date(),
      description: insertRecord.description ?? null,
      diagnosis: insertRecord.diagnosis ?? null,
      treatment: insertRecord.treatment ?? null,
      medications: insertRecord.medications ?? null,
      weight: insertRecord.weight ?? null,
      temperature: insertRecord.temperature ?? null,
      notes: insertRecord.notes ?? null,
      documentUrls: insertRecord.documentUrls ?? null,
      recordDate: insertRecord.recordDate ?? new Date(),
      appointmentId: insertRecord.appointmentId ?? null
    };
    this.medicalRecords.set(id, record);
    return record;
  }

  async updateMedicalRecord(id: string, recordData: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const record = this.medicalRecords.get(id);
    if (!record) throw new Error("Medical record not found");
    const updatedRecord = { ...record, ...recordData };
    this.medicalRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Vaccination methods
  async getVaccination(id: string): Promise<Vaccination | undefined> {
    return this.vaccinations.get(id);
  }

  async getVaccinationsByPet(petId: string): Promise<Vaccination[]> {
    return Array.from(this.vaccinations.values())
      .filter(vaccination => vaccination.petId === petId)
      .sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime());
  }

  async createVaccination(insertVaccination: InsertVaccination): Promise<Vaccination> {
    const id = randomUUID();
    const vaccination: Vaccination = { 
      ...insertVaccination, 
      id, 
      createdAt: new Date(),
      manufacturer: insertVaccination.manufacturer ?? null,
      lotNumber: insertVaccination.lotNumber ?? null,
      nextDueDate: insertVaccination.nextDueDate ?? null,
      veterinarian: insertVaccination.veterinarian ?? null,
      notes: insertVaccination.notes ?? null
    };
    this.vaccinations.set(id, vaccination);
    return vaccination;
  }

  async updateVaccination(id: string, vaccinationData: Partial<Vaccination>): Promise<Vaccination> {
    const vaccination = this.vaccinations.get(id);
    if (!vaccination) throw new Error("Vaccination not found");
    const updatedVaccination = { ...vaccination, ...vaccinationData };
    this.vaccinations.set(id, updatedVaccination);
    return updatedVaccination;
  }
}

export const storage = new MemStorage();
