// tests/frontend/unit/auth.test.js
const auth = require('../../../frontend/src/js/auth');

describe('Auth Module', () => {
    test('should validate email correctly', () => {
        expect(auth.validateEmail('test@example.com')).toBe(true);
        expect(auth.validateEmail('invalid-email')).toBe(false);
    });
});