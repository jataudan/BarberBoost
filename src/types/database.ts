// ============================================================
// BarberBoost — Supabase Database Types
// Hand-authored to match src/lib/supabase/schema.sql exactly.
// Once you connect a real Supabase project, replace this file
// with the output of:  npx supabase gen types typescript --linked
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ── Enum mirrors ────────────────────────────────────────────
export type SubscriptionPlan   = 'free' | 'starter' | 'pro' | 'empire'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive'
export type BookingStatus      = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type PaymentMethod      = 'card' | 'cash' | 'bank_transfer'
export type AdminStatus        = 'active' | 'suspended' | 'disabled'

// ── Opening hours shape stored in JSONB ─────────────────────
export interface DayHours {
  open:   string  // "09:00"
  close:  string  // "18:00"
  closed: boolean
}

export type OpeningHours = {
  monday:    DayHours
  tuesday:   DayHours
  wednesday: DayHours
  thursday:  DayHours
  friday:    DayHours
  saturday:  DayHours
  sunday:    DayHours
}

// ── Working hours shape stored in staff JSONB ────────────────
export type WorkingHours = OpeningHours

// ============================================================
// TABLE ROW TYPES
// ============================================================

export interface Shop {
  id:                   string
  owner_id:             string
  name:                 string
  slug:                 string
  description:          string | null
  phone:                string | null
  email:                string | null
  address:              string | null
  city:                 string | null
  postcode:             string | null
  logo_url:             string | null
  cover_url:            string | null
  website:              string | null
  instagram:            string | null
  facebook:             string | null
  opening_hours:        Partial<OpeningHours>
  booking_notice_hours: number
  cancellation_hours:   number
  no_show_fee:          number
  currency:             string
  timezone:             string
  admin_status:         AdminStatus
  created_at:           string
  updated_at:           string
}

export interface Subscription {
  id:                      string
  shop_id:                 string
  owner_id:                string
  stripe_customer_id:      string | null
  stripe_subscription_id:  string | null
  stripe_price_id:         string | null
  plan:                    SubscriptionPlan
  status:                  SubscriptionStatus
  current_period_start:    string | null
  current_period_end:      string | null
  cancel_at_period_end:    boolean
  trial_end:               string | null
  created_at:              string
  updated_at:              string
}

export interface Staff {
  id:              string
  shop_id:         string
  name:            string
  email:           string | null
  phone:           string | null
  role:            string
  avatar_url:      string | null
  bio:             string | null
  colour:          string
  is_active:       boolean
  commission_rate: number
  working_hours:   Partial<WorkingHours>
  created_at:      string
}

export interface Service {
  id:               string
  shop_id:          string
  name:             string
  description:      string | null
  duration_minutes: number
  price:            number
  category:         string
  is_active:        boolean
  colour:           string
  image_url:        string | null
  created_at:       string
}

export interface Client {
  id:                   string
  shop_id:              string
  name:                 string
  email:                string | null
  phone:                string | null
  date_of_birth:        string | null
  notes:                string | null
  preferred_barber_id:  string | null
  tags:                 string[]
  marketing_consent:    boolean
  total_visits:         number
  total_spent:          number
  last_visit:           string | null
  created_at:           string
  updated_at:           string
}

export interface Booking {
  id:             string
  shop_id:        string
  client_id:      string | null
  staff_id:       string
  service_id:     string
  booking_ref:    string | null
  client_name:    string
  client_email:   string | null
  client_phone:   string | null
  date:           string          // "YYYY-MM-DD"
  start_time:     string          // "HH:MM:SS"
  end_time:       string          // "HH:MM:SS"
  status:         BookingStatus
  price:          number
  deposit_amount: number
  payment_method: PaymentMethod
  is_paid:        boolean
  notes:          string | null
  internal_notes: string | null
  reminder_sent:  boolean
  source:         string
  created_at:     string
  updated_at:     string
}

export interface InventoryItem {
  id:                  string
  shop_id:             string
  name:                string
  category:            string | null
  sku:                 string | null
  quantity:            number
  low_stock_threshold: number
  cost_price:          number | null
  retail_price:        number | null
  supplier:            string | null
  notes:               string | null
  created_at:          string
}

export interface Campaign {
  id:               string
  shop_id:          string
  name:             string
  type:             string
  subject:          string | null
  content:          string | null
  target_segment:   string
  status:           string
  sent_count:       number
  open_rate:        number | null
  scheduled_at:     string | null
  sent_at:          string | null
  created_at:       string
}

export interface Review {
  id:          string
  shop_id:     string
  booking_id:  string | null
  client_id:   string | null
  client_name: string
  rating:      number | null
  comment:     string | null
  is_public:   boolean
  created_at:  string
}

export interface PlatformReview {
  id:          string
  owner_id:    string
  shop_name:   string
  plan:        string
  rating:      number
  comment:     string
  is_approved: boolean
  created_at:  string
}

