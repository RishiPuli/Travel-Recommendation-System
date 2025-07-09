-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS travelrecommendationdb;
USE travelrecommendationdb;

-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    rating DECIMAL(3,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    country VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create preferences table
CREATE TABLE IF NOT EXISTS preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destination_id INT,
    preference_type ENUM('Adventure', 'Relaxation', 'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife') NOT NULL,
    budget_range ENUM('Budget', 'Moderate', 'Luxury') NOT NULL,
    season ENUM('Spring', 'Summer', 'Fall', 'Winter') NOT NULL,
    travel_style ENUM('Individual', 'Group', 'Family', 'Couple') NOT NULL,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destination_id INT,
    name VARCHAR(100) NOT NULL,
    cuisine_type VARCHAR(50) NOT NULL,
    price_range ENUM('Budget', 'Moderate', 'Luxury') NOT NULL,
    rating DECIMAL(3,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    FOREIGN KEY (destination_id) REFERENCES destinations(id)
);

-- Create foods table
CREATE TABLE IF NOT EXISTS foods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- Create social_connections table
CREATE TABLE IF NOT EXISTS social_connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    friend_id INT,
    status ENUM('pending', 'accepted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

-- Create travel_groups table
CREATE TABLE IF NOT EXISTS travel_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT,
    user_id INT,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES travel_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destination_id INT,
    user_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    destination_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

-- Insert sample destinations
INSERT INTO destinations (name, description, image_url, rating, country, city, latitude, longitude) VALUES
('Bali Paradise', 'Experience the perfect blend of beaches, culture, and luxury resorts', 'https://source.unsplash.com/800x600/?bali', 4.8, 'Indonesia', 'Bali', -8.409518, 115.188919),
('Paris Getaway', 'The city of love, art, and exquisite cuisine', 'https://source.unsplash.com/800x600/?paris', 4.7, 'France', 'Paris', 48.8566, 2.3522),
('Tokyo Adventure', 'A vibrant city where tradition meets future', 'https://source.unsplash.com/800x600/?tokyo', 4.6, 'Japan', 'Tokyo', 35.6762, 139.6503),
('Santorini Sunset', 'Stunning views and romantic atmosphere', 'https://source.unsplash.com/800x600/?santorini', 4.9, 'Greece', 'Santorini', 36.3932, 25.4615),
('New York City', 'The city that never sleeps', 'https://source.unsplash.com/800x600/?newyork', 4.5, 'USA', 'New York', 40.7128, -74.0060),
('Sydney Harbor', 'Iconic Opera House and beautiful beaches', 'https://source.unsplash.com/800x600/?sydney', 4.7, 'Australia', 'Sydney', -33.8688, 151.2093),
('Dubai Luxury', 'Modern architecture and desert adventures', 'https://source.unsplash.com/800x600/?dubai', 4.6, 'UAE', 'Dubai', 25.2048, 55.2708),
('Bangkok Street Life', 'Vibrant street markets and rich culture', 'https://source.unsplash.com/800x600/?bangkok', 4.4, 'Thailand', 'Bangkok', 13.7563, 100.5018),
('Rome History', 'Ancient ruins and delicious cuisine', 'https://source.unsplash.com/800x600/?rome', 4.8, 'Italy', 'Rome', 41.9028, 12.4964),
('Cape Town Beauty', 'Stunning landscapes and wildlife', 'https://source.unsplash.com/800x600/?capetown', 4.7, 'South Africa', 'Cape Town', -33.9249, 18.4241);

-- Insert sample preferences
INSERT INTO preferences (destination_id, preference_type, budget_range, season, travel_style) VALUES
(1, 'Beach', 'Luxury', 'Summer', 'Couple'),
(1, 'Relaxation', 'Moderate', 'Summer', 'Family'),
(2, 'Cultural', 'Moderate', 'Spring', 'Individual'),
(2, 'Cultural', 'Luxury', 'Fall', 'Couple'),
(3, 'Adventure', 'Moderate', 'Spring', 'Group'),
(3, 'Cultural', 'Budget', 'Fall', 'Individual'),
(4, 'Relaxation', 'Luxury', 'Summer', 'Couple'),
(4, 'Beach', 'Moderate', 'Summer', 'Family'),
(5, 'Adventure', 'Moderate', 'Spring', 'Group'),
(5, 'Cultural', 'Luxury', 'Fall', 'Individual'),
(6, 'Beach', 'Moderate', 'Summer', 'Family'),
(6, 'Cultural', 'Luxury', 'Spring', 'Couple'),
(7, 'Adventure', 'Luxury', 'Winter', 'Group'),
(7, 'Cultural', 'Moderate', 'Fall', 'Individual'),
(8, 'Cultural', 'Budget', 'Spring', 'Group'),
(8, 'Adventure', 'Moderate', 'Fall', 'Individual'),
(9, 'Cultural', 'Moderate', 'Spring', 'Couple'),
(9, 'Adventure', 'Luxury', 'Fall', 'Group'),
(10, 'Adventure', 'Moderate', 'Summer', 'Group'),
(10, 'Wildlife', 'Luxury', 'Spring', 'Family');

-- Insert sample restaurants
INSERT INTO restaurants (destination_id, name, cuisine_type, price_range, rating, latitude, longitude) VALUES
(1, 'Bali Beach Club', 'International', 'Luxury', 4.7, -8.409518, 115.188919),
(1, 'Warung Local', 'Indonesian', 'Budget', 4.5, -8.409518, 115.188919),
(2, 'Le Petit Paris', 'French', 'Luxury', 4.8, 48.8566, 2.3522),
(2, 'Bistro Moderne', 'French', 'Moderate', 4.6, 48.8566, 2.3522),
(3, 'Sushi Master', 'Japanese', 'Luxury', 4.9, 35.6762, 139.6503),
(3, 'Ramen Street', 'Japanese', 'Budget', 4.4, 35.6762, 139.6503),
(4, 'Sunset Taverna', 'Greek', 'Moderate', 4.7, 36.3932, 25.4615),
(4, 'Seafood Paradise', 'Mediterranean', 'Luxury', 4.8, 36.3932, 25.4615),
(5, 'NYC Steakhouse', 'American', 'Luxury', 4.6, 40.7128, -74.0060),
(5, 'Pizza Corner', 'Italian', 'Budget', 4.3, 40.7128, -74.0060);

-- Insert sample foods
INSERT INTO foods (restaurant_id, name, description, price, is_vegetarian, is_vegan) VALUES
(1, 'Grilled Seafood Platter', 'Fresh seafood with local spices', 45.00, false, false),
(1, 'Tropical Salad', 'Fresh fruits and vegetables', 15.00, true, true),
(2, 'Nasi Goreng', 'Traditional Indonesian fried rice', 8.00, false, false),
(2, 'Gado Gado', 'Vegetable salad with peanut sauce', 7.00, true, true),
(3, 'Coq au Vin', 'Classic French chicken dish', 35.00, false, false),
(3, 'Ratatouille', 'Vegetable stew', 25.00, true, true),
(4, 'Croissant', 'Buttery pastry', 5.00, true, false),
(4, 'French Onion Soup', 'Traditional soup with cheese', 12.00, true, false),
(5, 'Premium Sushi Set', 'Fresh fish selection', 50.00, false, false),
(5, 'Vegetable Tempura', 'Crispy fried vegetables', 15.00, true, false);

-- Insert sample users
INSERT INTO users (username, email, password) VALUES
('john_doe', 'john@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5YxX'),
('jane_smith', 'jane@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5YxX'),
('travel_lover', 'travel@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5YxX');

-- Insert sample reviews
INSERT INTO reviews (destination_id, user_id, rating, comment) VALUES
(1, 1, 5, 'Amazing beaches and friendly locals!'),
(1, 2, 4, 'Great experience, but a bit crowded.'),
(2, 1, 5, 'The city of love lives up to its name!'),
(2, 3, 4, 'Beautiful architecture and delicious food.'),
(3, 2, 5, 'Incredible mix of traditional and modern culture.'),
(3, 3, 4, 'Great shopping and amazing food!');

-- Insert sample social connections
INSERT INTO social_connections (user_id, friend_id, status) VALUES
(1, 2, 'accepted'),
(2, 3, 'accepted'),
(1, 3, 'pending');

-- Insert sample travel groups
INSERT INTO travel_groups (name, created_by) VALUES
('Asia Explorers', 1),
('European Adventure', 2),
('Beach Lovers', 3);

-- Insert sample group members
INSERT INTO group_members (group_id, user_id, role) VALUES
(1, 1, 'admin'),
(1, 2, 'member'),
(2, 2, 'admin'),
(2, 3, 'member'),
(3, 3, 'admin'),
(3, 1, 'member');

-- Insert sample wishlist items
INSERT INTO wishlist (user_id, destination_id) VALUES
(1, 1),
(1, 3),
(2, 2),
(2, 4),
(3, 5),
(3, 6);

-- Create indexes for better performance
CREATE INDEX idx_destinations_rating ON destinations(rating);
CREATE INDEX idx_preferences_type ON preferences(preference_type);
CREATE INDEX idx_preferences_budget ON preferences(budget_range);
CREATE INDEX idx_preferences_season ON preferences(season);

-- Create view for popular destinations
CREATE OR REPLACE VIEW popular_destinations AS
SELECT d.*, p.preference_type, p.budget_range, p.season
FROM destinations d
JOIN preferences p ON d.id = p.destination_id
WHERE d.rating >= 4.5
ORDER BY d.rating DESC;

-- Create view for seasonal recommendations
CREATE OR REPLACE VIEW seasonal_recommendations AS
SELECT d.*, p.preference_type, p.budget_range, p.season
FROM destinations d
JOIN preferences p ON d.id = p.destination_id
ORDER BY d.rating DESC; 