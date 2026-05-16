# Digital Stethoscope - Setup Guide

## Environment Configuration

### 1. Backend Environment Variables

Create `backend/.env`:

```bash
# Database
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Device Authentication (generate a strong random key)
DEVICE_API_KEY=your_strong_random_device_api_key_here

# ML Service
ML_SERVICE_URL=http://localhost:8000

# Alert Thresholds
ALERT_LEAK_THRESHOLD=0.7
ALERT_SEVERITY_THRESHOLD=30

# CORS (production only)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Web Push Notifications (generate using web-push CLI)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@domain.com
```

### 2. Frontend Environment Variables

Create `frontend/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Webhook Secret (from Clerk dashboard)
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# API Endpoints
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000
```

### 3. ML Service Environment Variables

Create `ml/.env`:

```bash
# Optional: Groq API for advanced features
GROQ_API_KEY=your_groq_api_key_if_needed
```

## Setup Instructions

### 1. Generate VAPID Keys for Web Push

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copy the generated keys to your backend `.env` file.

### 2. Generate Device API Key

```bash
# Generate a secure random key
openssl rand -hex 32
```

Use this as your `DEVICE_API_KEY` in backend `.env`.

### 3. Database Setup

1. Create a Supabase project
2. Run the SQL schema from `database/schema.sql`
3. Enable Realtime for tables: `readings`, `alerts`, `predictions`
4. Copy your project URL and keys to environment files

### 4. Authentication Setup

1. Create a Clerk application
2. Configure sign-in/sign-up pages
3. Set up webhook endpoint: `https://yourdomain.com/api/webhook/clerk`
4. Copy keys to environment files

### 5. Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Or start individual services
docker-compose up ml backend frontend
```

### 6. Development Mode

```bash
# Terminal 1: ML Service
cd ml
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000

# Terminal 2: Backend
cd backend
npm install
npm run dev

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

## Security Checklist

- [ ] Change default `DEVICE_API_KEY` to a strong random value
- [ ] Use HTTPS in production
- [ ] Configure CORS `ALLOWED_ORIGINS` for production
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up proper firewall rules
- [ ] Use environment-specific Clerk keys
- [ ] Rotate API keys regularly

## Troubleshooting

### ML Service Connection Issues
- Check if ML service is running on port 8000
- Verify `ML_SERVICE_URL` in backend environment
- Check Docker network connectivity

### Authentication Issues
- Verify Clerk keys are correct
- Check webhook endpoint configuration
- Ensure CORS settings allow your domain

### Database Connection Issues
- Verify Supabase URL and keys
- Check if RLS policies allow your operations
- Ensure database schema is up to date

### Real-time Issues
- Enable Realtime in Supabase dashboard
- Check if tables have proper RLS policies
- Verify WebSocket connections aren't blocked