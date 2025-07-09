// Global variables
let currentUser = null;
let isLoading = false;

// Authentication helper functions
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function handleAuthError(error) {
    if (error.status === 401 || error.status === 403) {
        // Token expired or invalid
        logout();
        showLoginForm();
        alert('Your session has expired. Please login again.');
    }
    throw error;
}

// Show loading state
function showLoading() {
    isLoading = true;
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading...</p>
    `;
    document.body.appendChild(loadingDiv);
}

// Hide loading state
function hideLoading() {
    isLoading = false;
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Show preference form when "Get Started" button is clicked
function showPreferenceForm() {
    document.getElementById('preference-form').scrollIntoView({ behavior: 'smooth' });
}

// Show login form
function showLoginForm() {
    document.getElementById('login-modal').style.display = 'block';
}

// Show register form
function showRegisterForm() {
    document.getElementById('register-modal').style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Handle form submission
document.getElementById('travel-preferences').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    const travelType = document.getElementById('travel-type').value;
    const budget = document.getElementById('budget').value;
    const season = document.getElementById('season').value;

    try {
        showLoading();
        // Get destinations based on preferences
        const response = await fetch(`/api/destinations?type=${travelType}&budget=${budget}&season=${season}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch destinations');
        }
        const destinations = await response.json();
        
        if (destinations.length === 0) {
            alert('No destinations found matching your preferences. Try different criteria.');
            return;
        }
        
        displayDestinations(destinations);
    } catch (error) {
        console.error('Error fetching destinations:', error);
        alert('Error fetching destinations. Please try again.');
    } finally {
        hideLoading();
    }
});

// Display destinations in the grid
function displayDestinations(destinations) {
    const grid = document.getElementById('destinations-grid');
    if (!grid) {
        console.error('Destinations grid element not found');
        return;
    }
    
    grid.innerHTML = ''; // Clear existing content

    if (!destinations || destinations.length === 0) {
        grid.innerHTML = '<p class="no-results">No destinations found. Try different preferences.</p>';
        return;
    }

    destinations.forEach(destination => {
        const card = createDestinationCard(destination);
        grid.appendChild(card);
    });

    // Scroll to recommendations section
    const recommendationsSection = document.getElementById('destinations');
    if (recommendationsSection) {
        recommendationsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Create a destination card element
function createDestinationCard(destination) {
    const card = document.createElement('div');
    card.className = 'destination-card';

    card.innerHTML = `
        <img src="${destination.image_url || 'https://source.unsplash.com/400x300/?travel'}" 
             alt="${destination.name}" 
             class="destination-image">
        <div class="destination-info">
            <h3>${destination.name}</h3>
            <p>${destination.description || 'Experience the beauty of this amazing destination.'}</p>
            <p><strong>Rating:</strong> ${destination.rating || 'N/A'}</p>
            <p><strong>Type:</strong> ${destination.preference_type || 'N/A'}</p>
            <p><strong>Budget:</strong> ${destination.budget_range || 'N/A'}</p>
            <p><strong>Best Season:</strong> ${destination.season || 'N/A'}</p>
            <div class="card-actions">
                ${currentUser ? `
                    <button onclick="addToWishlist(${destination.id})" class="wishlist-btn">
                        Add to Wishlist
                    </button>
                    <button onclick="showReviewForm(${destination.id})" class="review-btn">
                        Write Review
                    </button>
                    <button onclick="showRestaurants(${destination.id})" class="restaurant-btn">
                        View Restaurants
                    </button>
                    <button onclick="showNearbyDestinations(${destination.id})" class="nearby-btn">
                        Nearby Places
                    </button>
                ` : `
                    <button onclick="showLoginPrompt()" class="login-btn">
                        Login to Interact
                    </button>
                `}
            </div>
        </div>
    `;

    return card;
}

// Handle user registration
async function registerUser(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            closeModal('register-modal');
            showLoginForm();
        } else {
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Error registering user:', error);
        alert('Error registering user. Please try again.');
    }
}

// Handle user login
async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            updateUIForLoggedInUser();
            closeModal('login-modal');
            alert('Login successful!');
            // Refresh the page data
            loadInitialData();
        } else {
            alert(data.error || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error logging in. Please try again.');
    }
}

// Add destination to wishlist
async function addToWishlist(destinationId) {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    try {
        const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                destination_id: destinationId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add to wishlist');
        }

        const data = await response.json();
        alert('Added to wishlist!');
    } catch (error) {
        handleAuthError(error);
        console.error('Error adding to wishlist:', error);
        alert('Error adding to wishlist. Please try again.');
    }
}

