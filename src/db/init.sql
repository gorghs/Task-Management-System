-- This file is automatically executed by PostgreSQL upon first container start.

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Custom Types: ENUMs
CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- 2. USER TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TASK TABLE (without embedded index definitions)
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assigned_user_id UUID NOT NULL REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending' NOT NULL,
    priority task_priority DEFAULT 'medium' NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- 4. INDEX DEFINITIONS (Must be separate statements AFTER table creation)

-- Index 1: Supports filtering by user, status, and sorting by due date (most common query)
CREATE INDEX idx_user_status_due ON tasks (assigned_user_id, status, due_date); 

-- Index 2: Supports our unique "Time-Warp" filter and general user/creation-time lookup
CREATE INDEX idx_user_created_at ON tasks (assigned_user_id, created_at);
