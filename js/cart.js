// Check authentication
window.auth.requireAuth();

// Load cart from user session
let cart = window.auth.getCurrentUser().cart || [];

// Google Pay client configuration
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
};

const allowedCardNetworks = ["AMEX", "DISCOVER", "MASTERCARD", "VISA"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        'gateway': 'example',
        'gatewayMerchantId': 'exampleGatewayMerchantId'
    }
};

const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks
    }
};

const merchantInfo = {
    merchantName: 'ShopNow',
    merchantId: '12345678901234567890'
};

// Initialize Google Pay button
function initializeGooglePay() {
    const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST'
    });

    const isReadyToPayRequest = Object.assign({}, baseRequest);
    isReadyToPayRequest.allowedPaymentMethods = [baseCardPaymentMethod];

    paymentsClient.isReadyToPay(isReadyToPayRequest)
        .then(function(response) {
            if (response.result) {
                createAndAddButton(paymentsClient);
            }
        })
        .catch(function(err) {
            console.error(err);
        });
}

function createAndAddButton(paymentsClient) {
    const button = paymentsClient.createButton({
        onClick: onGooglePaymentButtonClicked
    });
    document.getElementById('google-pay-button').appendChild(button);
}

function getGooglePaymentDataRequest() {
    const total = calculateTotal();
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [baseCardPaymentMethod];
    paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'FINAL',
        totalPrice: total.toString(),
        currencyCode: 'USD',
        countryCode: 'US'
    };
    paymentDataRequest.merchantInfo = merchantInfo;
    return paymentDataRequest;
}

function onGooglePaymentButtonClicked() {
    const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST'
    });
    const paymentDataRequest = getGooglePaymentDataRequest();
    paymentsClient.loadPaymentData(paymentDataRequest)
        .then(function(paymentData) {
            processPayment(paymentData);
        })
        .catch(function(err) {
            console.error(err);
        });
}

// Process payment
function processPayment(paymentData) {
    const currentUser = window.auth.getCurrentUser();
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
        // Create order record
        const order = {
            id: Date.now().toString(),
            items: cart,
            total: calculateTotal(),
            date: new Date(),
            status: 'Pending',
            payment: paymentData
        };

        // Add order to user's history
        if (!users[userIndex].orders) {
            users[userIndex].orders = [];
        }
        users[userIndex].orders.push(order);

        // Clear cart
        users[userIndex].cart = [];
        localStorage.setItem('users', JSON.stringify(users));
        window.auth.updateUserCart([]);

        // Redirect to success page
        window.location.href = 'order-success.html';
    }
}

// Display cart items
function displayCart() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <div>
                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('');

    updateTotal();
}

// Update item quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        window.auth.updateUserCart(cart);
        displayCart();
    }
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    window.auth.updateUserCart(cart);
    displayCart();
}

// Calculate total
function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Update total display
function updateTotal() {
    const total = calculateTotal();
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

// Setup event listeners
function setupEventListeners() {
    document.querySelector('.checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        window.open('checkout.html', '_blank');
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    initializeGooglePay();
    setupEventListeners();
});