const globalRef = globalThis;
const fallback = {
  functions: { invoke: async () => ({ data: null, error: { message: 'Supabase mock not configured' } }) },
};
const supabase = globalRef && globalRef.__supabaseMock ? globalRef.__supabaseMock : fallback;
export { supabase };
export default supabase;
