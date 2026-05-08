# Digital Skills Assessment – Supabase Version

This version replaces `localStorage` with Supabase Auth, Postgres tables, Row Level Security, and an admin Edge Function.

## What changed

- Users and admins log in with Supabase Auth.
- Users still type a username, but the app converts it into an internal Supabase email:
  - `username@skills-assessment.local`
- Admins can:
  - bulk upload users with username, group/course, and temporary password
  - force password reset
  - add/edit/delete questions
  - view overall, group/course, and single-user stats
  - view all results
- Users can:
  - log in
  - reset password on first login
  - complete the assessment
  - receive recommendations
  - download/print a PDF-style report with questions, selected answers, scores, and recommendations

## Setup steps

### 1. Create a Supabase project

Create a project at Supabase and copy your:

- Project URL
- anon/public key

Paste them into `supabase-config.js`:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

### 2. Run the database schema

Open Supabase Dashboard > SQL Editor.

Run:

```sql
supabase/schema.sql
```

This creates:

- `profiles`
- `questions`
- `answers`
- `assessment_attempts`
- `assessment_answers`
- Row Level Security policies
- starter questions

### 3. Create your first admin account

In Supabase Dashboard > Authentication > Users, create a user manually.

Use this email format:

```text
admin@skills-assessment.local
```

Set a password.

Then copy the user UUID and run this in SQL Editor:

```sql
insert into public.profiles (
  id,
  username,
  display_name,
  group_course,
  role,
  status,
  must_reset_password
)
values (
  'PASTE_AUTH_USER_UUID_HERE',
  'admin',
  'Administrator',
  'Admin',
  'admin',
  'active',
  false
);
```

You can now log into `admin.html` with:

```text
username: admin
password: the password you set in Supabase Auth
```

### 4. Deploy the admin Edge Function

This is needed because the browser must never contain your Supabase service role key.

Install the Supabase CLI, log in, link your project, then run:

```bash
supabase functions deploy admin-users
```

The function is in:

```text
supabase/functions/admin-users/index.ts
```

The function lets admins create users, bulk upload users, set temporary passwords, and delete users securely.

### 5. Host the site

You can host the static files on Netlify, Vercel, GitHub Pages, or Supabase Storage.

Upload these frontend files:

```text
index.html
admin.html
style.css
script.js
admin.js
questions.js
supabase-config.js
supabase-client.js
```

Do not upload or expose your service role key anywhere in the frontend.

## Bulk upload format

Admin dashboard > Manage Users:

```text
Name, Username, Group/Course, TemporaryPassword
Jane Smith, jane.smith, Level 2 ICT, TempPass123
Ahmed Khan, ahmed.khan, Cyber Security, ChangeMe123
```

Each uploaded user will be forced to reset their password when they first log in.

## Important security note

This is now a real Supabase-backed system, but you still need to configure your deployed domain correctly in Supabase Auth settings.

In Supabase Dashboard > Authentication > URL Configuration, add your site URL and any local development URL you use.


## Important login note

This version accepts either:

- a real Supabase Auth email address, for example your manually-created admin email, or
- an app username, for example `jane.smith`

For username logins, the app converts the username into an internal email such as:

```text
jane.smith@skills-assessment.local
```

For your first admin account, create the user in Supabase Authentication using your real email address, then run:

```text
supabase/create-admin-profile.sql
```

Remember to replace `YOUR_ADMIN_EMAIL` first.

If login says that authentication worked but no matching profile row exists, it means the user exists in Authentication but not in `public.profiles`.
