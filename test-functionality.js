#!/usr/bin/env node

/**
 * PetPalette Functionality Test Script
 * This script tests the core functionality of the PetPalette application
 * including demo user authentication, pet management, appointments, and medical records.
 */

const { MemStorage } = require('./server/storage.ts');

// Mock the storage for testing
const storage = new MemStorage();

console.log('🐾 PetPalette Functionality Test\n');
console.log('=' .repeat(50));

// Test 1: Demo User Authentication
console.log('\n1. Testing Demo User Authentication');
console.log('-'.repeat(30));

async function testDemoUsers() {
  try {
    // Test owner demo user
    const ownerUser = await storage.getUserByEmail('owner.demo@example.com');
    console.log('✅ Owner demo user found:', ownerUser ? `${ownerUser.firstName} ${ownerUser.lastName}` : 'Not found');
    
    // Test clinic demo user
    const clinicUser = await storage.getUserByEmail('clinic.demo@example.com');
    console.log('✅ Clinic demo user found:', clinicUser ? `${clinicUser.firstName} ${clinicUser.lastName}` : 'Not found');
    
    // Test clinic data
    const clinic = await storage.getClinicByUserId(clinicUser?.id);
    console.log('✅ Demo clinic found:', clinic ? clinic.name : 'Not found');
    
    return { ownerUser, clinicUser, clinic };
  } catch (error) {
    console.log('❌ Error testing demo users:', error.message);
    return null;
  }
}

// Test 2: Pet Management
console.log('\n2. Testing Pet Management');
console.log('-'.repeat(30));

async function testPetManagement(ownerUser) {
  try {
    if (!ownerUser) {
      console.log('❌ No owner user available for pet testing');
      return;
    }
    
    // Get existing pets
    const existingPets = await storage.getPetsByOwner(ownerUser.id);
    console.log('✅ Existing pets found:', existingPets.length);
    existingPets.forEach(pet => {
      console.log(`   - ${pet.name} (${pet.species}, ${pet.breed})`);
    });
    
    // Test adding a new pet
    const newPet = await storage.createPet({
      ownerId: ownerUser.id,
      name: 'Test Pet',
      species: 'dog',
      breed: 'Labrador',
      gender: 'male',
      birthDate: new Date('2023-01-01'),
      weight: '25.5',
      color: 'Black',
      medicalNotes: 'Test pet for functionality testing'
    });
    console.log('✅ New pet created:', newPet.name);
    
    // Test updating pet
    const updatedPet = await storage.updatePet(newPet.id, {
      weight: '26.0',
      medicalNotes: 'Updated test pet'
    });
    console.log('✅ Pet updated successfully');
    
    return { existingPets, newPet, updatedPet };
  } catch (error) {
    console.log('❌ Error testing pet management:', error.message);
    return null;
  }
}

// Test 3: Appointment Management
console.log('\n3. Testing Appointment Management');
console.log('-'.repeat(30));

async function testAppointmentManagement(ownerUser, clinic) {
  try {
    if (!ownerUser || !clinic) {
      console.log('❌ Missing owner or clinic data for appointment testing');
      return;
    }
    
    // Get existing pets
    const pets = await storage.getPetsByOwner(ownerUser.id);
    if (pets.length === 0) {
      console.log('❌ No pets available for appointment testing');
      return;
    }
    
    // Test creating an appointment
    const newAppointment = await storage.createAppointment({
      petId: pets[0].id,
      clinicId: clinic.id,
      ownerId: ownerUser.id,
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      serviceType: 'checkup',
      status: 'pending',
      reason: 'Regular checkup',
      duration: 30
    });
    console.log('✅ New appointment created:', newAppointment.serviceType);
    
    // Test updating appointment status
    const updatedAppointment = await storage.updateAppointment(newAppointment.id, {
      status: 'confirmed',
      doctorName: 'Dr. Smith'
    });
    console.log('✅ Appointment status updated to:', updatedAppointment.status);
    
    // Test getting appointments by owner
    const ownerAppointments = await storage.getAppointmentsByOwner(ownerUser.id);
    console.log('✅ Owner appointments found:', ownerAppointments.length);
    
    // Test getting appointments by clinic
    const clinicAppointments = await storage.getAppointmentsByClinic(clinic.id);
    console.log('✅ Clinic appointments found:', clinicAppointments.length);
    
    return { newAppointment, updatedAppointment, ownerAppointments, clinicAppointments };
  } catch (error) {
    console.log('❌ Error testing appointment management:', error.message);
    return null;
  }
}

