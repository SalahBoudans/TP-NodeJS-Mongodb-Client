# TP Node.js MongoDB Client - Rapport Technique

**Réalisé par** : BOUDANS SALAH EDDINE  
**Classe** : CCN-2  
**Repository GitHub** : [https://github.com/SalahBoudans/TP-NodeJS-Mongodb-Client]

---

## Table des Matières

1. [Introduction](#introduction)
2. [Phase 1 : Initialisation du Projet et Connexion](#phase-1--initialisation-du-projet-et-connexion)
3. [Phase 2 : Routes REST Avancées](#phase-2--routes-rest-avancées)
4. [Phase 3 : Agrégations MongoDB](#phase-3--agrégations-mongodb)
5. [Tests et Résultats](#tests-et-résultats)

---

## Introduction

Ce travail pratique consiste à développer une **API REST complète** pour la gestion de produits en utilisant :
- **Node.js** : Environnement d'exécution JavaScript
- **Express.js** : Framework web minimaliste
- **MongoDB** : Base de données NoSQL orientée documents
- **dotenv** : Gestion des variables d'environnement

### Objectifs Pédagogiques

- Maîtriser la connexion à MongoDB avec MongoClient
- Créer des routes REST avec Express.js
- Implémenter la pagination, le filtrage, la recherche et le tri
- Utiliser le framework d'agrégation MongoDB
- Gérer l'asynchronisme avec async/await

---

## Phase 1 : Initialisation du Projet et Connexion

### 1.1 Configuration du Projet

#### Étape 1 : Initialisation

```bash
# Créer le dossier du projet
mkdir tp-mongodb-api
cd tp-mongodb-api

# Initialiser npm avec les valeurs par défaut
npm init -y
```

#### Étape 2 : Installation des dépendances

```bash
# Dépendances principales
npm install express mongodb dotenv

# Dépendance de développement
npm install -D nodemon
```

**Résultat `package.json`** :

```json
{
  "name": "tp-mongodb-api",
  "version": "1.0.0",
  "description": "API REST Node.js/Express/MongoDB pour la Gestion de Produits",
  "main": "server.js",
  "scripts": {
    "start": "nodemon server.js",
    "seed": "node seedProducts.js",
    "test": "node testConnection.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongodb": "^6.3.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 1.2 Configuration de la Connexion MongoDB

#### Fichier `.env`

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=tp_products_db

# Server Configuration
PORT=3000
```

#### Fichier `db.js` - Module de Connexion

```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let client;
let db;

/**
 * Fonction pour établir la connexion à MongoDB
 * @returns {Promise<Db>} Instance de la base de données
 */
async function connectDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`Connecté à MongoDB: ${dbName}`);
    return db;
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Récupérer l'instance de la base de données
 * @returns {Db} Instance de la base de données
 */
function getDB() {
  if (!db) {
    throw new Error('La base de données n\'est pas initialisée. Appelez connectDB() d\'abord.');
  }
  return db;
}

/**
 * Récupérer le client MongoDB
 * @returns {MongoClient} Client MongoDB
 */
function getClient() {
  return client;
}

module.exports = { connectDB, getDB, getClient };
```

**Explications** :
- Utilisation du pattern Singleton pour gérer une seule connexion
- Export de fonctions pour accéder à la DB depuis n'importe où
- Gestion des erreurs avec try/catch

### 1.3 Serveur Express Principal

#### Fichier `server.js`

```javascript
const express = require('express');
const { connectDB } = require('./db');
const productsRouter = require('./routes/products');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', productsRouter);

// Route de test racine
app.get('/', (req, res) => {
  res.json({
    message: 'API REST Node.js/Express/MongoDB - Gestion de Produits',
    endpoints: {
      products: {
        list: 'GET /api/products?page=1&limit=10&category=smartphones&search=iphone&sort=price',
        stats: 'GET /api/products/stats'
      }
    }
  });
});

/**
 * Fonction pour démarrer le serveur
 */
async function startServer() {
  try {
    // Connexion à MongoDB
    await connectDB();
    
    // Démarrage du serveur Express
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();
```

**Points Clés** :
- Connexion à MongoDB avant de démarrer Express
- Middleware pour parser JSON
- Gestion des erreurs au démarrage

### 1.4 Script de Seeding

#### Fichier `seedProducts.js`

```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

/**
 * Script asynchrone pour remplir la base de données
 */
async function seedProducts() {
  let client;
  
  try {
    console.log('Démarrage du seeding...');
    
    // 1. Connexion à MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connecté à MongoDB');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    // 2. Récupération des données depuis l'API DummyJSON
    console.log('Récupération des produits depuis https://dummyjson.com/products...');
    const response = await fetch('https://dummyjson.com/products?limit=100');
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    const products = data.products;
    
    console.log(`${products.length} produits récupérés`);
    
    // 3. Suppression de la collection existante (seed propre)
    console.log('Suppression de la collection products existante...');
    await productsCollection.drop().catch(() => {
      console.log('Collection products n\'existe pas encore (première exécution)');
    });
    
    // 4. Insertion des nouveaux produits avec insertMany
    console.log('Insertion des produits dans MongoDB...');
    const result = await productsCollection.insertMany(products);
    
    console.log(`${result.insertedCount} produits insérés avec succès!`);
    console.log('Seeding terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nMongoDB n\'est pas accessible.');
      console.error('Exécutez "npm run test" pour diagnostiquer le problème');
      console.error('Consultez SETUP_MONGODB.md pour configurer MongoDB');
    }
    
    process.exit(1);
  } finally {
    // 5. Déconnexion du client MongoDB
    if (client) {
      await client.close();
      console.log('Déconnexion de MongoDB');
    }
  }
}

// Exécution du script
seedProducts();
```

**Explications** :
- Utilisation de `fetch` (natif dans Node.js 18+) pour récupérer les données
- `insertMany()` pour insérer tous les produits en une seule opération
- Gestion du cycle de vie : connexion → traitement → déconnexion
- Gestion d'erreurs spécifique pour MongoDB non disponible

**Exécution** :

```bash
npm run seed
```

**Sortie attendue** :

```
Démarrage du seeding...
Connecté à MongoDB
Récupération des produits depuis https://dummyjson.com/products...
100 produits récupérés
Suppression de la collection products existante...
Insertion des produits dans MongoDB...
100 produits insérés avec succès!
Seeding terminé!
Déconnexion de MongoDB
```

---

## Phase 2 : Routes REST Avancées

### 2.1 Objectif de la Route `/api/products`

Créer un endpoint qui supporte :
- **Pagination** : `?page=2&limit=10`
- **Filtrage** : `?category=smartphones`
- **Recherche** : `?search=iphone`
- **Tri** : `?sort=price` ou `?sort=-price`

**Exemple de requête complète** :
```
GET /api/products?page=2&limit=10&category=smartphones&search=iphone&sort=price
```

### 2.2 Implémentation Complète

#### Fichier `routes/products.js`

```javascript
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

/**
 * GET /api/products
 * Route de récupération des produits avec fonctionnalités avancées
 */
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection('products');
    
    // 1. EXTRACTION DES PARAMÈTRES DE REQUÊTE
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const sort = req.query.sort;
    
    // 2. CONSTRUCTION DU FILTRE MONGODB
    const filter = {};
    
    // Filtrage par catégorie
    if (category) {
      filter.category = category;
    }
    
    // Recherche par titre ou description (insensible à la casse)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 3. CONSTRUCTION DU TRI
    let sortOptions = {};
    if (sort) {
      // Si le paramètre commence par -, c'est un tri décroissant
      if (sort.startsWith('-')) {
        const field = sort.substring(1);
        sortOptions[field] = -1; // Décroissant
      } else {
        sortOptions[sort] = 1; // Croissant
      }
    }
    
    // 4. CALCUL DE LA PAGINATION
    // skip = nombre d'éléments à sauter
    const skip = (page - 1) * limit;
    
    // 5. EXÉCUTION DE LA REQUÊTE POUR LES PRODUITS
    const products = await productsCollection
      .find(filter)           // Applique le filtre
      .sort(sortOptions)      // Applique le tri
      .skip(skip)             // Saute les éléments précédents
      .limit(limit)           // Limite le nombre de résultats
      .toArray();             // Convertit en tableau
    
    // 6. CALCUL DU NOMBRE TOTAL DE DOCUMENTS
    // Nécessaire pour calculer le nombre total de pages
    const totalProducts = await productsCollection.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // 7. RÉPONSE COMPLÈTE AU FORMAT JSON
    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        limit: limit,
        totalProducts: totalProducts,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        category: category || 'all',
        search: search || 'none',
        sort: sort || 'default'
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des produits',
      error: error.message
    });
  }
});

module.exports = router;
```

### 2.3 Explications Détaillées

#### 2.3.1 Filtrage par Catégorie

```javascript
// Si category est présent dans la query
if (category) {
  filter.category = category;
}

// MongoDB Query équivalente :
// db.products.find({ category: "smartphones" })
```

#### 2.3.2 Recherche Textuelle avec Regex

```javascript
// Recherche insensible à la casse dans title ET description
if (search) {
  filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
}

// MongoDB Query équivalente :
// db.products.find({
//   $or: [
//     { title: { $regex: "iphone", $options: "i" } },
//     { description: { $regex: "iphone", $options: "i" } }
//   ]
// })
```

**Options du $regex** :
- `i` : insensible à la casse (case-insensitive)

#### 2.3.3 Tri Croissant/Décroissant

```javascript
// Gestion du préfixe - pour le tri décroissant
if (sort.startsWith('-')) {
  const field = sort.substring(1);  // Enlève le -
  sortOptions[field] = -1;          // Tri décroissant
} else {
  sortOptions[sort] = 1;            // Tri croissant
}

// Exemples :
// ?sort=price     → { price: 1 }   (croissant)
// ?sort=-price    → { price: -1 }  (décroissant)
// ?sort=rating    → { rating: 1 }  (croissant)
```

#### 2.3.4 Pagination

```javascript
// Formule de pagination
const skip = (page - 1) * limit;

// Exemples :
// Page 1, limit 10 : skip = (1 - 1) * 10 = 0   → éléments 0-9
// Page 2, limit 10 : skip = (2 - 1) * 10 = 10  → éléments 10-19
// Page 3, limit 10 : skip = (3 - 1) * 10 = 20  → éléments 20-29

// Application :
const products = await productsCollection
  .find(filter)
  .skip(skip)      // Saute les éléments précédents
  .limit(limit)    // Prend seulement 'limit' éléments
  .toArray();
```

### 2.4 Exemples de Requêtes et Résultats

#### Exemple 1 : Liste Simple (Page 1, 10 éléments)

**Requête** :
```bash
curl http://localhost:3000/api/products
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "iPhone 9",
      "description": "An apple mobile which is nothing like apple",
      "price": 549,
      "discountPercentage": 12.96,
      "rating": 4.69,
      "stock": 94,
      "brand": "Apple",
      "category": "smartphones"
    }
    // ... 9 autres produits
  ],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalProducts": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "category": "all",
    "search": "none",
    "sort": "default"
  }
}
```

#### Exemple 2 : Filtrage par Catégorie

**Requête** :
```bash
curl "http://localhost:3000/api/products?category=smartphones"
```

**Résultat** : Seulement les produits de la catégorie "smartphones"

#### Exemple 3 : Recherche avec Tri

**Requête** :
```bash
curl "http://localhost:3000/api/products?search=apple&sort=price"
```

**Résultat** : Produits contenant "apple" triés par prix croissant

#### Exemple 4 : Requête Complète

**Requête** :
```bash
curl "http://localhost:3000/api/products?page=2&limit=5&category=smartphones&search=samsung&sort=-price"
```

**Résultat** :
- Page 2
- 5 produits par page
- Catégorie : smartphones
- Contenant "samsung"
- Triés par prix décroissant

---

## Phase 3 : Agrégations MongoDB

### 3.1 Objectif de l'Endpoint `/api/products/stats`

Créer un endpoint qui utilise le **pipeline d'agrégation MongoDB** pour calculer des statistiques avancées.

### 3.2 Exercice 6.1 - Statistiques par Catégorie

#### Objectif
Pour chaque catégorie, calculer :
- Nombre total de produits
- Prix moyen
- Prix maximum
- Prix minimum

#### Code

```javascript
router.get('/stats', async (req, res) => {
  try {
    const db = getDB();
    const productsCollection = db.collection('products');
    
    // EXERCICE 6.1 : Statistiques globales par catégorie
    const categoryStats = await productsCollection.aggregate([
      {
        // STAGE 1 : $group - Regroupement par catégorie
        $group: {
          _id: '$category',                    // Grouper par category
          totalProducts: { $sum: 1 },          // Compter les produits
          avgPrice: { $avg: '$price' },        // Prix moyen
          maxPrice: { $max: '$price' },        // Prix maximum
          minPrice: { $min: '$price' }         // Prix minimum
        }
      },
      {
        // STAGE 2 : $sort - Trier par prix moyen décroissant
        $sort: { avgPrice: -1 }
      },
      {
        // STAGE 3 : $project - Renommer et formater les champs
        $project: {
          _id: 0,                                      // Masquer _id
          categoryName: '$_id',                        // Renommer _id
          totalProducts: 1,                            // Garder tel quel
          averagePrice: { $round: ['$avgPrice', 2] },  // Arrondir à 2 décimales
          maxPrice: 1,
          minPrice: 1
        }
      }
    ]).toArray();
    
    // ... (suite dans le code complet)
  }
});
```

#### Pipeline d'Agrégation Expliqué

```javascript
// ÉTAPE 1 : $group
{
  $group: {
    _id: '$category',           // Clé de regroupement
    totalProducts: { $sum: 1 }, // Accumulateur : compte +1 pour chaque doc
    avgPrice: { $avg: '$price' } // Accumulateur : moyenne des prix
  }
}

// Résultat intermédiaire :
[
  { _id: 'smartphones', totalProducts: 15, avgPrice: 599.33 },
  { _id: 'laptops', totalProducts: 8, avgPrice: 1299.50 },
  // ...
]

// ÉTAPE 2 : $sort
{ $sort: { avgPrice: -1 } }  // Tri décroissant par avgPrice

// ÉTAPE 3 : $project
{
  $project: {
    _id: 0,                                      // Exclure _id
    categoryName: '$_id',                        // _id devient categoryName
    averagePrice: { $round: ['$avgPrice', 2] }  // Arrondir
  }
}

// Résultat final :
[
  { categoryName: 'laptops', totalProducts: 8, averagePrice: 1299.50 },
  { categoryName: 'smartphones', totalProducts: 15, averagePrice: 599.33 }
]
```

### 3.3 Exercice 6.2 - Top Produits par Rating

#### Objectif
Trouver les 5 produits les mieux notés avec un prix > 500$

#### Code

```javascript
// EXERCICE 6.2 : Top 5 produits les mieux notés avec prix > 500$
const topRatedExpensiveProducts = await productsCollection.aggregate([
  {
    // STAGE 1 : $match - Filtrer les produits prix > 500
    $match: { price: { $gt: 500 } }
  },
  {
    // STAGE 2 : $sort - Trier par rating décroissant
    $sort: { rating: -1 }
  },
  {
    // STAGE 3 : $limit - Garder seulement les 5 premiers
    $limit: 5
  },
  {
    // STAGE 4 : $project - Sélectionner seulement certains champs
    $project: {
      _id: 0,
      title: 1,
      price: 1,
      rating: 1
    }
  }
]).toArray();
```

#### Explications

```javascript
// $match : Équivalent à WHERE en SQL
{ $match: { price: { $gt: 500 } } }
// → Garde seulement les documents où price > 500

// $sort : Tri
{ $sort: { rating: -1 } }
// → Trie par rating décroissant (-1)

// $limit : Limite le nombre de résultats
{ $limit: 5 }
// → Garde seulement les 5 premiers documents

// Résultat :
[
  { title: "iPhone 14 Pro Max", price: 1299, rating: 4.95 },
  { title: "MacBook Pro 16", price: 2499, rating: 4.92 },
  { title: "Samsung Galaxy S23", price: 999, rating: 4.88 },
  // ... (2 autres)
]
```

### 3.4 Exercice 6.3 - Statistiques par Marque

#### Objectif
Pour chaque marque, calculer :
- Stock total
- Valeur totale du stock (prix × stock)
- Nombre de produits

#### Code

```javascript
// EXERCICE 6.3 : Statistiques par marque (stock total et valeur totale)
const brandStats = await productsCollection.aggregate([
  {
    // STAGE 1 : $group - Regrouper par brand
    $group: {
      _id: '$brand',
      totalStock: { $sum: '$stock' },  // Somme des stocks
      
      // Calcul de la valeur totale : price * stock pour chaque produit
      totalValue: { 
        $sum: { $multiply: ['$price', '$stock'] }  // Opérateur $multiply
      },
      
      productCount: { $sum: 1 }  // Nombre de produits
    }
  },
  {
    // STAGE 2 : $sort - Trier par valeur totale décroissante
    $sort: { totalValue: -1 }
  },
  {
    // STAGE 3 : $project - Formater et calculer des champs dérivés
    $project: {
      _id: 0,
      brandName: '$_id',
      totalStock: 1,
      totalValue: { $round: ['$totalValue', 2] },
      productCount: 1,
      
      // Calcul de la valeur moyenne par produit
      avgValuePerProduct: {
        $round: [{ $divide: ['$totalValue', '$productCount'] }, 2]
      }
    }
  }
]).toArray();
```

#### Explications Détaillées

```javascript
// Opérateur $multiply : Multiplication de deux champs
totalValue: { $sum: { $multiply: ['$price', '$stock'] } }

// Exemple de calcul :
// Produit 1 : price = 1000, stock = 50 → valeur = 50000
// Produit 2 : price = 500, stock = 30  → valeur = 15000
// Total pour la marque : 65000

// Opérateur $divide : Division
avgValuePerProduct: { $divide: ['$totalValue', '$productCount'] }

// Si totalValue = 65000 et productCount = 2
// → avgValuePerProduct = 32500
```

### 3.5 Statistiques Globales (Bonus)

```javascript
// Statistiques globales additionnelles
const globalStats = await productsCollection.aggregate([
  {
    $group: {
      _id: null,  // null = tout regrouper ensemble
      totalProducts: { $sum: 1 },
      totalStock: { $sum: '$stock' },
      avgPrice: { $avg: '$price' },
      avgRating: { $avg: '$rating' },
      totalInventoryValue: { 
        $sum: { $multiply: ['$price', '$stock'] } 
      }
    }
  },
  {
    $project: {
      _id: 0,
      totalProducts: 1,
      totalStock: 1,
      averagePrice: { $round: ['$avgPrice', 2] },
      averageRating: { $round: ['$avgRating', 2] },
      totalInventoryValue: { $round: ['$totalInventoryValue', 2] }
    }
  }
]).toArray();
```

### 3.6 Réponse Complète de l'Endpoint

```javascript
// Réponse finale avec toutes les statistiques
res.json({
  success: true,
  stats: {
    global: globalStats[0] || {},
    byCategory: categoryStats,
    topRatedExpensive: topRatedExpensiveProducts,
    byBrand: brandStats
  }
});
```

#### Exemple de Réponse JSON

```json
{
  "success": true,
  "stats": {
    "global": {
      "totalProducts": 100,
      "totalStock": 5432,
      "averagePrice": 567.89,
      "averageRating": 4.35,
      "totalInventoryValue": 3084567.50
    },
    "byCategory": [
      {
        "categoryName": "laptops",
        "totalProducts": 8,
        "averagePrice": 1299.50,
        "maxPrice": 2499,
        "minPrice": 599
      },
      {
        "categoryName": "smartphones",
        "totalProducts": 15,
        "averagePrice": 599.33,
        "maxPrice": 1299,
        "minPrice": 199
      }
    ],
    "topRatedExpensive": [
      {
        "title": "MacBook Pro 16",
        "price": 2499,
        "rating": 4.92
      }
    ],
    "byBrand": [
      {
        "brandName": "Apple",
        "totalStock": 450,
        "totalValue": 562500.00,
        "productCount": 5,
        "avgValuePerProduct": 112500.00
      }
    ]
  }
}
```

---

## Tests et Résultats

### Test 1 : Liste des Produits

**Commande** :
```bash
curl http://localhost:3000/api/products
```

**Résultat** :
```json
{
  "success": true,
  "data": [ /* 10 produits */ ],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalProducts": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Test 2 : Filtrage par Catégorie

**Commande** :
```bash
curl "http://localhost:3000/api/products?category=smartphones"
```

**Résultat** : Liste filtrée des smartphones uniquement

### Test 3 : Recherche et Tri

**Commande** :
```bash
curl "http://localhost:3000/api/products?search=apple&sort=-price"
```

**Résultat** : Produits Apple triés du plus cher au moins cher

### Test 4 : Statistiques

**Commande** :
```bash
curl "http://localhost:3000/api/products/stats"
```

**Résultat** : Statistiques complètes (voir exemple JSON ci-dessus)

---

**Fin du Rapport**
