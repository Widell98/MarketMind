import { describe, it, expect } from 'vitest';

describe('env config', () => {
  it('should export env object with supabase configuration', () => {
    // Dynamic import to ensure we get the actual module
    const { env, validateEnv } = require('../env');
    
    // Verify structure
    expect(env).toBeDefined();
    expect(env.supabase).toBeDefined();
    expect(env.supabase.url).toBeDefined();
    expect(env.supabase.anonKey).toBeDefined();
    expect(typeof env.isDev).toBe('boolean');
    expect(typeof env.isProd).toBe('boolean');
    
    // Verify validateEnv function exists
    expect(typeof validateEnv).toBe('function');
  });

  it('should have non-empty supabase URL and key', () => {
    const { env } = require('../env');
    
    expect(env.supabase.url).toBeTruthy();
    expect(typeof env.supabase.url).toBe('string');
    expect(env.supabase.url.length).toBeGreaterThan(0);
    
    expect(env.supabase.anonKey).toBeTruthy();
    expect(typeof env.supabase.anonKey).toBe('string');
    expect(env.supabase.anonKey.length).toBeGreaterThan(0);
  });

  it('should export validateEnv function', () => {
    const { validateEnv } = require('../env');
    expect(typeof validateEnv).toBe('function');
    
    // Should not throw when called (assuming env vars are set)
    expect(() => validateEnv()).not.toThrow();
  });
});
