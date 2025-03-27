// User database simulation (in production, this would be on a server)
let users = JSON.parse(localStorage.getItem('users')) || [];

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
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
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            // Store user session
            const session = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                cart: user.cart || []
            };
            localStorage.setItem('currentUser', JSON.stringify(session));
            window.location.href = 'index.html';
        } else {
            alert('Invalid email or password');
        }
    });
}

// Handle registration
if (document.getElementById('register-form')) {
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (users.some(u => u.email === email)) {
            alert('Email already registered');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            password,
            cart: [],
            orders: [],
            addresses: []
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Auto login after registration
        const session = {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            cart: []
        };
        localStorage.setItem('currentUser', JSON.stringify(session));
        window.location.href = 'index.html';
    });
}

// Handle logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Export functions for use in other scripts
window.auth = {
    isLoggedIn,
    requireAuth,
    logout,
    getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser')),
    updateUserCart: (cart) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            currentUser.cart = cart;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update user in database
            const users = JSON.parse(localStorage.getItem('users'));
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].cart = cart;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
    }
};