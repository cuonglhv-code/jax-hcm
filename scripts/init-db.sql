-- Creates the database user and database if not exists
-- (Postgres initialisation hook — runs only on first container start)
-- This file is intentionally minimal; schema is managed by Knex migrations.
SELECT 'Database initialised by docker-compose' AS status;
