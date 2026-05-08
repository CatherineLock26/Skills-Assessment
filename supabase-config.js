// 1) Create a Supabase project
// 2) Run supabase/schema.sql in the Supabase SQL Editor
// 3) Deploy the Edge Function in supabase/functions/admin-users
// 4) Replace these values with your project values from Project Settings > API
const SUPABASE_URL = "https://kscpskquzjfsqeoctqll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_aLlqF0B9I9XVCZfv1yjCeg_HDfAAQVC";

// Supabase Auth requires email/password. This app lets users type usernames by
// converting usernames into internal emails such as username@skills-assessment.local.
const USERNAME_EMAIL_DOMAIN = "skills-assessment.local";

function usernameToEmail(username) {
  return `${String(username).trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}

// Accept either a real email address or an app username.
// This lets your first manually-created admin account log in with its Supabase Auth email,
// while bulk-created student users can still log in with usernames.
function loginIdentifierToEmail(identifier) {
  const value = String(identifier).trim().toLowerCase();
  return value.includes("@") ? value : usernameToEmail(value);
}
