-- SQL Schema to run in Supabase SQL Editor

-- Create student configuration table
CREATE TABLE IF NOT EXISTS student_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Student Profile IDs
  enrollment_id INT NOT NULL,
  third_party_id INT NOT NULL,
  headquarter_id INT DEFAULT 2, -- Default Unicentro (Laureles)
  language_id INT DEFAULT 70,   -- Default English
  
  -- Session Credentials
  cookie_xsrf_token TEXT NOT NULL,
  cookie_session TEXT NOT NULL,
  
  -- Preferences
  min_start_hour_minutes INT DEFAULT 540, -- 09:00 AM (9 * 60)
  max_start_hour_minutes INT DEFAULT 810, -- 01:30 PM (13.5 * 60)
  allowed_days INT[] DEFAULT ARRAY[2, 4], -- Tuesday (2) & Thursday (4) (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  level_group_name TEXT DEFAULT 'A2'
);

-- Create logs table for tracing sweeps and booking outcomes
CREATE TABLE IF NOT EXISTS booking_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL, -- 'SUCCESS', 'FAILED', 'INFO'
  message TEXT NOT NULL,
  schedule_id INT,
  details JSONB
);

-- Insert initial configuration using your active session data
INSERT INTO student_config (
  enrollment_id, 
  third_party_id, 
  cookie_xsrf_token, 
  cookie_session
) VALUES (
  21960,
  25083,
  'eyJpdiI6Ik9OSi9XWTdZSitBU0ZvR0IzSnZkYUE9PSIsInZhbHVlIjoiZGdQMjBZU0UyMWhkRzhuYjkzZ3ZiaDIzQnZaVVNHVHNYbW9ya3RPSjVsZ3BjY0gxMnkxbjkvUnNaNU5OVXRTVWZwL0NCWU82ejdVYUo5RmFLOVRmaUhZd3RuVGFDN21yVmlGSXJDeityY3cxYnZkZVl1UkZkQkNaMXNpN1dQaWQiLCJtYWMiOiI1NDY2ZDU5M2MyNzJiNGY5NGEwMTMwOWJiY2MzODkzMWU4Y2I1ZWQ2MWE2OGY5YzIwZjkxZTdlMTUzOTVjZmRhIiwidGFnIjoiIn0%3D',
  'eyJpdiI6Im9iUkVEVkZCOFF5T0J1bGxuTjh3SVE9PSIsInZhbHVlIjoicmNZdmNTU1JKZVhsS1plL1J3aXErUFltaFJIYU1XRWkyOENRblU4T0VtdG9lMnpoS1FtdTVXWStyVHh5ZkpyZFBJeVZwWUtlc1h0M1QrUG5tbGJwcFZ6V0xadWRiNnR3cFc5VjYwWkNrTjZrNG9SQnhmOS9FQTZvS0RVN3pkU2IiLCJtYWMiOiJlODczYWQxMWE1MzIxMDRlMjEyZDE2ZjU2NmI4OTE3Y2QwNWExYTNiNWI5YTJiYmNlOGY0NTEyNTE4NTM4NzNmIiwidGFnIjoiIn0%3D'
) ON CONFLICT DO NOTHING;
