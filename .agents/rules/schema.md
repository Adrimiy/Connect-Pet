---
trigger: always_on
---

# Supabase Schema & Database Migrations Management

Whenever database changes, table definitions, policies, or SQL adjustments are needed for Supabase, all SQL code MUST be centralized inside the `schema.sql` file.

## Core Directives
- **Centralized Source of Truth**: Never execute or propose standalone database migrations without recording the complete statements inside `schema.sql` (located in the project root or within the `supabase/` directory).
- **Append & Structure**: 
  - Append new queries logically with descriptive SQL comments explaining the purpose (e.g., `-- Add adoption status column to pets table`).
  - Maintain idempotent scripts where appropriate (using `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, or `OR REPLACE`).
- **Complete Definitions**: Every table schema update must include relevant constraints, default values, foreign key relationships, indexes, and Row Level Security (RLS) policies (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` along with the corresponding `CREATE POLICY` statements).
- **No Unrecorded Schema Alterations**: The AI must explicitly verify that any new table or column expected by frontend Server Components or Server Actions is documented within `schema.sql`.