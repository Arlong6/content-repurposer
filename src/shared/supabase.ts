import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://icdurmuyqiivmrdeqkmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljZHVybXV5cWlpdm1yZGVxa21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTQ4ODYsImV4cCI6MjA5MTA3MDg4Nn0.Fmwf-vuHzsy093vtXIJxUfhXHeBwFrqZJPKONkVumsM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
