const mysql = require('mysql2/promise');

async function testRailwayDatabaseConnection() {
  console.log('🔍 Testing Database Connection from Railway Environment...');
  console.log('=========================================================');

  const config = {
    host: process.env.DATABASE_HOST || 'thanksdoc-database.cficuyqmk69u.eu-north-1.rds.amazonaws.com',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USERNAME || 'admin',
    password: process.env.DATABASE_PASSWORD || 'ThanksDoc2025#',
    database: process.env.DATABASE_NAME || 'thanksdocdb',
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  
  try {
    console.log('\n⏳ Attempting connection...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Connection successful!');
    
    // Test basic query
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', result[0]);
    
    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [config.database]);
    if (databases.length > 0) {
      console.log('✅ Target database exists');
    } else {
      console.log('⚠️  Target database does not exist, creating...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
      console.log('✅ Database created successfully');
    }
    
    await connection.end();
    console.log('\n🎉 Database connection test PASSED!');
    process.exit(0);
    
  } catch (error) {
    console.log('\n❌ Database connection FAILED!');
    console.log(`Error: ${error.message}`);
    console.log(`Error Code: ${error.code}`);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('1. Check RDS Security Group inbound rules');
      console.log('2. Allow connections from 0.0.0.0/0 on port 3306 (temporarily)');
      console.log('3. Ensure RDS instance is publicly accessible');
      console.log('4. Check VPC and subnet configuration');
    }
    
    process.exit(1);
  }
}

testRailwayDatabaseConnection();
