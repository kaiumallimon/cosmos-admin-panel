// Environment validation utility
export function validateEnvironment() {
  const requiredEnvVars = {
    MONGODB_URI: 'MongoDB connection string',
    JWT_SECRET: 'JWT secret key for authentication',
  };

  const optionalEnvVars = {
    OPENAI_API_KEY: 'OpenAI API key for embeddings (required for question uploads)',
    PINECONE_API_KEY: 'Pinecone API key for vector search (required for question uploads)',
    MONGODB_DB: 'MongoDB database name (defaults to "cosmos-admin")',
  };

  const missing = [];
  const warnings = [];

  // Check required environment variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      missing.push(`${key}: ${description}`);
    }
  }

  // Check optional environment variables
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      warnings.push(`${key}: ${description}`);
    }
  }

  return { missing, warnings };
}

export function logEnvironmentStatus() {
  const { missing, warnings } = validateEnvironment();

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(item => console.error(`  - ${item}`));
    console.error('Please create a .env.local file with these variables.');
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Missing optional environment variables:');
    warnings.forEach(item => console.warn(`  - ${item}`));
  }

  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables configured');
  }

  return missing.length === 0;
}