// Metadata Helper for cleaning data before storing in Pinecone

export interface QuestionMetadata {
  [key: string]: any;
}

export function cleanMetadataForPinecone(questionData: any): QuestionMetadata {
  const metadata: QuestionMetadata = {};
  
  // Convert all values to Pinecone-compatible types (strings, numbers, booleans)
  for (const [key, value] of Object.entries(questionData)) {
    if (value === null || value === undefined) {
      // Skip null/undefined values
      continue;
    }
    
    if (key === '_id') {
      // Skip MongoDB ObjectId
      continue;
    }
    
    if (typeof value === 'object' && !(value instanceof Date)) {
      // Convert objects to JSON strings (except dates)
      metadata[key] = JSON.stringify(value);
    } else if (value instanceof Date) {
      // Convert dates to ISO strings
      metadata[key] = value.toISOString();
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Keep primitive types as-is
      metadata[key] = value;
    } else {
      // Convert other types to strings
      metadata[key] = String(value);
    }
  }
  
  // Ensure we have key fields as strings for filtering
  if (metadata.id !== undefined) {
    metadata.id_text = String(metadata.id);
  }
  
  if (metadata.course_code !== undefined) {
    metadata.course_code_text = String(metadata.course_code);
  }
  
  if (metadata.exam_type !== undefined) {
    metadata.exam_type_text = String(metadata.exam_type);
  }
  
  if (metadata.semester_term !== undefined) {
    metadata.semester_term_text = String(metadata.semester_term);
  }
  
  return metadata;
}