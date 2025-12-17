const express = require('express');
const router = express.Router();

// GET /api/products avec filtrage, recherche, tri et pagination
router.get('/', async (req, res) => {
try {
    const db = req.db;
    const collection = db.collection('products');
    
    // Extraction des paramètres
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const sortParam = req.query.sort;
    
    // Construction du filtre
    const filter = {};
    
    // Filtrage par catégorie
    if (category) {
    filter.category = category;
    }
    
    // Recherche par titre ou description
    if (search) {
    filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
    ];
    }
    
    // Construction du tri
    let sortOption = {};
    if (sortParam) {
    const order = sortParam.startsWith('-') ? -1 : 1;
    const field = sortParam.startsWith('-') ? sortParam.slice(1) : sortParam;
    sortOption[field] = order;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Exécution des requêtes
    const products = await collection
    .find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .toArray();
    
    const total = await collection.countDocuments(filter);
    
    // Réponse
    res.json({
    products,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    }
    });
    
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

// GET /api/products/stats
router.get('/stats', async (req, res) => {
try {
    const db = req.db;
    const collection = db.collection('products');
    
    // Stats globales par catégorie
    const categoryStats = await collection.aggregate([
    {
        $group: {
        _id: '$category',
        totalProducts: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' }
        }
    },
    {
        $sort: { avgPrice: -1 }
    },
    {
        $project: {
        _id: 0,
        categoryName: '$_id',
        totalProducts: 1,
        averagePrice: { $round: ['$avgPrice', 2] },
        maxPrice: 1,
        minPrice: 1
        }
    }
    ]).toArray();
    
    // Top 5 produits premium (rating > 4 et price > 500)
    const topPremiumProducts = await collection.aggregate([
    {
        $match: { price: { $gt: 500 } }
    },
    {
        $sort: { rating: -1 }
    },
    {
        $limit: 5
    },
    {
        $project: {
        _id: 0,
        title: 1,
        price: 1,
        rating: 1
        }
    }
    ]).toArray();
    
    // Stats par marque (stock et valeur)
    const brandStats = await collection.aggregate([
    {
        $group: {
        _id: '$brand',
        totalStock: { $sum: '$stock' },
        totalValue: { 
            $sum: { $multiply: ['$price', '$stock'] }
        },
        productCount: { $sum: 1 }
        }
    },
    {
        $sort: { totalValue: -1 }
    },
    {
        $project: {
        _id: 0,
        brand: '$_id',
        totalStock: 1,
        totalValue: { $round: ['$totalValue', 2] },
        productCount: 1
        }
    }
    ]).toArray();
    
    res.json({
    categoryStats,
    topPremiumProducts,
    brandStats
    });
    
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

module.exports = router;
