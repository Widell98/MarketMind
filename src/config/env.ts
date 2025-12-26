/**
 * Environment configuration with validation
 * Ensures all required environment variables are present at runtime
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * Validates and returns Supabase URL
 */
function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  
  if (!url) {
    if (isDev) {
      // Fallback for development - you should set this in .env file
      console.warn('VITE_SUPABASE_URL is not set. Using fallback value.');
      return 'https://qifolopsdeeyrevbuxfl.supabase.co';
    }
    throw new Error(
      'VITE_SUPABASE_URL is required but not set. Please set it in your .env file.'
    );
  }
  
  return url;
}

/**
 * Validates and returns Supabase Anon Key
 */
function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!key) {
    if (isDev) {
      // Fallback for development - you should set this in .env file
      console.warn('VITE_SUPABASE_ANON_KEY is not set. Using fallback value.');
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZm9sb3BzZGVleXJldmJ1eGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzY3MjMsImV4cCI6MjA2MzUxMjcyM30.x89y179_8EDl1NwTryhXfUDMzdxrnfomZfRmhmySMhM';
    }
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is required but not set. Please set it in your .env file.'
    );
  }
  
  return key;
}

/**
 * Environment configuration object
 * All environment variables should be accessed through this object
 */
export const env = {
  supabase: {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
  },
  isDev,
  isProd,
} as const;

/**
 * Validates that all required environment variables are set
 * Call this at application startup to fail fast if configuration is missing
 */
export function validateEnv(): void {
  try {
    getSupabaseUrl();
    getSupabaseAnonKey();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Environment validation failed:', error.message);
      if (isProd) {
        throw error;
      }
    }
  }
}

// Validate environment variables at module load time in production
if (isProd) {
  validateEnv();
}

