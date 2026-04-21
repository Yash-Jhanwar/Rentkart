const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tool name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    subcategory: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    deposit: {
        type: Number,
        default: 0,
        min: [0, 'Deposit cannot be negative']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required'],
            validate: {
                validator: function(coords) {
                    return coords.length === 2 &&
                           coords[0] >= -180 && coords[0] <= 180 &&
                           coords[1] >= -90 && coords[1] <= 90;
                },
                message: 'Invalid coordinates'
            }
        }
    },
    sellerId: {
        type: String,
        required: [true, 'Seller ID is required']
    },
    usageGuide: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// 2dsphere index for geospatial queries
toolSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Tool', toolSchema);
