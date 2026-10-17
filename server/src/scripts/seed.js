const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Business = require('../models/Business');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).catch(async (err) => {
      console.warn(`[Seed] Direct connect failed (${err.message}). Starting in-memory instance for demo...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const memServer = await MongoMemoryServer.create();
      await mongoose.connect(memServer.getUri());
      console.log(`[Seed] In-memory DB active at ${memServer.getUri()}`);
    });

    console.log('[Seed] Clearing existing Users and Businesses...');
    await User.deleteMany({});
    await Business.deleteMany({});

    // 1. Create Business Owner 1
    const ownerUser = new User({
      name: 'Dr. Robert Vance',
      email: 'owner@queueflow.dev',
      passwordHash: 'Password123!',
      phone: '+1 (555) 234-5678',
      role: 'owner'
    });
    await ownerUser.save();

    // 2. Create Business 1: Apex Health Clinic
    const apexClinic = new Business({
      ownerId: ownerUser._id,
      name: 'Apex Health Clinic',
      category: 'Healthcare',
      description: 'Primary care walk-in clinic and preventive healthcare with smart live queue tracking.',
      phone: '+1 (555) 234-5678',
      address: '350 5th Ave, New York, NY 10118',
      location: {
        type: 'Point',
        coordinates: [-73.985130, 40.748817] // Empire State Building area
      },
      timezone: 'America/New_York',
      settings: {
        maxQueueSize: 50,
        avgServiceTimeDefault: 8,
        approachingThreshold: 3,
        noShowGraceMinutes: 5,
        allowRemoteJoin: true
      },
      counters: [
        { name: 'Triage Counter A', isActive: true },
        { name: 'Consultation Desk 1', isActive: true },
        { name: 'Lab Sampling Station', isActive: true }
      ]
    });
    await apexClinic.save();

    ownerUser.businessId = apexClinic._id;
    await ownerUser.save();

    // 2b. Create Apex Clinic Co-Owner for 1-click UI demo
    const apexOwner = new User({
      name: 'Dr. Robert Vance',
      email: 'apex@queueflow.dev',
      passwordHash: 'Password123!',
      phone: '+1 (555) 234-5679',
      role: 'owner',
      businessId: apexClinic._id
    });
    await apexOwner.save();

    // 3. Create Staff Member for Apex Clinic
    const staffUser = new User({
      name: 'Nurse Sarah Connor',
      email: 'staff@queueflow.dev',
      passwordHash: 'Password123!',
      phone: '+1 (555) 345-6789',
      role: 'staff',
      businessId: apexClinic._id
    });
    await staffUser.save();

    // Assign Sarah to Triage Counter A
    apexClinic.counters[0].staffId = staffUser._id;
    await apexClinic.save();

    // 4. Create Business Owner 2 & Cafe
    const cafeOwner = new User({
      name: 'Marco Rossi',
      email: 'cafe@queueflow.dev',
      passwordHash: 'Password123!',
      phone: '+1 (555) 876-5432',
      role: 'owner'
    });
    await cafeOwner.save();

    const urbanOwner = new User({
      name: 'Marco Rossi',
      email: 'urban@queueflow.dev',
      passwordHash: 'Password123!',
      phone: '+1 (555) 876-5433',
      role: 'owner'
    });
    await urbanOwner.save();

    const urbanCafe = new Business({
      ownerId: cafeOwner._id,
      name: 'Urban Grind Artisanal Coffee',
      category: 'Food & Beverage',
      description: 'Single-origin espresso bar & organic bakery. Skip the sidewalk line.',
      phone: '+1 (555) 876-5432',
      address: '72 Spring St, New York, NY 10012',
      location: {
        type: 'Point',
        coordinates: [-73.997230, 40.722340] // SoHo area
      },
      timezone: 'America/New_York',
      settings: {
        maxQueueSize: 30,
        avgServiceTimeDefault: 3,
        approachingThreshold: 2,
        noShowGraceMinutes: 3,
        allowRemoteJoin: true
      },
      counters: [
        { name: 'Espresso Bar 1', isActive: true },
        { name: 'Pastry & Mobile Pickup', isActive: true }
      ]
    });
    await urbanCafe.save();

    cafeOwner.businessId = urbanCafe._id;
    await cafeOwner.save();

    // 5. Create Customers
    const customerUser = new User({
      name: 'Alex Turner',
      email: 'customer@queueflow.dev',
      passwordHash: 'Password123!',
      phone: '+1 (555) 999-1122',
      role: 'customer',
      notificationPrefs: {
        approachingThreshold: 3,
        positionAlerts: true
      }
    });
    await customerUser.save();

    const customerUser2 = new User({
      name: 'Jane Doe',
      email: 'jane@queueflow.dev',
      passwordHash: 'Password123!',
      phone: '+1 (555) 999-3344',
      role: 'customer',
      notificationPrefs: {
        approachingThreshold: 2,
        positionAlerts: true
      }
    });
    await customerUser2.save();

    console.log('\n=============================================');
    console.log('  QueueFlow Seed Completed Successfully!    ');
    console.log('=============================================');
    console.log('Demo Credentials (Password: Password123!):');
    console.log('1. Owner (Healthcare) : owner@queueflow.dev');
    console.log('2. Staff (Healthcare) : staff@queueflow.dev');
    console.log('3. Owner (Cafe)       : cafe@queueflow.dev');
    console.log('4. Customer (Alex)    : customer@queueflow.dev');
    console.log('5. Customer (Jane)    : jane@queueflow.dev');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error running seed script:', error);
    process.exit(1);
  }
};

seedData();
