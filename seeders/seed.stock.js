// scripts/seedStocks.js
require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('../models/Stock');

const seedData = [
  { symbol: 'AAPL', price: 195.35 },
  { symbol: 'GOOG', price: 132.75 },
  { symbol: 'MSFT', price: 110.90 },
  { symbol: 'AMZN', price: 140.20 },
  { symbol: 'TSLA', price: 230.50 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté');

    for (const { symbol, price } of seedData) {
      // upsert pour créer ou mettre à jour
      await Stock.findOneAndUpdate(
        { symbol },
        {
          symbol,
          price,
          lastUpdated: new Date(),
          likes: []        // reset des likes
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      console.log(`– Seeded ${symbol} à ${price}`);
    }

    console.log('🎉 Seed terminé');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur de seed :', err);
    process.exit(1);
  }
}

seed();
