const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rsvr@msi',
    database: 'travelrecommendationdb'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
});

// Test database connection
app.get('/api/test', (req, res) => {
    console.log('Testing database connection...');
    db.query('SELECT 1', (err, results) => {
        if (err) {
            console.error('Database connection test failed:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            res.status(500).json({ error: 'Database connection failed', details: err.message });
            return;
        }
        console.log('Database connection test successful');
        res.json({ message: 'Database connection successful', results });
    });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).json({ error: 'Error serving index.html' });
    }
});

// API endpoint to get all destinations
app.get('/api/destinations', (req, res) => {
    console.log('Fetching destinations...');
    const { type, budget, season } = req.query;
    console.log('Query parameters:', { type, budget, season });
    
    let query = `
        SELECT DISTINCT d.*, 
            GROUP_CONCAT(DISTINCT p.preference_type) as preference_types,
            GROUP_CONCAT(DISTINCT p.budget_range) as budget_ranges,
            GROUP_CONCAT(DISTINCT p.season) as seasons,
            GROUP_CONCAT(DISTINCT p.travel_style) as travel_styles,
            (SELECT AVG(rating) FROM reviews WHERE destination_id = d.id) as average_rating,
            (SELECT COUNT(*) FROM reviews WHERE destination_id = d.id) as review_count
        FROM destinations d
        LEFT JOIN preferences p ON d.id = p.destination_id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (type) {
        query += ' AND p.preference_type = ?';
        params.push(type);
    }
    if (budget) {
        query += ' AND p.budget_range = ?';
        params.push(budget);
    }
    if (season) {
        query += ' AND p.season = ?';
        params.push(season);
    }
    
    query += ' GROUP BY d.id ORDER BY d.rating DESC';
    
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching destinations:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            res.status(500).json({ error: err.message, details: err.code });
            return;
        }
        
        console.log('Query results:', results);
        
        if (!results || results.length === 0) {
            console.log('No destinations found in database');
            res.json([]);
            return;
        }
        
        // Process the results to format arrays and update image URLs
        const formattedResults = results.map(destination => {
            // Convert Unsplash URLs to local image paths
            let imageUrl = destination.image_url;
            if (imageUrl.includes('unsplash.com')) {
                const destinationName = destination.name.toLowerCase().replace(/\s+/g, '-');
                imageUrl = `images/destinations/${destinationName}.jpg`;
            }
            
            return {
                ...destination,
                image_url: imageUrl,
                preference_types: destination.preference_types ? destination.preference_types.split(',') : [],
                budget_ranges: destination.budget_ranges ? destination.budget_ranges.split(',') : [],
                seasons: destination.seasons ? destination.seasons.split(',') : [],
                travel_styles: destination.travel_styles ? destination.travel_styles.split(',') : [],
                average_rating: parseFloat(destination.average_rating) || destination.rating,
                review_count: parseInt(destination.review_count) || 0
            };
        });
        
        console.log('Formatted results:', formattedResults);
        res.json(formattedResults);
    });
});

// API endpoint to get user preferences
app.get('/api/preferences', (req, res) => {
    const query = 'SELECT DISTINCT preference_type, budget_range, season FROM preferences';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching preferences:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// API endpoint for user registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        // Check if user already exists
        const checkQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
        db.query(checkQuery, [email, username], async (err, results) => {
            if (err) {
                console.error('Error checking user:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            if (results.length > 0) {
                res.status(400).json({ error: 'User already exists' });
                return;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
            db.query(insertQuery, [username, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error registering user:', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'User registered successfully', userId: result.insertId });
            });
        });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for user login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error in login:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (results.length === 0) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        
        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid password' });
            return;
        }
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '24h' });
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email 
            } 
        });
    });
});

// Protected routes
app.post('/api/wishlist', authenticateToken, (req, res) => {
    const { destination_id } = req.body;
    const user_id = req.user.id;
    
    // Check if already in wishlist
    const checkQuery = 'SELECT * FROM wishlist WHERE user_id = ? AND destination_id = ?';
    db.query(checkQuery, [user_id, destination_id], (err, results) => {
        if (err) {
            console.error('Error checking wishlist:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        if (results.length > 0) {
            res.status(400).json({ error: 'Destination already in wishlist' });
            return;
        }

        const insertQuery = 'INSERT INTO wishlist (user_id, destination_id) VALUES (?, ?)';
        db.query(insertQuery, [user_id, destination_id], (err, result) => {
            if (err) {
                console.error('Error adding to wishlist:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Destination added to wishlist' });
        });
    });
});

// API endpoint to get user's wishlist
app.get('/api/wishlist/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    
    // Verify that the user is accessing their own wishlist
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const query = `
        SELECT d.* 
        FROM destinations d
        JOIN wishlist w ON d.id = w.destination_id
        WHERE w.user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching wishlist:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// API endpoint to add a review
app.post('/api/reviews', authenticateToken, (req, res) => {
    const { destination_id, rating, comment } = req.body;
    const user_id = req.user.id;
    
    const query = 'INSERT INTO reviews (destination_id, user_id, rating, comment) VALUES (?, ?, ?, ?)';
    db.query(query, [destination_id, user_id, rating, comment], (err, result) => {
        if (err) {
            console.error('Error adding review:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Review added successfully' });
    });
});

// API endpoint to get reviews for a destination
app.get('/api/reviews/:destinationId', (req, res) => {
    const { destinationId } = req.params;
    
    const query = `
        SELECT r.*, u.username 
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.destination_id = ?
        ORDER BY r.created_at DESC
    `;
    
    db.query(query, [destinationId], (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// API endpoint to get restaurants for a destination
app.get('/api/restaurants/:destinationId', (req, res) => {
    const { destinationId } = req.params;
    
    const query = `
        SELECT r.*, GROUP_CONCAT(f.name) as popular_foods
        FROM restaurants r
        LEFT JOIN foods f ON r.id = f.restaurant_id
        WHERE r.destination_id = ?
        GROUP BY r.id
    `;
    
    db.query(query, [destinationId], (err, results) => {
        if (err) {
            console.error('Error fetching restaurants:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// API endpoint to get nearby destinations
app.get('/api/nearby/:destinationId', (req, res) => {
    const { destinationId } = req.params;
    const { radius = 50 } = req.query; // Default radius in kilometers
    
    const query = `
        SELECT d.*, 
            (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude)))) AS distance
        FROM destinations d
        WHERE d.id != ?
        HAVING distance < ?
        ORDER BY distance
    `;
    
    db.query(query, [latitude, longitude, latitude, destinationId, radius], (err, results) => {
        if (err) {
            console.error('Error fetching nearby destinations:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// API endpoint to get user's friends
app.get('/api/friends/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    
    // Verify that the user is accessing their own friends list
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const query = `
        SELECT u.id, u.username, u.email
        FROM users u
        JOIN social_connections sc ON (sc.friend_id = u.id OR sc.user_id = u.id)
        WHERE (sc.user_id = ? OR sc.friend_id = ?)
        AND sc.status = 'accepted'
        AND u.id != ?
    `;
    
    db.query(query, [userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching friends:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// API endpoint to add a friend
app.post('/api/friends', authenticateToken, (req, res) => {
    const { friend_email } = req.body;
    const user_id = req.user.id;
    
    // First, find the friend by email
    const findFriendQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(findFriendQuery, [friend_email], (err, results) => {
        if (err) {
            console.error('Error finding friend:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        const friend_id = results[0].id;
        
        // Check if connection already exists
        const checkQuery = `
            SELECT * FROM social_connections 
            WHERE (user_id = ? AND friend_id = ?) 
            OR (user_id = ? AND friend_id = ?)
        `;
        
        db.query(checkQuery, [user_id, friend_id, friend_id, user_id], (err, results) => {
            if (err) {
                console.error('Error checking connection:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (results.length > 0) {
                res.status(400).json({ error: 'Connection already exists' });
                return;
            }
            
            // Create new connection
            const insertQuery = 'INSERT INTO social_connections (user_id, friend_id) VALUES (?, ?)';
            db.query(insertQuery, [user_id, friend_id], (err, result) => {
                if (err) {
                    console.error('Error creating connection:', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Friend request sent successfully' });
            });
        });
    });
});

// API endpoint to get user's travel groups
app.get('/api/groups/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    
    // Verify that the user is accessing their own groups
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const query = `
        SELECT tg.*, gm.role
        FROM travel_groups tg
        JOIN group_members gm ON tg.id = gm.group_id
        WHERE gm.user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching groups:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// API endpoint to create a travel group
app.post('/api/groups', authenticateToken, (req, res) => {
    const { name } = req.body;
    const created_by = req.user.id;
    
    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Create the group
        const createGroupQuery = 'INSERT INTO travel_groups (name, created_by) VALUES (?, ?)';
        db.query(createGroupQuery, [name, created_by], (err, result) => {
            if (err) {
                db.rollback(() => {
                    console.error('Error creating group:', err);
                    res.status(500).json({ error: err.message });
                });
                return;
            }
            
            const groupId = result.insertId;
            
            // Add creator as admin
            const addMemberQuery = 'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)';
            db.query(addMemberQuery, [groupId, created_by, 'admin'], (err) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error adding group member:', err);
                        res.status(500).json({ error: err.message });
                    });
                    return;
                }
                
                db.commit(err => {
                    if (err) {
                        db.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).json({ error: err.message });
                        });
                        return;
                    }
                    res.json({ message: 'Group created successfully', groupId });
                });
            });
        });
    });
});

// API endpoint to add member to group
app.post('/api/groups/:groupId/members', (req, res) => {
    const { groupId } = req.params;
    const { user_id } = req.body;
    
    const query = 'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)';
    db.query(query, [groupId, user_id], (err, result) => {
        if (err) {
            console.error('Error adding group member:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Member added successfully' });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 