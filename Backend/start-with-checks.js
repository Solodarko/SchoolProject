require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Pre-startup System Check');
console.log('============================');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   - PORT: ${process.env.PORT || 'NOT SET'}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`   - MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`   - FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);

// Check required dependencies
console.log('\n📦 Checking Required Dependencies:');
const requiredPackages = [
  'express', 'mongoose', 'cors', 'dotenv', 'jsonwebtoken', 
  'bcryptjs', 'axios', 'socket.io', 'qrcode', 'multer'
];

let missingPackages = [];
for (const pkg of requiredPackages) {
  try {
    require(pkg);
    console.log(`   ✅ ${pkg}`);
  } catch (error) {
    console.log(`   ❌ ${pkg} - MISSING`);
    missingPackages.push(pkg);
  }
}

if (missingPackages.length > 0) {
  console.log(`\n❌ Missing packages: ${missingPackages.join(', ')}`);
  console.log(`Run: npm install ${missingPackages.join(' ')}`);
  process.exit(1);
}

// Test database connection
console.log('\n🗄️  Testing Database Connection:');
async function testDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('   - Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('   ✅ Database connection successful');
    await mongoose.connection.close();
    console.log('   - Connection closed');
    
    // Start the actual server
    console.log('\n🚀 All checks passed! Starting server...');
    console.log('============================\n');
    require('./server.js');
    
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if MongoDB is running (if using local MongoDB)');
    console.log('   2. Verify MONGODB_URI in .env file');
    console.log('   3. Check network connectivity');
    console.log('   4. For MongoDB Atlas: Check IP whitelist');
    
    process.exit(1);
  }
}

testDatabase();
