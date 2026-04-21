const express = require('express');
const router = express.Router();
const Tool = require('../models/Tool');
const haversine = require('../utils/haversine');

// SEARCH_RADIUS_KM = 3.2 km (2 miles)
const SEARCH_RADIUS_KM = 3.2;

/**
 * POST /add-tool
 * Add a new tool to the database
 */
router.post('/add-tool', async (req, res) => {
    try {
        const { name, description, price, lat, lon, sellerId, category, subcategory, deposit, usageGuide } = req.body;
        
        console.log('\n📥 [API] POST /add-tool');
        console.log('   Seller ID:', sellerId);
        console.log('   Tool Name:', name);
        console.log('   Raw coords:', { lat, lon });

        // Validate required fields
        if (!name || !price || !lat || !lon || !sellerId) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, price, lat, lon, sellerId'
            });
        }

        // Validate coordinates
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        console.log('   Parsed coords:', { latitude, longitude });

        if (isNaN(latitude) || isNaN(longitude) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180) {
            console.log('   ❌ Invalid coordinates');
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        // Create new tool
        console.log('   💾 Saving to MongoDB...');
        const tool = await Tool.create({
            name,
            description: description || '',
            price: Number(price),
            deposit: Number(deposit) || 0,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            sellerId,
            category: category || '',
            subcategory: subcategory || '',
            usageGuide: usageGuide || ''
        });

        console.log('   ✅ Saved! Tool ID:', tool._id);
        console.log('   📍 Stored at:', tool.location.coordinates, '(GeoJSON: [lon, lat])');
        
        res.status(201).json({
            success: true,
            message: 'Tool listed successfully',
            tool: {
                id: tool._id,
                name: tool.name,
                price: tool.price,
                location: {
                    lat: tool.location.coordinates[1],
                    lon: tool.location.coordinates[0]
                }
            }
        });
    } catch (error) {
        console.error('❌ Error adding tool:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding tool',
            error: error.message
        });
    }
});

/**
 * GET /nearby-tools
 * Find tools within 3.2 km radius
 */
router.get('/nearby-tools', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        console.log('\n🔍 [API] GET /nearby-tools');
        console.log('   User location query:', { lat, lon });

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: 'lat and lon query parameters are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        console.log('   Parsed user location:', { latitude, longitude });

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        // Calculate bounding box (approximate)
        const deltaLat = SEARCH_RADIUS_KM / 111;
        const deltaLon = SEARCH_RADIUS_KM / (111 * Math.cos(latitude * Math.PI / 180));
        
        console.log('   Search radius:', SEARCH_RADIUS_KM, 'km');
        console.log('   Bounding box delta:', { deltaLat, deltaLon });

        // Find tools within bounding box using $geoWithin
        console.log('   🔎 Querying MongoDB...');
        const candidates = await Tool.find({
            location: {
                $geoWithin: {
                    $box: [
                        [longitude - deltaLon, latitude - deltaLat],
                        [longitude + deltaLon, latitude + deltaLat]
                    ]
                }
            }
        }).lean();

        console.log('   📊 Candidates from DB:', candidates.length);
        
        // Apply Haversine for precise distance
        const toolsWithDistance = candidates.map(tool => {
            const toolLat = tool.location.coordinates[1];
            const toolLon = tool.location.coordinates[0];
            const distance = haversine(latitude, longitude, toolLat, toolLon);
            
            console.log(`      ${tool.name}: tool@[${toolLat},${toolLon}] -> ${distance.toFixed(2)}km`);

            return {
                name: tool.name,
                distance: distance,
                price: tool.price
            };
        });

        // Filter by exact radius and sort
        const nearbyTools = toolsWithDistance
            .filter(tool => tool.distance <= SEARCH_RADIUS_KM)
            .sort((a, b) => a.distance - b.distance);
        
        console.log('   ✅ Within', SEARCH_RADIUS_KM, 'km:', nearbyTools.length, 'tools');
        nearbyTools.forEach(t => console.log(`      ${t.name}: ${t.distance.toFixed(2)}km`));

        res.json({
            success: true,
            count: nearbyTools.length,
            tools: nearbyTools
        });
    } catch (error) {
        console.error('❌ Error fetching nearby tools:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * GET /tools
 * Get all tools
 */
router.get('/tools', async (req, res) => {
    try {
        const tools = await Tool.find().select('name price location sellerId').lean();
        res.json({
            success: true,
            count: tools.length,
            tools: tools.map(t => ({
                name: t.name,
                price: t.price,
                lat: t.location.coordinates[1],
                lon: t.location.coordinates[0],
                sellerId: t.sellerId
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
