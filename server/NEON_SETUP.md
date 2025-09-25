# Neon Database Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create new project
4. Choose region closest to your users (US East for US/Mexico)

### 2. Get Connection String
1. In Neon dashboard, go to your project
2. Click "Connection Details"
3. Copy the connection string (starts with `postgresql://`)

### 3. Set Environment Variable
Add to your Render environment variables:
```
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### 4. Create Database Schema
1. Go to Neon SQL Editor
2. Copy and paste the contents of `neon-schema.sql`
3. Run the SQL to create all tables

### 5. Test Connection
Your server will automatically connect to Neon when deployed.

## 📊 Database Schema

The schema includes tables for:
- **medication_contributions** - User price contributions
- **user_symptoms** - User symptom tracking
- **user_supplements** - User supplement tracking  
- **user_doctors** - Doctor contact information
- **user_profiles** - User profile data

## 🔒 Security Features

- **Row Level Security (RLS)** enabled
- **Encrypted connections** (SSL required)
- **Automatic backups**
- **Audit logs**
- **GDPR compliant**

## 💰 Pricing

- **Free tier**: 3GB storage (6x more than Supabase!)
- **Pro tier**: $19/month for 10GB
- **No connection limits** on free tier
- **Serverless scaling**

## 🆚 vs Supabase

| Feature | Neon | Supabase |
|---------|------|----------|
| **Free Storage** | **3GB** | 500MB |
| **Pro Price** | **$19** | $25 |
| **Pro Storage** | **10GB** | 8GB |
| **PostgreSQL** | ✅ | ✅ |
| **Security** | ✅ | ✅ |
| **Serverless** | ✅ | ✅ |

## 🚀 Benefits

- **6x more free storage** than Supabase
- **Cheaper pro tier** ($19 vs $25)
- **Same PostgreSQL** database
- **Better performance** for serverless
- **Full compliance** for US/Mexico

## 📝 Next Steps

1. Create Neon account
2. Get connection string
3. Add to Render environment
4. Run schema SQL
5. Deploy and test!

Your app will now use Neon instead of Supabase! 🎉
