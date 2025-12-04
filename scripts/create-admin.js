// MongoDB Initialization Script - CommonJS version
// Run this script to create the initial admin account

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function createAccount(email, password, role = 'user') {
  const { db, client } = await connectToDatabase();
  const accountsCollection = db.collection('accounts');
  
  // Check if user already exists
  const existingAccount = await accountsCollection.findOne({ email });
  if (existingAccount) {
    await client.close();
    throw new Error('Account with this email already exists');
  }
  
  const hashedPassword = await hashPassword(password);
  const account = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    role,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  await accountsCollection.insertOne(account);
  await client.close();
  return account;
}

async function createInitialAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const role = 'admin';
    
    console.log(`Creating admin account with email: ${email}`);
    
    const account = await createAccount(email, password, role);
    
    console.log('Admin account created successfully!');
    console.log('Account details:', {
      id: account.id,
      email: account.email,
      role: account.role,
      created_at: account.created_at,
    });
    
    console.log('\nYou can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nIMPORTANT: Change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin account:', error);
    process.exit(1);
  }
}

// Run the script
createInitialAdmin();