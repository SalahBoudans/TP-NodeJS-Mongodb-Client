# TP Node.js MongoDB Client

## Description
This project is a RESTful API built with Node.js, Express.js, and MongoDB for managing products. It includes features such as pagination, filtering, searching, and sorting, as well as advanced MongoDB aggregation pipelines for generating statistics.

## Features
- **CRUD Operations**: Create, Read, Update, and Delete products.
- **Advanced Querying**: Pagination, filtering by category, searching by keywords, and sorting by fields.
- **Aggregation Pipelines**: Generate statistics such as average price, total stock, and top-rated products.
- **Seeding**: Populate the database with sample data from an external API.

## Technologies Used
- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for building RESTful APIs.
- **MongoDB**: NoSQL database for storing product data.
- **dotenv**: For managing environment variables.
- **nodemon**: Development tool for automatically restarting the server.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tp-mongodb-api.git
   cd tp-mongodb-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure it:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=tp_products_db
   PORT=3000
   ```

4. Seed the database with sample data:
   ```bash
   npm run seed
   ```

## Usage
1. Start the server:
   ```bash
   npm start
   ```

2. Access the API at `http://localhost:3000`.

## API Endpoints
### Products
- **GET** `/api/products`
  - Query parameters: `page`, `limit`, `category`, `search`, `sort`
- **GET** `/api/products/stats`
  - Generate statistics using MongoDB aggregation pipelines.

## Example Requests
- List products with pagination:
  ```bash
  curl "http://localhost:3000/api/products?page=1&limit=10"
  ```
- Filter products by category:
  ```bash
  curl "http://localhost:3000/api/products?category=smartphones"
  ```
- Get product statistics:
  ```bash
  curl "http://localhost:3000/api/products/stats"
  ```

---

**Author**: BOUDANS SALAH EDDINE