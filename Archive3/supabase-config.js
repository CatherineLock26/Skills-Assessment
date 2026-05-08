// 1) Create a Supabase project
// 2) Run supabase/schema.sql in the Supabase SQL Editor
// 3) Deploy the Edge Function in supabase/functions/admin-users
// 4) Replace these values with your project values from Project Settings > API
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Supabase Auth requires email/password. This app lets users type usernames by
// converting usernames into internal emails such as username@skills-assessment.local.
const USERNAME_EMAIL_DOMAIN = "skills-assessment.local";

function usernameToEmail(username) {
  return `${String(username).trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}
