# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb://localhost:27017
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cosmos-admin?retryWrites=true&w=majority

# Database name (optional, defaults to "cosmos-admin")
MONGODB_DB=cosmos-admin

# JWT Secret (REQUIRED for authentication)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# OpenAI API Key (optional, required for question uploads with embeddings)
OPENAI_API_KEY=your-openai-api-key-here

# Pinecone API Key (optional, required for vector search functionality)
PINECONE_API_KEY=your-pinecone-api-key-here
```

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `MONGODB_URI=mongodb://localhost:27017`

### Option 2: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a cluster
3. Get connection string from "Connect" > "Connect your application"
4. Replace `<username>`, `<password>`, and `<cluster>` in the URI

## Authentication Setup

### JWT Secret
Generate a secure random string for JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Optional Services

### OpenAI (for embeddings)
1. Get API key from https://platform.openai.com/api-keys
2. Add to `OPENAI_API_KEY`

### Pinecone (for vector search)
1. Get API key from https://www.pinecone.io/
2. Create index named "cosmos-previous-questions"
3. Add to `PINECONE_API_KEY`

## Verification

After setting up `.env.local`, restart the development server:
```bash
npm run dev
```

Check the console for environment validation messages.