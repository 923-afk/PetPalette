import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertPetSchema, insertAppointmentSchema, insertMedicalRecordSchema, insertVaccinationSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType,
        phone: data.phone,
        address: data.address,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET);
      
      res.json({ token, user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Check demo accounts
      if (data.email === "owner.demo@example.com" && data.password === "demo1234") {
        const user = await storage.getUserByEmail(data.email);
        if (user) {
          const token = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET);
          return res.json({ token, user: { ...user, password: undefined } });
        }
      }
      
      if (data.email === "clinic.demo@example.com" && data.password === "demo1234") {
        const user = await storage.getUserByEmail(data.email);
        if (user) {
          const token = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET);
          return res.json({ token, user: { ...user, password: undefined } });
        }
      }
      
      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(data.password, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET);
      
      res.json({ token, user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User routes
  app.get("/api/users/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Pet routes
  app.get("/api/pets", authenticateToken, async (req: any, res) => {
    try {
      const pets = await storage.getPetsByOwner(req.user.userId);
      res.json(pets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pets", authenticateToken, async (req: any, res) => {
    try {
      const data = insertPetSchema.parse({ ...req.body, ownerId: req.user.userId });
      const pet = await storage.createPet(data);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/pets/:id", authenticateToken, async (req: any, res) => {
    try {
      const pet = await storage.updatePet(req.params.id, req.body);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/pets/:id", authenticateToken, async (req: any, res) => {
    try {
      await storage.deletePet(req.params.id);
      res.json({ message: "Pet deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Clinic routes
  app.get("/api/clinics", async (req, res) => {
    try {
      const clinics = await storage.getClinics();
      res.json(clinics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clinics/my", authenticateToken, async (req: any, res) => {
    try {
      const clinic = await storage.getClinicByUserId(req.user.userId);
      res.json(clinic);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Appointment routes
  app.get("/api/appointments", authenticateToken, async (req: any, res) => {
    try {
      let appointments;
      if (req.user.userType === 'owner') {
        appointments = await storage.getAppointmentsByOwner(req.user.userId);
      } else {
        const clinic = await storage.getClinicByUserId(req.user.userId);
        if (clinic) {
          appointments = await storage.getAppointmentsByClinic(clinic.id);
        } else {
          appointments = [];
        }
      }
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/appointments", authenticateToken, async (req: any, res) => {
    try {
      const data = insertAppointmentSchema.parse({ ...req.body, ownerId: req.user.userId });
      const appointment = await storage.createAppointment(data);
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/appointments/:id", authenticateToken, async (req: any, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Medical records routes
  app.get("/api/pets/:petId/medical-records", authenticateToken, async (req: any, res) => {
    try {
      const records = await storage.getMedicalRecordsByPet(req.params.petId);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/medical-records", authenticateToken, async (req: any, res) => {
    try {
      const data = insertMedicalRecordSchema.parse(req.body);
      const record = await storage.createMedicalRecord(data);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Vaccination routes
  app.get("/api/pets/:petId/vaccinations", authenticateToken, async (req: any, res) => {
    try {
      const vaccinations = await storage.getVaccinationsByPet(req.params.petId);
      res.json(vaccinations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/vaccinations", authenticateToken, async (req: any, res) => {
    try {
      const data = insertVaccinationSchema.parse(req.body);
      const vaccination = await storage.createVaccination(data);
      res.json(vaccination);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