export interface Notification {
  id:         string
  shop_id:    string
  title:      string
  message:    string
  type:       string
  is_read:    boolean
  created_at: string
}

// ============================================================
// INSERT TYPES  (omit auto-generated columns)
// ============================================================

export type ShopInsert = Omit<Shop,
  'id' | 'created_at' | 'updated_at'
>

export type SubscriptionInsert = Omit<Subscription,
  'id' | 'created_at' | 'updated_at'
>

export type StaffInsert = Omit<Staff,
  'id' | 'created_at'
>

export type ServiceInsert = Omit<Service,
  'id' | 'created_at'
>

export type ClientInsert = Omit<Client,
  'id' | 'created_at' | 'updated_at' | 'total_visits' | 'total_spent' | 'last_visit'
>

export type BookingInsert = Omit<Booking,
  'id' | 'created_at' | 'updated_at' | 'reminder_sent'
>

export type InventoryInsert = Omit<InventoryItem,
  'id' | 'created_at'
>

export type CampaignInsert = Omit<Campaign,
  'id' | 'created_at' | 'sent_count' | 'open_rate' | 'sent_at'
>

export type ReviewInsert = Omit<Review,
  'id' | 'created_at'
>

export type PlatformReviewInsert = Omit<PlatformReview,
  'id' | 'created_at' | 'is_approved'
>

export type NotificationInsert = Omit<Notification,
  'id' | 'created_at'
>

// ============================================================
// UPDATE TYPES  (all fields optional except identity)
// ============================================================

export type ShopUpdate         = Partial<ShopInsert>
export type SubscriptionUpdate = Partial<SubscriptionInsert>
export type StaffUpdate        = Partial<StaffInsert>
export type ServiceUpdate      = Partial<ServiceInsert>
export type ClientUpdate       = Partial<ClientInsert>
export type BookingUpdate      = Partial<BookingInsert>
export type InventoryUpdate    = Partial<InventoryInsert>
export type CampaignUpdate     = Partial<CampaignInsert>
export type ReviewUpdate          = Partial<ReviewInsert>
export type PlatformReviewUpdate  = Partial<PlatformReviewInsert>
export type NotificationUpdate    = Partial<NotificationInsert>

// ============================================================
// JOINED / EXTENDED TYPES
// Used when Supabase returns relational data in a single query
// ============================================================

/** Booking with its related service and staff resolved */
export interface BookingWithRelations extends Booking {
  service: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price' | 'colour'>
  staff:   Pick<Staff,   'id' | 'name' | 'avatar_url' | 'colour'>
  client:  Pick<Client,  'id' | 'name' | 'email' | 'phone'> | null
}

/** Client with their last booking resolved */
export interface ClientWithLastBooking extends Client {
  last_booking: Pick<Booking, 'id' | 'date' | 'start_time' | 'status'> | null
}

/** Shop with active plan resolved */
export interface ShopWithSubscription extends Shop {
  subscription: Pick<Subscription, 'plan' | 'status' | 'current_period_end'> | null
}

// ============================================================
// SUPABASE DATABASE SHAPE
// Used as the generic for createBrowserClient<Database>() once
// real Supabase types are generated. Until then, the client
// files use the untyped client to avoid inference mismatches.
// ============================================================

export interface Database {
  public: {
    Tables: {
      shops: {
        Row:    Shop
        Insert: ShopInsert
        Update: ShopUpdate
      }
      subscriptions: {
        Row:    Subscription
        Insert: SubscriptionInsert
        Update: SubscriptionUpdate
      }
      staff: {
        Row:    Staff
        Insert: StaffInsert
        Update: StaffUpdate
      }
      services: {
        Row:    Service
        Insert: ServiceInsert
        Update: ServiceUpdate
      }
      clients: {
        Row:    Client
        Insert: ClientInsert
        Update: ClientUpdate
      }
      bookings: {
        Row:    Booking
        Insert: BookingInsert
        Update: BookingUpdate
      }
      inventory: {
        Row:    InventoryItem
        Insert: InventoryInsert
        Update: InventoryUpdate
      }
      campaigns: {
        Row:    Campaign
        Insert: CampaignInsert
        Update: CampaignUpdate
      }
      reviews: {
        Row:    Review
        Insert: ReviewInsert
        Update: ReviewUpdate
      }
      platform_reviews: {
        Row:    PlatformReview
        Insert: PlatformReviewInsert
        Update: PlatformReviewUpdate
      }
      notifications: {
        Row:    Notification
        Insert: NotificationInsert
        Update: NotificationUpdate
      }
    }
    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums: {
      subscription_plan:   SubscriptionPlan
      subscription_status: SubscriptionStatus
      booking_status:      BookingStatus
      payment_method:      PaymentMethod
    }
  }
}
