// frontend/src/js/config.js
const config = {
    API_URL: process.env.NODE_ENV === 'production' 
        ? 'https://api.shopnow.com' 
        : 'http://localhost:5000/api',
    IMAGE_URL: process.env.NODE_ENV === 'production'
        ? 'https://cdn.shopnow.com'
        : 'http://localhost:5000'
};

export default config;