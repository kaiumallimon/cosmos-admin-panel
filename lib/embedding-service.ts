// OpenAI Embedding Service
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface QuestionData {
  question: string;
  has_description: boolean;
  description_content?: string | null;
}

export async function generateEmbedding(questionData: QuestionData): Promise<number[]> {
  // Only embed the semantic fields: question + description_content
  const textParts: string[] = [questionData.question];

  if (questionData.has_description && questionData.description_content) {
    textParts.push(questionData.description_content);
  }

  const textToEmbed = textParts.filter(Boolean).join(' | ');

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: textToEmbed,
    encoding_format: 'float'
  });

  return response.data[0].embedding;
}