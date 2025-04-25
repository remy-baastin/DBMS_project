// Supabase client initialization
const SUPABASE_URL = 'https://hpzhjyyfmzkacculsaca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bG1sbm9qa2dubWxlaWNzZnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NjIxNzQsImV4cCI6MjA2MTAzODE3NH0.CBJMl_65sgk5kcTjET7fKjJ6gG8nL3gQdDSuHfLbMhc'; // Replace with your actual anon key

// Initialize the Supabase client correctly
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make sure it's available globally
window.supabase = supabase;