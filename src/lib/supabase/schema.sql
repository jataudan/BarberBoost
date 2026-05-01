-- ============================================================
-- BarberBoost — Complete Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'empire');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'inactive');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'bank_transfer');

-- ============================================================
-- SHOPS
-- One row per barbershop owner. Created automatically via trigger
-- when a new user signs up.
-- ============================================================
CREATE TABLE shops (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id              UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                  TEXT          NOT NULL,
  slug                  TEXT          UNIQUE NOT NULL,
  description           TEXT,
  phone                 TEXT,
  email                 TEXT,
  address               TEXT,
  city                  TEXT,
  postcode              TEXT,
  logo_url              TEXT,
  cover_url             TEXT,
  website               TEXT,
  instagram             TEXT,
  facebook              TEXT,
  opening_hours         JSONB         DEFAULT '{}',
  booking_notice_hours  INTEGER       DEFAULT 2,
  cancellation_hours    INTEGER       DEFAULT 24,
  no_show_fee           DECIMAL(10,2) DEFAULT 0,
  currency              TEXT          DEFAULT 'GBP',
  timezone              TEXT          DEFAULT 'Europe/London',
  created_at            TIMESTAMPTZ   DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- Stripe billing state per shop.
-- ============================================================
CREATE TABLE subscriptions (
  id                      UUID                DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id                 UUID                REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  owner_id                UUID                REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id      TEXT                UNIQUE,
  stripe_subscription_id  TEXT                UNIQUE,
  stripe_price_id         TEXT,
  plan                    subscription_plan   DEFAULT 'free',
  status                  subscription_status DEFAULT 'inactive',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN             DEFAULT FALSE,
  trial_end               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ         DEFAULT NOW(),
  updated_at              TIMESTAMPTZ         DEFAULT NOW()
);

-- ============================================================
-- STAFF
-- Barbers / employees attached to a shop.
-- ============================================================
CREATE TABLE staff (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id          UUID          REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name             TEXT          NOT NULL,
  email            TEXT,
  phone            TEXT,
  role             TEXT          DEFAULT 'barber',
  avatar_url       TEXT,
  bio              TEXT,
  colour           TEXT          DEFAULT '#6366f1',
  is_active        BOOLEAN       DEFAULT TRUE,
  commission_rate  DECIMAL(5,2)  DEFAULT 0,
  working_hours    JSONB         DEFAULT '{}',
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- SERVICES
-- Menu of treatments offered by the shop.
-- ============================================================
CREATE TABLE services (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id           UUID          REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name              TEXT          NOT NULL,
  description       TEXT,
  duration_minutes  INTEGER       NOT NULL DEFAULT 30,
  price             DECIMAL(10,2) NOT NULL,
  category          TEXT          DEFAULT 'Haircut',
  is_active         BOOLEAN       DEFAULT TRUE,
  colour            TEXT          DEFAULT '#6366f1',
  image_url         TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- CLIENTS
-- Customer records for a shop.
-- ============================================================
CREATE TABLE clients (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id               UUID          REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name                  TEXT          NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  date_of_birth         DATE,
  notes                 TEXT,
  preferred_barber_id   UUID          REFERENCES staff(id),
  tags                  TEXT[]        DEFAULT '{}',
  marketing_consent     BOOLEAN       DEFAULT FALSE,
  total_visits          INTEGER       DEFAULT 0,
  total_spent           DECIMAL(10,2) DEFAULT 0,
  last_visit            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- Core appointment record.
-- ============================================================
CREATE TABLE bookings (
  id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id         UUID            REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  client_id       UUID            REFERENCES clients(id) ON DELETE SET NULL,
  staff_id        UUID            REFERENCES staff(id) ON DELETE SET NULL NOT NULL,
  service_id      UUID            REFERENCES services(id) ON DELETE SET NULL NOT NULL,
  client_name     TEXT            NOT NULL,
  client_email    TEXT,
  client_phone    TEXT,
  date            DATE            NOT NULL,
  start_time      TIME            NOT NULL,
  end_time        TIME            NOT NULL,
  status          booking_status  DEFAULT 'pending',
  price           DECIMAL(10,2)   NOT NULL,
  deposit_amount  DECIMAL(10,2)   DEFAULT 0,
  payment_method  payment_method  DEFAULT 'cash',
  is_paid         BOOLEAN         DEFAULT FALSE,
  notes           TEXT,
  internal_notes  TEXT,
  reminder_sent   BOOLEAN         DEFAULT FALSE,
  source          TEXT            DEFAULT 'manual',
  created_at      TIMESTAMPTZ     DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- INVENTORY  (Pro + Empire plans)
-- Stock tracking for products and supplies.
-- ============================================================
CREATE TABLE inventory (
  id                   UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id              UUID          REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name                 TEXT          NOT NULL,
  category             TEXT,
  sku                  TEXT,
  quantity             INTEGER       DEFAULT 0,
  low_stock_threshold  INTEGER       DEFAULT 5,
  cost_price           DECIMAL(10,2),
  retail_price         DECIMAL(10,2),
  supplier             TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS  (Pro + Empire plans)
-- Email / SMS marketing campaigns.
-- ============================================================
CREATE TABLE campaigns (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id          UUID          REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name             TEXT          NOT NULL,
  type             TEXT          DEFAULT 'email',
  subject          TEXT,
  content          TEXT,
  target_segment   TEXT          DEFAULT 'all',
  status           TEXT          DEFAULT 'draft',
  sent_count       INTEGER       DEFAULT 0,
  open_rate        DECIMAL(5,2),
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- Client ratings linked to bookings.
-- ============================================================
CREATE TABLE reviews (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id      UUID        REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  booking_id   UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  client_id    UUID        REFERENCES clients(id) ON DELETE SET NULL,
  client_name  TEXT        NOT NULL,
  rating       INTEGER     CHECK (rating >= 1 AND rating <= 5),
  comment      TEXT,
  is_public    BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- In-app alerts for the shop owner.
-- ============================================================
CREATE TABLE notifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id    UUID        REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        DEFAULT 'info',
  is_read    BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_shops_owner_id         ON shops(owner_id);
CREATE INDEX idx_shops_slug             ON shops(slug);
CREATE INDEX idx_subscriptions_shop_id  ON subscriptions(shop_id);
CREATE INDEX idx_subscriptions_owner_id ON subscriptions(owner_id);
CREATE INDEX idx_staff_shop_id          ON staff(shop_id);
CREATE INDEX idx_services_shop_id       ON services(shop_id);
CREATE INDEX idx_clients_shop_id        ON clients(shop_id);
CREATE INDEX idx_clients_email          ON clients(email);
CREATE INDEX idx_clients_phone          ON clients(phone);
CREATE INDEX idx_bookings_shop_id       ON bookings(shop_id);
CREATE INDEX idx_bookings_date          ON bookings(date);
CREATE INDEX idx_bookings_staff_id      ON bookings(staff_id);
CREATE INDEX idx_bookings_client_id     ON bookings(client_id);
CREATE INDEX idx_bookings_status        ON bookings(status);
CREATE INDEX idx_inventory_shop_id      ON inventory(shop_id);
CREATE INDEX idx_campaigns_shop_id      ON campaigns(shop_id);
CREATE INDEX idx_reviews_shop_id        ON reviews(shop_id);
CREATE INDEX idx_notifications_shop_id  ON notifications(shop_id);
CREATE INDEX idx_notifications_is_read  ON notifications(shop_id, is_read);

-- ============================================================
-- UPDATED_AT TRIGGER HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — enable on every table
-- ============================================================
ALTER TABLE shops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff         ENABLE ROW LEVEL SECURITY;
ALTER TABLE services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — owner-scoped CRUD
-- ============================================================

-- shops
CREATE POLICY "owner_all_shops" ON shops
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- subscriptions
CREATE POLICY "owner_all_subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- staff
CREATE POLICY "owner_all_staff" ON staff
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- services
CREATE POLICY "owner_all_services" ON services
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- clients
CREATE POLICY "owner_all_clients" ON clients
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- bookings
CREATE POLICY "owner_all_bookings" ON bookings
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- inventory
CREATE POLICY "owner_all_inventory" ON inventory
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- campaigns
CREATE POLICY "owner_all_campaigns" ON campaigns
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- reviews
CREATE POLICY "owner_all_reviews" ON reviews
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- notifications
CREATE POLICY "owner_all_notifications" ON notifications
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ============================================================
-- PUBLIC READ POLICIES (for the /booking/[shopSlug] page)
-- These allow anonymous visitors to read what they need to
-- complete an online booking without authentication.
-- ============================================================

-- Anyone can look up a shop by slug (for the public booking page)
CREATE POLICY "public_read_shops" ON shops
  FOR SELECT USING (true);

-- Anyone can see active services (to pick from on booking page)
CREATE POLICY "public_read_active_services" ON services
  FOR SELECT USING (is_active = true);

-- Anyone can see active staff (to pick barber on booking page)
CREATE POLICY "public_read_active_staff" ON staff
  FOR SELECT USING (is_active = true);

-- Anyone can insert a booking (walk-in / online booking flow)
CREATE POLICY "public_insert_bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Anyone can insert a client record (created during online booking)
CREATE POLICY "public_insert_clients" ON clients
  FOR INSERT WITH CHECK (true);

-- Anyone can read public reviews
CREATE POLICY "public_read_reviews" ON reviews
  FOR SELECT USING (is_public = true);

-- ============================================================
-- FUNCTION: handle_new_user
-- Runs after every new Supabase Auth signup.
-- Creates the shop and a free subscription automatically.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_shop_id UUID;
  raw_name    TEXT;
  raw_slug    TEXT;
BEGIN
  raw_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'shop_name'), ''),
    'My Barbershop'
  );

  -- Build a URL-safe slug; append first 8 chars of user id to guarantee uniqueness
  raw_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(raw_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  ) || '-' || SUBSTRING(NEW.id::text, 1, 8);

  -- Ensure slug is never empty (e.g. shop name was all special characters)
  IF raw_slug IS NULL OR raw_slug = '' OR raw_slug = '-' || SUBSTRING(NEW.id::text, 1, 8) THEN
    raw_slug := 'shop-' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.shops (owner_id, name, slug, email)
  VALUES (NEW.id, raw_name, raw_slug, NEW.email)
  RETURNING id INTO new_shop_id;

  INSERT INTO public.subscriptions (shop_id, owner_id, plan, status, trial_end)
  VALUES (new_shop_id, NEW.id, 'pro', 'trialing', NOW() + INTERVAL '14 days');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if it already exists (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: update_client_stats
-- Keeps clients.total_visits and total_spent in sync whenever
-- a booking is marked completed.
-- ============================================================
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS trigger AS $$
BEGIN
  -- Only fire when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET
      total_visits = total_visits + 1,
      total_spent  = total_spent + NEW.price,
      last_visit   = NOW(),
      updated_at   = NOW()
    WHERE id = NEW.client_id;
  END IF;

  -- If a completed booking is re-opened / cancelled, reverse the stats
  IF OLD.status = 'completed' AND NEW.status != 'completed' AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET
      total_visits = GREATEST(total_visits - 1, 0),
      total_spent  = GREATEST(total_spent - OLD.price, 0),
      updated_at   = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_client_stats ON bookings;

CREATE TRIGGER trg_update_client_stats
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_client_stats();

-- ============================================================
-- FUNCTION: notify_new_booking
-- Inserts a notification row whenever a new booking is created.
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (shop_id, title, message, type)
  VALUES (
    NEW.shop_id,
    'New Booking',
    NEW.client_name || ' booked ' || (
      SELECT name FROM services WHERE id = NEW.service_id
    ) || ' on ' || TO_CHAR(NEW.date, 'Mon DD') || ' at ' || TO_CHAR(NEW.start_time, 'HH12:MI AM'),
    'booking'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_booking ON bookings;

CREATE TRIGGER trg_notify_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_new_booking();
