import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertPetSchema, insertAppointmentSchema, insertMedicalRecordSchema, insertVaccinationSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret";

function normalizeMessage(text: string) {
  return (text || "").toLowerCase();
}

function generateChatReply(message: string, userType: string) {
  const msg = normalizeMessage(message);

  const sharedAnswers: Array<{ test: (m: string) => boolean; reply: string }> = [
    {
      test: (m) => /hello|hi|hey|good (morning|afternoon|evening)/.test(m),
      reply:
        "Hello! How can I help you today? You can ask about appointments, vaccinations, clinic hours, or pet care.",
    },
    {
      test: (m) => /hours?|open|close|closing|opening/.test(m),
      reply:
        "Typical clinic hours are Mon–Fri 8:00–18:00 and Sat 9:00–15:00. For exact times, check your clinic profile under Clinic Dashboard > Details.",
    },
    {
      test: (m) => /emergency|urgent|er|after[- ]?hours/.test(m),
      reply:
        "For emergencies, call your clinic immediately. If it's after hours, go to the nearest 24/7 emergency veterinary hospital.",
    },
    {
      test: (m) => /location|address|where/.test(m),
      reply:
        "You can find the clinic address on the Clinic page and in appointment details. Need me to open it?",
    },
  ];

  const ownerAnswers: Array<{ test: (m: string) => boolean; reply: string }> = [
    {
      test: (m) => /book|schedule|appointment|visit/.test(m),
      reply:
        "To book, go to Book > Select pet, service, date and time, then confirm. I can also prefill if you tell me the pet and service.",
    },
    {
      test: (m) => /vaccine|vaccination|shots?/.test(m),
      reply:
        "Core vaccines are recommended per species and age. Check your pet profile > Vaccinations for due dates, or book a vaccination visit.",
    },
    {
      test: (m) => /records?|history|medical/.test(m),
      reply:
        "Your pet's medical records are under Pets > Pet Profile > Medical Records.",
    },
    {
      test: (m) => /cost|price|fee|how much/.test(m),
      reply:
        "Prices vary by service. You can see typical ranges on the booking page after selecting a service.",
    },
    {
      test: (m) => /diet|food|nutrition|feeding/.test(m),
      reply:
        "For diet, follow your vet's recommendations. General tip: transition foods gradually over 5–7 days to avoid GI upset.",
    },
  ];

  const clinicAnswers: Array<{ test: (m: string) => boolean; reply: string }> = [
    {
      test: (m) => /today|schedule|availability|slots?/.test(m),
      reply:
        "View and manage today's schedule under Clinic Dashboard. Use Appointments to update status or add new bookings.",
    },
    {
      test: (m) => /patient|pet|owner/.test(m),
      reply:
        "Search patients from Clinic Dashboard > Today's Schedule or the Patients page. You can open a pet profile to see records.",
    },
    {
      test: (m) => /inventory|stock|medicine|vaccine/.test(m),
      reply:
        "Manage inventory from the quick actions on the Clinic Dashboard. Vaccine schedules are tracked per patient in Medical Records.",
    },
    {
      test: (m) => /analytics|revenue|stats?/.test(m),
      reply:
        "Analytics are available on the Clinic Dashboard. You can see appointments, revenue, and satisfaction trends.",
    },
  ];

  for (const a of sharedAnswers) {
    if (a.test(msg)) return a.reply;
  }
  if (userType === "owner") {
    for (const a of ownerAnswers) {
      if (a.test(msg)) return a.reply;
    }
  }
  if (userType === "clinic") {
    for (const a of clinicAnswers) {
      if (a.test(msg)) return a.reply;
    }
  }
  return "I'm here to help with appointments, vaccines, clinic hours, medical records, and more. Could you rephrase or add details?";
}

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
  const insertAppointmentServerSchema = insertAppointmentSchema.extend({
    appointmentDate: z.coerce.date(),
  });
  const insertMedicalRecordServerSchema = insertMedicalRecordSchema.extend({
    recordDate: z.coerce.date().optional(),
  });
  const insertVaccinationServerSchema = insertVaccinationSchema.extend({
    dateGiven: z.coerce.date(),
    nextDueDate: z.union([z.coerce.date(), z.null()]).optional(),
  });
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
      // For demo users we skip bcrypt, for others attempt compare
      let isValid = false;
      if (user.password?.startsWith("$2b$")) {
        isValid = await bcrypt.compare(data.password, user.password);
      }
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
  app.get("/api/pets/:id", authenticateToken, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.params.id);
      if (!pet) return res.status(404).json({ message: "Pet not found" });
      res.json(pet);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.get("/api/pets", authenticateToken, async (req: any, res) => {
    try {
      const pets = await storage.getPetsByOwner(req.user.userId);
      res.json(pets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/pets/:id", authenticateToken, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.params.id);
      if (!pet) return res.status(404).json({ message: "Pet not found" });
      if (pet.ownerId !== req.user.userId && req.user.userType !== 'clinic') {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(pet);
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
      let appointments: any[];
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
      const data = insertAppointmentServerSchema.parse({
        ...req.body,
        ownerId: req.user.userId,
      });
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
  app.get("/api/medical-records/:id", authenticateToken, async (req: any, res) => {
    try {
      const record = await storage.getMedicalRecord(req.params.id);
      if (!record) return res.status(404).json({ message: "Record not found" });
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
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
      const data = insertMedicalRecordServerSchema.parse(req.body);
      const record = await storage.createMedicalRecord(data);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Vaccination routes
  app.get("/api/vaccinations/:id", authenticateToken, async (req: any, res) => {
    try {
      const vaccination = await storage.getVaccination(req.params.id);
      if (!vaccination) return res.status(404).json({ message: "Vaccination not found" });
      res.json(vaccination);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin/user list route for clinic views (demo only)
  app.get("/api/users", authenticateToken, async (_req: any, res) => {
    try {
      // Expose limited user info for clinic filtering in demo
      const owner = await storage.getUserByEmail("owner.demo@example.com");
      const clinicUser = await storage.getUserByEmail("clinic.demo@example.com");
      const users = [owner, clinicUser].filter(Boolean).map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        userType: u.userType,
      }));
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
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
      const data = insertVaccinationServerSchema.parse(req.body);
      const vaccination = await storage.createVaccination(data);
      res.json(vaccination);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Chatbot route (merged)
  app.post("/api/chat", authenticateToken, async (req: any, res) => {
    try {
      const message: unknown = req.body?.message;
      if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Use our richer rule-based reply generator but keep origin/main's stricter typing
      const userType: "owner" | "clinic" = req.user?.userType === "clinic" ? "clinic" : "owner";
      const reply = generateChatReply(message, userType);
      return res.json({ reply, userType });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
