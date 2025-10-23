-- PostgreSQL initialization script for Red Bull Racing Meal Booking Platform
-- This script runs once when the database is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rbr_meals TO rbr_user;

-- Create custom types (will be managed by Prisma migrations)
-- This file is kept minimal to allow Prisma to manage schema

-- Performance tuning settings are already in docker-compose.yml command

-- Set default timezone
SET timezone = 'UTC';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Red Bull Racing database initialized successfully';
END $$;



