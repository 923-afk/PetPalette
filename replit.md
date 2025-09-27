# Overview

PetCare Pro is a comprehensive veterinary management system that connects pet owners with veterinary clinics. It provides appointment booking, pet health record management, and clinic management capabilities through a modern web application. The system supports two user types: pet owners who can manage their pets and book appointments, and veterinary clinics who can manage appointments and patient records.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management, custom auth manager for authentication state
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: TailwindCSS with CSS custom properties for theming
- **Build Tool**: Vite with custom configuration for development and production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Data Layer**: Storage abstraction with in-memory implementation (prepared for database integration)
- **API Design**: RESTful API with route-based organization
- **Middleware**: Custom logging, error handling, and authentication middleware

## Database Design
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Comprehensive schema with users, clinics, pets, appointments, medical records, and vaccinations
- **Migrations**: Drizzle-kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL adapter

## Authentication & Authorization
- **Strategy**: JWT tokens with HTTP-only cookie support
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Role-based Access**: User type differentiation (owner vs clinic) with route-level protection
- **Security**: Bcrypt password hashing, secure session configuration

## Data Models
- **Users**: Support for both pet owners and clinic staff with role differentiation
- **Pets**: Comprehensive pet profiles with medical information and ownership tracking
- **Appointments**: Booking system with status management and clinic assignment
- **Medical Records**: Health history tracking with veterinarian notes
- **Vaccinations**: Immunization record management with scheduling
- **Clinics**: Veterinary practice profiles with service offerings and contact information

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

## Authentication & Security
- **bcryptjs**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation
- **connect-pg-simple**: PostgreSQL session store for Express

## UI & Styling
- **Radix UI**: Headless UI component primitives for accessibility
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting utilities

## Development Tools
- **Vite**: Fast build tool with HMR and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **React Hook Form**: Form validation and state management
- **Zod**: Runtime type validation and schema definition

## Deployment & Hosting
- **Replit**: Development environment with integrated database provisioning
- **Vercel/Netlify Ready**: Static build output suitable for modern hosting platforms
- **Docker Ready**: Containerization support for production deployment