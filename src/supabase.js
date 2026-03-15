import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = "https://bgsqouczemoqazhcyzga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnc3FvdWN6ZW1vcWF6aGN5emdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTE2MDEsImV4cCI6MjA4ODk2NzYwMX0.Hr8TO6FL_-UVaTx0_zGKUUo97M1ahgyTFiZBa9Q1Nus";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