// Show review form
function showReviewForm(destinationId) {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    const reviewForm = document.createElement('div');
    reviewForm.className = 'review-form';
    reviewForm.innerHTML = `
        <h3>Write a Review</h3>
        <form id="review-form">
            <div class="form-group">
                <label for="rating">Rating:</label>
                <select id="rating" required>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
            <div class="form-group">
                <label for="comment">Comment:</label>
                <textarea id="comment" required></textarea>
            </div>
            <button type="submit">Submit Review</button>
            <button type="button" onclick="this.closest('.review-form').remove()">Cancel</button>
        </form>
    `;

    document.body.appendChild(reviewForm);

    document.getElementById('review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = document.getElementById('rating').value;
        const comment = document.getElementById('comment').value;

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    destination_id: destinationId,
                    rating,
                    comment
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit review');
            }

            const data = await response.json();
            alert('Review submitted successfully!');
            document.body.removeChild(reviewForm);
        } catch (error) {
            handleAuthError(error);
            console.error('Error submitting review:', error);
            alert('Error submitting review. Please try again.');
        }
    });
}

// Update UI for logged-in user
function updateUIForLoggedInUser() {
    const navLinks = document.querySelector('.nav-links');
    const existingUserMenu = document.querySelector('.user-menu');
    if (existingUserMenu) {
        existingUserMenu.remove();
    }

    const userMenu = document.createElement('li');
    userMenu.innerHTML = `
        <a href="#" class="user-menu">
            ${currentUser.username}
            <div class="dropdown-menu">
                <a href="#" onclick="showWishlist()">My Wishlist</a>
                <a href="#" onclick="logout()">Logout</a>
            </div>
        </a>
    `;
    navLinks.appendChild(userMenu);

    // Hide login/register links
    document.querySelector('.login-link').style.display = 'none';
    document.querySelector('.register-link').style.display = 'none';
}

// Show login prompt
function showLoginPrompt() {
    alert('Please login to use this feature.');
    showLoginForm();
}

// Show wishlist
async function showWishlist() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    try {
        const response = await fetch(`/api/wishlist/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const destinations = await response.json();
        if (response.ok) {
            displayDestinations(destinations);
        } else {
            alert('Failed to load wishlist.');
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        alert('Error loading wishlist. Please try again.');
    }
}

// Logout user
function logout() {
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
}

// Show restaurants for a destination
async function showRestaurants(destinationId) {
    try {
        const response = await fetch(`/api/restaurants/${destinationId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch restaurants');
        }
        const restaurants = await response.json();
        displayRestaurants(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        alert('Error loading restaurants. Please try again.');
    }
}

// Display restaurants in the grid
function displayRestaurants(restaurants) {
    const grid = document.getElementById('restaurants-grid');
    grid.innerHTML = '';

    restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        grid.appendChild(card);
    });
}

// Create a restaurant card element
function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';

    card.innerHTML = `
        <div class="restaurant-info">
            <h3>${restaurant.name}</h3>
            <p><strong>Cuisine:</strong> ${restaurant.cuisine_type}</p>
            <p><strong>Price Range:</strong> ${restaurant.price_range}</p>
            <p><strong>Rating:</strong> ${restaurant.rating || 'N/A'}</p>
            <p><strong>Popular Foods:</strong> ${restaurant.popular_foods || 'N/A'}</p>
            <div class="card-actions">
                <button onclick="showLocation(${restaurant.latitude}, ${restaurant.longitude})" class="location-btn">
                    View Location
                </button>
            </div>
        </div>
    `;

    return card;
}

// Show add friend form
function showAddFriendForm() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    const form = document.createElement('div');
    form.className = 'modal';
    form.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h3>Add Friend</h3>
            <form id="add-friend-form">
                <div class="form-group">
                    <label for="friend-email">Friend's Email</label>
                    <input type="email" id="friend-email" required>
                </div>
                <button type="submit">Send Request</button>
            </form>
        </div>
    `;

    document.body.appendChild(form);
    form.style.display = 'block';

    document.getElementById('add-friend-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('friend-email').value;

        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    friend_email: email
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Friend request sent successfully!');
                form.remove();
            } else {
                alert(data.error || 'Failed to send friend request.');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert('Error sending friend request. Please try again.');
        }
    });
}

// Show create group form
function showCreateGroupForm() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    const form = document.createElement('div');
    form.className = 'modal';
    form.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h3>Create Travel Group</h3>
            <form id="create-group-form">
                <div class="form-group">
                    <label for="group-name">Group Name</label>
                    <input type="text" id="group-name" required>
                </div>
                <button type="submit">Create Group</button>
            </form>
        </div>
    `;

    document.body.appendChild(form);
    form.style.display = 'block';

    document.getElementById('create-group-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('group-name').value;

        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name,
                    created_by: currentUser.id
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Group created successfully!');
                form.remove();
                loadUserGroups();
            } else {
                alert(data.error || 'Failed to create group.');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Error creating group. Please try again.');
        }
    });
}

