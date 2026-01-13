import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fdkhknfxjkmxrqhgfpul.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka2hrbmZ4amtteHJxaGdmcHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDQwMzMsImV4cCI6MjA4Mzg4MDAzM30.OcbTWtnXNLDDLByW5ZE-dJdMwI9IcKXrOnQjpR47O1s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
