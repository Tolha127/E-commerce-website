import config from './config.js';
const API_URL = config.API_URL;

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Redirect if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Handle login
if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'error-message';
    loginForm.insertBefore(errorDisplay, loginForm.firstChild);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDisplay.textContent = '';
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            errorDisplay.textContent = 'Please fill in all fields';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'index.html';
            } else {
                errorDisplay.textContent = data.message || 'Invalid credentials';
            }
        } catch (err) {
            errorDisplay.textContent = 'Network error. Please try again later.';
            console.error('Login error:', err);
        }
    });
}

// Handle registration
if (document.getElementById('register-form')) {
    const registerForm = document.getElementById('register-form');
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'error-message';
    registerForm.insertBefore(errorDisplay, registerForm.firstChild);

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDisplay.textContent = '';
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (password.length < 6) {
            errorDisplay.textContent = 'Password must be at least 6 characters long';
            return;
        }

        if (password !== confirmPassword) {
            errorDisplay.textContent = 'Passwords do not match';
            return;
        }

        if (!fullName) {
            errorDisplay.textContent = 'Please enter your full name';
            return;
        }

        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errorDisplay.textContent = 'Please enter a valid email address';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'index.html';
            } else {
                errorDisplay.textContent = data.message || 'Error registering user';
            }
        } catch (err) {
            errorDisplay.textContent = 'Network error. Please try again later.';
            console.error('Registration error:', err);
        }
    });
}

// Handle logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Helper functions for API calls
function getCsrfToken() {
    // Implement your logic to get the CSRF token
    return 'your-csrf-token';
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-CSRF-Token': getCsrfToken() // Add CSRF token
    };

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }

        return data;
    } catch (err) {
        throw err;
    }
}

function validateForm(formData) {
    const errors = [];
    
    if (formData.has('password') && formData.get('password').length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (formData.has('email') && !formData.get('email').match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push('Please enter a valid email address');
    }
    
    return errors;
}

function checkTokenExpiration() {
    const token = localStorage.getItem('token');
    if (token) {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.exp * 1000 < Date.now()) {
            logout();
            alert('Your session has expired. Please login again.');
        }
    }
}

setInterval(checkTokenExpiration, 60000); // Check every minute

// Export functions for use in other scripts
window.auth = {
    isLoggedIn,
    requireAuth,
    logout,
    getCurrentUser: () => JSON.parse(localStorage.getItem('user')),
    updateUserCart: async (cart) => {
        try {
            await apiCall('/auth/cart', 'PUT', { cart });
        } catch (err) {
            console.error('Error updating cart:', err);
        }
    },
    updateUserWishlist: async (wishlist) => {
        try {
            await apiCall('/auth/wishlist', 'PUT', { wishlist });
        } catch (err) {
            console.error('Error updating wishlist:', err);
        }
    },
    // Helper method for making authenticated API calls
    apiCall
};