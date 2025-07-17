import express from 'express';

const app = express();

// Test all routes
app.get('/test', (req, res) => {
    res.json({
        message: 'Server is working',
        routes: {
            auth: '/api/auth/*',
            users: '/api/users/*',
            messages: '/api/messages/*',
            uploads: '/uploads/*'
        }
    });
});

console.log('Available routes:');
console.log('POST /api/auth/login');
console.log('POST /api/auth/register');
console.log('GET  /api/auth/me');
console.log('POST /api/messages/send/:id');
console.log('GET  /api/messages/:id');
console.log('GET  /uploads/*');