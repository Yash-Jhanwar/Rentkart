require('dotenv').config();
const mongoose = require('mongoose');
const Tool = require('./models/Tool');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Bengaluru area coordinates
const seedTools = [
    // Within 3.2 km of MG Road (12.9716, 77.5946)
    {
        name: 'Power Drill Bosch',
        description: 'Professional 13mm power drill',
        price: 250,
        deposit: 500,
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        sellerId: 'demo-seller-1',
        category: 'Power Tools',
        subcategory: 'Drills'
    },
    {
        name: 'Angle Grinder',
        description: '4 inch angle grinder with discs',
        price: 300,
        deposit: 600,
        location: { type: 'Point', coordinates: [77.6000, 12.9800] },
        sellerId: 'demo-seller-2',
        category: 'Power Tools',
        subcategory: 'Grinders'
    },
    {
        name: 'Electric Lawn Mower',
        description: '1600W lawn mower',
        price: 450,
        deposit: 1000,
        location: { type: 'Point', coordinates: [77.5850, 12.9650] },
        sellerId: 'demo-seller-3',
        category: 'Garden Tools',
        subcategory: 'Lawn Mowers'
    },
    {
        name: 'Pressure Washer',
        description: '1500 PSI pressure washer',
        price: 400,
        deposit: 800,
        location: { type: 'Point', coordinates: [77.6100, 12.9750] },
        sellerId: 'demo-seller-1',
        category: 'Cleaning',
        subcategory: 'Pressure Washers'
    },
    {
        name: 'Circular Saw',
        description: '7-1/4 inch circular saw',
        price: 350,
        deposit: 700,
        location: { type: 'Point', coordinates: [77.5800, 12.9850] },
        sellerId: 'demo-seller-4',
        category: 'Power Tools',
        subcategory: 'Saws'
    },
    // Outside 3.2 km
    {
        name: 'Concrete Mixer',
        description: 'Portable concrete mixer',
        price: 800,
        deposit: 2000,
        location: { type: 'Point', coordinates: [77.7000, 13.0000] },
        sellerId: 'demo-seller-5',
        category: 'Construction',
        subcategory: 'Mixers'
    },
    {
        name: 'Scaffolding Set',
        description: '6ft scaffolding with wheels',
        price: 600,
        deposit: 1500,
        location: { type: 'Point', coordinates: [77.5000, 12.9000] },
        sellerId: 'demo-seller-6',
        category: 'Construction',
        subcategory: 'Scaffolding'
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('Clearing existing tools...');
        await Tool.deleteMany({});
        console.log('Inserting seed data...');
        const inserted = await Tool.insertMany(seedTools);
        console.log(`✅ Seeded ${inserted.length} tools`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedDatabase();
