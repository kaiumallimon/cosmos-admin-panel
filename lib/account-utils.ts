// Utility functions for account management and duplicate prevention

import { getCollection } from './mongodb';
import { Account, Profile } from './user-types';

/**
 * Check if an email already exists in the accounts collection (case-insensitive)
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const accountsCollection = await getCollection<Account>('accounts');
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingAccount = await accountsCollection.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });
    
    return !!existingAccount;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw new Error('Failed to check email availability');
  }
}

/**
 * Check if a student ID already exists in the profiles collection
 */
export async function studentIdExists(studentId: string): Promise<boolean> {
  try {
    if (!studentId || studentId.trim() === '') {
      return false;
    }
    
    const profilesCollection = await getCollection<Profile>('profile');
    const existingProfile = await profilesCollection.findOne({
      student_id: studentId.trim()
    });
    
    return !!existingProfile;
  } catch (error) {
    console.error('Error checking student ID existence:', error);
    throw new Error('Failed to check student ID availability');
  }
}

/**
 * Normalize email address for consistent storage
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email provided');
  }
  
  return email.toLowerCase().trim();
}

/**
 * Validate and normalize user input data
 */
export function validateAndNormalizeUserData(userData: {
  email: string;
  full_name: string;
  student_id?: string;
  phone?: string;
  [key: string]: any;
}) {
  const errors: string[] = [];
  
  // Validate and normalize email
  if (!userData.email || typeof userData.email !== 'string') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = normalizeEmail(userData.email);
    if (!emailRegex.test(normalizedEmail)) {
      errors.push('Invalid email format');
    }
    userData.email = normalizedEmail;
  }
  
  // Validate full name
  if (!userData.full_name || typeof userData.full_name !== 'string' || userData.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  } else {
    userData.full_name = userData.full_name.trim();
  }
  
  // Normalize student ID if provided
  if (userData.student_id) {
    userData.student_id = userData.student_id.toString().trim();
    if (userData.student_id === '') {
      userData.student_id = undefined;
    }
  }
  
  // Normalize phone if provided
  if (userData.phone) {
    userData.phone = userData.phone.toString().trim();
    if (userData.phone === '') {
      userData.phone = undefined;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    normalizedData: userData
  };
}

/**
 * Create account with comprehensive duplicate checking
 */
export async function createAccountSafe(accountData: {
  email: string;
  password: string;
  role: 'admin' | 'user';
  full_name: string;
  student_id?: string;
  phone?: string;
  [key: string]: any;
}) {
  // Validate and normalize input data
  const validation = validateAndNormalizeUserData(accountData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  const normalizedData = validation.normalizedData;
  
  // Check for existing email
  const emailAlreadyExists = await emailExists(normalizedData.email);
  if (emailAlreadyExists) {
    throw new Error('An account with this email address already exists');
  }
  
  // Check for existing student ID if provided
  if (normalizedData.student_id) {
    const studentIdAlreadyExists = await studentIdExists(normalizedData.student_id);
    if (studentIdAlreadyExists) {
      throw new Error('An account with this student ID already exists');
    }
  }
  
  return normalizedData;
}

/**
 * Batch check for duplicate emails (useful for bulk operations)
 */
export async function checkDuplicateEmails(emails: string[]): Promise<{
  duplicates: string[];
  existing: string[];
}> {
  try {
    const accountsCollection = await getCollection<Account>('accounts');
    const normalizedEmails = emails.map(email => normalizeEmail(email));
    
    const existingAccounts = await accountsCollection.find({
      email: { 
        $in: normalizedEmails.map(email => new RegExp(`^${email}$`, 'i'))
      }
    }).toArray();
    
    const existingEmails = existingAccounts.map(account => account.email.toLowerCase());
    
    // Find duplicates within the input array
    const emailCounts = normalizedEmails.reduce((acc, email) => {
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicates = Object.keys(emailCounts).filter(email => emailCounts[email] > 1);
    
    return {
      duplicates,
      existing: existingEmails
    };
  } catch (error) {
    console.error('Error checking duplicate emails:', error);
    throw new Error('Failed to check for duplicate emails');
  }
}