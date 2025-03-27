// Load cart data from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Google Pay configuration
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    displayOrderSummary();
    initializeGooglePay();
    setupFormValidation();
});

// Display order summary
function displayOrderSummary() {
    const cartItemsContainer = document.querySelector('.cart-items-summary');
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    updateTotals();
}

// Update totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 5.00;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('shipping').textContent = shipping.toFixed(2);
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

// Initialize Google Pay
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
        onClick: onGooglePaymentButtonClicked,
        buttonColor: 'black'
    });
    document.getElementById('google-pay-button').appendChild(button);
}

// Handle Google Pay button click
function onGooglePaymentButtonClicked() {
    const total = parseFloat(document.getElementById('total-amount').textContent);
    const paymentDataRequest = getGooglePaymentDataRequest(total);
    const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST'
    });

    paymentsClient.loadPaymentData(paymentDataRequest)
        .then(function(paymentData) {
            processPayment(paymentData);
        })
        .catch(function(err) {
            console.error(err);
        });
}

function getGooglePaymentDataRequest(total) {
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [baseCardPaymentMethod];
    paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'FINAL',
        totalPrice: total.toString(),
        currencyCode: 'USD',
        countryCode: 'US'
    };
    paymentDataRequest.merchantInfo = {
        merchantName: 'ShopNow',
        merchantId: '12345678901234567890'
    };
    return paymentDataRequest;
}

// Form validation and submission
function setupFormValidation() {
    const form = document.getElementById('checkout-form');
    
    // Card number formatting
    const cardInput = document.getElementById('card-number');
    cardInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Expiry date formatting
    const expiryInput = document.getElementById('expiry');
    expiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0,2) + '/' + value.slice(2,4);
        }
        e.target.value = value;
    });

    // CVV validation
    const cvvInput = document.getElementById('cvv');
    cvvInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0,3);
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const orderData = {
            customer: {
                name: formData.get('full-name'),
                email: formData.get('email'),
                address: {
                    street: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zip: formData.get('zip')
                }
            },
            payment: {
                cardNumber: formData.get('card-number'),
                expiry: formData.get('expiry'),
                cvv: formData.get('cvv')
            },
            items: cart,
            total: parseFloat(document.getElementById('total-amount').textContent)
        };

        try {
            // Here you would typically send the order to your server
            console.log('Processing order:', orderData);
            
            // Simulate successful order processing
            await processOrder(orderData);
            
            // Clear cart and redirect to success page
            localStorage.removeItem('cart');
            window.location.href = 'order-success.html';
        } catch (error) {
            console.error('Order processing failed:', error);
            alert('There was an error processing your order. Please try again.');
        }
    });
}

// Simulate order processing
function processOrder(orderData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}

// Process payment (both Google Pay and regular card payment)
function processPayment(paymentData) {
    // Here you would typically send the payment data to your server
    console.log('Processing payment:', paymentData);
    
    // For demo purposes, we'll just show a success message
    localStorage.removeItem('cart');
    window.location.href = 'order-success.html';
}