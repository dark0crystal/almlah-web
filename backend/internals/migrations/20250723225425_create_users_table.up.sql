CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE
);