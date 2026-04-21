require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const toolRoutes = require('./routes/tools');

const app = express();

// CORS - allow frontend requests
const corsOptions = {
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes
app.use('/', toolRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
});

// Root
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Tool Rental API',
        endpoints: {
            addTool: { method: 'POST', path: '/add-tool', body: '{name, price, lat, lon, sellerId}' },
            nearbyTools: { method: 'GET', path: '/nearby-tools?lat=XX&lon=YY' },
            allTools: { method: 'GET', path: '/tools' }
        }
    });
});

// Error handlers
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`   POST http://localhost:${PORT}/add-tool`);
        console.log(`   GET  http://localhost:${PORT}/nearby-tools?lat=19.0760&lon=72.8777\n`);
    });
};

startServer();
