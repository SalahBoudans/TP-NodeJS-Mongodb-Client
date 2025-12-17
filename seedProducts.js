require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

async function seedProducts() {
  const client = new MongoClient(uri);
  
  try {
    // Connexion
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('products');
    
    // Récupération des données
    console.log('📥 Récupération des produits depuis dummyjson.com...');
    const response = await fetch('https://dummyjson.com/products?limit=100');
    const data = await response.json();
    
    // Suppression de la collection existante
    await collection.drop().catch(() => {
      console.log('Collection n\'existe pas encore');
    });
    
    // Insertion des produits
    const result = await collection.insertMany(data.products);
    console.log(`✅ ${result.insertedCount} produits insérés`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('👋 Déconnexion MongoDB');
  }
}

seedProducts();