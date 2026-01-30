
-- Omni Marketplace Database Schema Reference
-- Compatible with PostgreSQL/MySQL syntax

-- 1. Users Table (Stores Buyers, Sellers, Admins, Staff)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMIN', 'SELLER', 'BUYER', 'STAFF', 'MARKETER', 'TEAM_MEMBER', 'TECHNICAL'
    pin VARCHAR(255), -- Security PIN
    store_name VARCHAR(255),
    country VARCHAR(100),
    currency VARCHAR(10),
    currency_symbol VARCHAR(5),
    state VARCHAR(100),
    city VARCHAR(100),
    profile_picture_url TEXT,
    is_suspended BOOLEAN DEFAULT FALSE,
    joined_at BIGINT,
    
    -- Seller Specific Fields
    rent_paid BOOLEAN DEFAULT FALSE,
    rent_payment_proof TEXT,
    rent_payment_status VARCHAR(50), -- 'pending', 'confirmed', 'rejected', 'none'
    subscription_expiry BIGINT,
    seller_rating DECIMAL(3, 2) DEFAULT 0,
    monthly_report_subscribed BOOLEAN DEFAULT FALSE,
    
    -- JSON fields for complex nested data
    verification_data JSON, -- { businessName, cacRegistrationNumber, verificationStatus, govDocumentUrl, ... }
    bank_details JSON, -- { bankName, accountNumber, accountName }
    ai_config JSON, -- { greeting, tone, autoReplyEnabled, specialInstructions }
    payment_config JSON, -- { paystackPublicKey, stripePublicKey, ... }
    enabled_payment_methods JSON -- Array of strings e.g., ["bank_transfer", "card"]
);

-- 2. Stores Table
CREATE TABLE stores (
    id VARCHAR(255) PRIMARY KEY,
    seller_id VARCHAR(255) REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    banner_url TEXT,
    status VARCHAR(50) DEFAULT 'active' -- 'active', 'suspended'
);

-- 3. Products Table
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    seller_id VARCHAR(255) REFERENCES users(id),
    store_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    image_url TEXT,
    video_url TEXT,
    gallery JSON, -- Array of image URLs
    sizes JSON, -- Array of available sizes
    currency_symbol VARCHAR(5),
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flags INTEGER DEFAULT 0
);

-- 4. Transactions Table
CREATE TABLE transactions (
    id VARCHAR(255) PRIMARY KEY,
    buyer_id VARCHAR(255) REFERENCES users(id),
    seller_id VARCHAR(255) REFERENCES users(id),
    product_id VARCHAR(255) REFERENCES products(id),
    product_name VARCHAR(255),
    store_name VARCHAR(255),
    
    amount DECIMAL(15, 2) NOT NULL,
    commission DECIMAL(15, 2) DEFAULT 0,
    tax DECIMAL(15, 2) DEFAULT 0,
    
    currency_symbol VARCHAR(5),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'failed'
    delivery_type VARCHAR(50), -- 'home_delivery', 'instant_pickup'
    
    billing_details JSON, -- { fullName, address, city, state, phone }
    proof_of_payment TEXT,
    payment_reference VARCHAR(255),
    seller_note TEXT,
    timestamp BIGINT
);

-- 5. Disputes Table
CREATE TABLE disputes (
    id VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255) REFERENCES transactions(id),
    buyer_id VARCHAR(255) REFERENCES users(id),
    seller_id VARCHAR(255) REFERENCES users(id),
    
    reason VARCHAR(100), -- 'fake_product', 'not_delivered', 'damaged', 'scam', 'other'
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REFUNDED', 'ESCALATED'
    admin_note TEXT,
    escalated_at BIGINT,
    timestamp BIGINT
);

-- 6. Reviews Table
CREATE TABLE reviews (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) REFERENCES products(id),
    buyer_id VARCHAR(255) REFERENCES users(id),
    buyer_name VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified_purchase BOOLEAN DEFAULT TRUE,
    timestamp BIGINT
);

-- 7. Seller Recommendations
CREATE TABLE seller_recommendations (
    id VARCHAR(255) PRIMARY KEY,
    seller_id VARCHAR(255) REFERENCES users(id),
    buyer_id VARCHAR(255) REFERENCES users(id),
    buyer_name VARCHAR(255),
    store_name VARCHAR(255),
    rating INTEGER,
    comment TEXT,
    timestamp BIGINT
);

-- 8. Messages / Chat Channels
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    channel_id VARCHAR(255), -- Typically store_id or 'system'
    sender_id VARCHAR(255) REFERENCES users(id),
    sender_name VARCHAR(255),
    text TEXT,
    attachment_url TEXT,
    timestamp BIGINT
);

-- 9. Visitor Logs
CREATE TABLE visitor_logs (
    id VARCHAR(255) PRIMARY KEY,
    ip_address VARCHAR(45),
    location VARCHAR(255),
    device_info TEXT,
    page_visited VARCHAR(255),
    timestamp BIGINT
);

-- 10. Site Configuration (Singleton)
CREATE TABLE site_config (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(255),
    hero_title VARCHAR(255),
    maintenance_mode BOOLEAN DEFAULT FALSE,
    config_json JSON -- Stores full configuration object
);
