/**
 * Utility functions for agent creation forms
 */

export const formatJsonForDisplay = (value: any): string => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
};

export const parseJsonValue = (value: string): any => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const validateJsonString = (value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: true }; // Empty is considered valid
  }
  
  try {
    JSON.parse(value);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
};

export const generateAgentName = (displayName: string): string => {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

export const validateAgentName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Agent name is required' };
  }
  
  if (!/^[a-z0-9_]+$/.test(name)) {
    return { 
      isValid: false, 
      error: 'Agent name must contain only lowercase letters, numbers, and underscores' 
    };
  }
  
  if (name.length < 3) {
    return { isValid: false, error: 'Agent name must be at least 3 characters long' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Agent name must not exceed 50 characters' };
  }
  
  return { isValid: true };
};