// Load user's friends
async function loadUserFriends() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/friends/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch friends');
        }

        const friends = await response.json();
        displayFriends(friends);
    } catch (error) {
        console.error('Error loading friends:', error);
        alert('Error loading friends. Please try again.');
    }
}

// Display friends
function displayFriends(friends) {
    const container = document.getElementById('friends-list');
    container.innerHTML = '';

    friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        friendElement.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=${friend.username}" alt="${friend.username}">
            <div class="friend-info">
                <h4>${friend.username}</h4>
                <p>${friend.email}</p>
            </div>
        `;
        container.appendChild(friendElement);
    });
}

// Load user's groups
async function loadUserGroups() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/groups/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }

        const groups = await response.json();
        displayGroups(groups);
    } catch (error) {
        console.error('Error loading groups:', error);
        alert('Error loading groups. Please try again.');
    }
}

// Display groups
function displayGroups(groups) {
    const container = document.getElementById('groups-list');
    container.innerHTML = '';

    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-item';
        groupElement.innerHTML = `
            <div class="group-info">
                <h4>${group.name}</h4>
                <p>Role: ${group.role}</p>
            </div>
            <button onclick="showGroupDetails(${group.id})" class="view-group-btn">
                View Details
            </button>
        `;
        container.appendChild(groupElement);
    });
}

// Load initial data
async function loadInitialData() {
    try {
        showLoading();
        
        // Test database connection
        console.log('Testing database connection...');
        const testResponse = await fetch('/api/test');
        if (!testResponse.ok) {
            const errorData = await testResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error('Database connection test failed:', errorData);
            throw new Error(`Database connection failed: ${errorData.details || errorData.error}`);
        }
        console.log('Database connection test successful');

        // Load destinations
        console.log('Fetching destinations...');
        const response = await fetch('/api/destinations', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error('Failed to fetch destinations:', errorData);
            throw new Error(errorData.details || errorData.error || 'Failed to fetch destinations');
        }
        
        const destinations = await response.json().catch(error => {
            console.error('Failed to parse destinations response:', error);
            throw new Error('Invalid response from server');
        });
        
        console.log('Loaded destinations:', destinations);
        
        if (!destinations || destinations.length === 0) {
            console.warn('No destinations found in the database');
            const grid = document.getElementById('destinations-grid');
            if (grid) {
                grid.innerHTML = '<p class="no-results">No destinations found. Please try different preferences or check if the database is properly populated.</p>';
            }
            return;
        }
        
        displayDestinations(destinations);

        // Load user data if logged in
        if (currentUser) {
            try {
                await Promise.all([
                    loadUserFriends(),
                    loadUserGroups(),
                    loadUserWishlist()
                ]);
            } catch (error) {
                console.error('Error loading user data:', error);
                // Don't throw here, as we still want to show destinations even if user data fails to load
            }
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
        const errorMessage = error.message || 'Error loading data. Please check your database connection and try again.';
        alert(errorMessage);
        
        // Show error in the destinations grid if it exists
        const grid = document.getElementById('destinations-grid');
        if (grid) {
            grid.innerHTML = `<p class="no-results">${errorMessage}</p>`;
        }
    } finally {
        hideLoading();
    }
}

// Load user's wishlist
async function loadUserWishlist() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/wishlist/${currentUser.id}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch wishlist');
        }

        const destinations = await response.json();
        // Update UI to show wishlist items
        updateWishlistUI(destinations);
    } catch (error) {
        handleAuthError(error);
        console.error('Error loading wishlist:', error);
    }
}

// Update wishlist UI
function updateWishlistUI(destinations) {
    const wishlistContainer = document.getElementById('wishlist-container');
    if (!wishlistContainer) return;

    wishlistContainer.innerHTML = '';
    destinations.forEach(destination => {
        const card = createDestinationCard(destination);
        wishlistContainer.appendChild(card);
    });
}

// Load initial data when page loads
window.addEventListener('load', async () => {
    try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            currentUser = JSON.parse(user);
            updateUIForLoggedInUser();
        }

        await loadInitialData();
    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('Error loading data. Please refresh the page.');
    }
}); 