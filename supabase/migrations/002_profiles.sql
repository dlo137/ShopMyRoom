-- Profiles table
CREATE TABLE profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email                text,

  -- Subscription
  subscription_plan    text,
  subscription_id      text,
  is_pro_version       boolean DEFAULT false,
  is_trial_version     boolean DEFAULT false,
  entitlement          text,
  trial_end_date       timestamptz,
  purchase_time        timestamptz,

  -- Credits
  credits_current      int DEFAULT 0,
  credits_max          int DEFAULT 0,
  last_credit_reset    timestamptz,

  -- Paywall
  has_seen_paywall     boolean DEFAULT false,

  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