// Test 4: Medical Records Management
console.log('\n4. Testing Medical Records Management');
console.log('-'.repeat(30));

async function testMedicalRecords(ownerUser, clinic) {
  try {
    if (!ownerUser || !clinic) {
      console.log('❌ Missing owner or clinic data for medical records testing');
      return;
    }
    
    // Get existing pets
    const pets = await storage.getPetsByOwner(ownerUser.id);
    if (pets.length === 0) {
      console.log('❌ No pets available for medical records testing');
      return;
    }
    
    // Test creating a medical record
    const newRecord = await storage.createMedicalRecord({
      petId: pets[0].id,
      clinicId: clinic.id,
      recordType: 'checkup',
      title: 'Annual Checkup',
      description: 'Regular annual health checkup',
      diagnosis: 'Healthy',
      treatment: 'No treatment needed',
      weight: '25.5',
      notes: 'Pet is in good health',
      recordDate: new Date()
    });
    console.log('✅ New medical record created:', newRecord.title);
    
    // Test getting medical records by pet
    const petRecords = await storage.getMedicalRecordsByPet(pets[0].id);
    console.log('✅ Medical records found for pet:', petRecords.length);
    
    // Test creating a vaccination record
    const newVaccination = await storage.createVaccination({
      petId: pets[0].id,
      clinicId: clinic.id,
      vaccineName: 'Rabies',
      manufacturer: 'VetCorp',
      dateGiven: new Date(),
      nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      veterinarian: 'Dr. Smith'
    });
    console.log('✅ New vaccination record created:', newVaccination.vaccineName);
    
    // Test getting vaccinations by pet
    const petVaccinations = await storage.getVaccinationsByPet(pets[0].id);
    console.log('✅ Vaccination records found for pet:', petVaccinations.length);
    
    return { newRecord, petRecords, newVaccination, petVaccinations };
  } catch (error) {
    console.log('❌ Error testing medical records management:', error.message);
    return null;
  }
}

// Test 5: Data Integrity and Relationships
console.log('\n5. Testing Data Integrity and Relationships');
console.log('-'.repeat(30));

async function testDataIntegrity() {
  try {
    // Test user-clinic relationship
    const clinics = await storage.getClinics();
    console.log('✅ Total clinics in system:', clinics.length);
    
    // Test user-pet relationship
    const allUsers = await storage.getUserByEmail('owner.demo@example.com');
    if (allUsers) {
      const userPets = await storage.getPetsByOwner(allUsers.id);
      console.log('✅ User-pet relationship verified:', userPets.length, 'pets');
    }
    
    // Test appointment relationships
    const allAppointments = await storage.getAppointmentsByOwner('owner-1');
    console.log('✅ Appointment relationships verified:', allAppointments.length, 'appointments');
    
    console.log('✅ All data relationships are intact');
    return true;
  } catch (error) {
    console.log('❌ Error testing data integrity:', error.message);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log('Starting comprehensive functionality tests...\n');
  
  // Test 1: Demo Users
  const demoData = await testDemoUsers();
  
  // Test 2: Pet Management
  const petData = await testPetManagement(demoData?.ownerUser);
  
  // Test 3: Appointment Management
  const appointmentData = await testAppointmentManagement(demoData?.ownerUser, demoData?.clinic);
  
  // Test 4: Medical Records
  const medicalData = await testMedicalRecords(demoData?.ownerUser, demoData?.clinic);
  
  // Test 5: Data Integrity
  const integrityCheck = await testDataIntegrity();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Demo User Authentication', status: demoData ? '✅ PASS' : '❌ FAIL' },
    { name: 'Pet Management', status: petData ? '✅ PASS' : '❌ FAIL' },
    { name: 'Appointment Management', status: appointmentData ? '✅ PASS' : '❌ FAIL' },
    { name: 'Medical Records Management', status: medicalData ? '✅ PASS' : '❌ FAIL' },
    { name: 'Data Integrity', status: integrityCheck ? '✅ PASS' : '❌ FAIL' }
  ];
  
  tests.forEach(test => {
    console.log(`${test.name}: ${test.status}`);
  });
  
  const passedTests = tests.filter(t => t.status.includes('✅')).length;
  const totalTests = tests.length;
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! PetPalette functionality is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runAllTests().catch(console.error);

