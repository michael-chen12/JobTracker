/**
 * Document text extraction utilities for resume parsing
 */

import mammoth from 'mammoth';

/**
 * Extracted text result
 */
export interface ExtractedText {
  text: string;
  pageCount?: number;
}

/**
 * Custom error for document parsing failures
 */
export class DocumentParseError extends Error {
  constructor(
    message: string,
    public mimeType: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DocumentParseError';
  }
}

/**
 * Extract text from PDF buffer
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractedText> {
  try {
    // Use dynamic require for CommonJS module in Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    throw new DocumentParseError(
      'Failed to extract text from PDF',
      'application/pdf',
      error
    );
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function extractDocxText(
  buffer: Buffer
): Promise<ExtractedText> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
    };
  } catch (error) {
    throw new DocumentParseError(
      'Failed to extract text from DOCX',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      error
    );
  }
}

/**
 * Redact PII (emails and phone numbers) from text for logging
 */
export function redactPII(text: string): string {
  let redacted = text;

  // Redact email addresses
  redacted = redacted.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );

  // Redact phone numbers (various formats)
  // Matches: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890, etc.
  redacted = redacted.replace(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    '[PHONE_REDACTED]'
  );

  return redacted;
}

/**
 * Extract text from document buffer based on MIME type
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedText> {
  switch (mimeType) {
    case 'application/pdf':
      return extractPdfText(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocxText(buffer);
    default:
      throw new DocumentParseError(
        `Unsupported MIME type: ${mimeType}`,
        mimeType
      );
  }
}
