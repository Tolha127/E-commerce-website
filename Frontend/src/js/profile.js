// Check authentication
window.auth.requireAuth();

// Load user data
const currentUser = window.auth.getCurrentUser();
const users = JSON.parse(localStorage.getItem('users'));
const userData = users.find(u => u.id === currentUser.id);

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    loadOrderHistory();
    loadAddresses();
    setupEventListeners();
});

// Load profile data
function loadProfileData() {
    document.getElementById('fullName').value = userData.fullName;
    document.getElementById('email').value = userData.email;
}

// Load order history
function loadOrderHistory() {
    const ordersList = document.getElementById('orders-list');
    if (userData.orders && userData.orders.length > 0) {
        ordersList.innerHTML = userData.orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <h3>Order #${order.id}</h3>
                    <span class="order-date">${new Date(order.date).toLocaleDateString()}</span>
                </div>
                <div class="order-details">
                    <p>Total: $${order.total.toFixed(2)}</p>
                    <p>Status: ${order.status}</p>
                </div>
            </div>
        `).join('');
    } else {
        ordersList.innerHTML = '<p>No orders yet</p>';
    }
}

// Load addresses
function loadAddresses() {
    const addressesList = document.getElementById('addresses-list');
    if (userData.addresses && userData.addresses.length > 0) {
        addressesList.innerHTML = userData.addresses.map((address, index) => `
            <div class="address-item">
                <p>${address.street}</p>
                <p>${address.city}, ${address.state} ${address.zip}</p>
                <button onclick="removeAddress(${index})" class="remove-btn">Remove</button>
            </div>
        `).join('');
    } else {
        addressesList.innerHTML = '<p>No saved addresses</p>';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Profile form submission
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateProfile();
    });

    // Add address button
    document.getElementById('add-address-btn').addEventListener('click', () => {
        showAddAddressForm();
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        window.auth.logout();
    });
}

// Update profile
function updateProfile() {
    const fullName = document.getElementById('fullName').value;
    
    // Update in users array
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].fullName = fullName;
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Update current session
    const updatedSession = { ...currentUser, fullName };
    localStorage.setItem('currentUser', JSON.stringify(updatedSession));

    alert('Profile updated successfully');
}

// Show add address form
function showAddAddressForm() {
    const form = document.createElement('div');
    form.innerHTML = `
        <div class="modal">
            <div class="modal-content">
                <h2>Add New Address</h2>
                <form id="address-form">
                    <div class="form-group">
                        <input type="text" id="street" required placeholder="Street Address">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" id="city" required placeholder="City">
                        </div>
                        <div class="form-group">
                            <input type="text" id="state" required placeholder="State">
                        </div>
                        <div class="form-group">
                            <input type="text" id="zip" required placeholder="ZIP Code">
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="submit" class="save-btn">Save Address</button>
                        <button type="button" onclick="closeAddressForm()" class="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(form);

    document.getElementById('address-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewAddress();
    });
}

// Add new address
function addNewAddress() {
    const address = {
        street: document.getElementById('street').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zip: document.getElementById('zip').value
    };

    // Update in users array
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!users[userIndex].addresses) {
            users[userIndex].addresses = [];
        }
        users[userIndex].addresses.push(address);
        localStorage.setItem('users', JSON.stringify(users));
    }

    closeAddressForm();
    loadAddresses();
}

// Close address form
function closeAddressForm() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.parentElement.remove();
    }
}

// Remove address
function removeAddress(index) {
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].addresses.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        loadAddresses();
    }
}