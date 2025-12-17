require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

// Middleware
app.use(express.json());

// Connexion MongoDB
async function connectDB() {
try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log('✅ Connecté à MongoDB');
} catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
}
}

// Middleware pour rendre db accessible
app.use((req, res, next) => {
req.db = db;
next();
});

// Routes
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

// Démarrage du serveur
connectDB().then(() => {
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
});

// Gestion de fermeture propre
process.on('SIGINT', async () => {
await client.close();
console.log('👋 Déconnexion MongoDB');
process.exit(0);
});