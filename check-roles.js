const path = require('path');
const fs = require('fs');

async function checkRoles() {
  try {
    // Try to connect to the SQLite database directly
    const sqlite3 = require('better-sqlite3');
    const dbPath = path.join(process.cwd(), '.tmp', 'data.db');

    console.log('🔍 Looking for database at:', dbPath);

    if (fs.existsSync(dbPath)) {
      const db = sqlite3(dbPath, { readonly: true });
      
      // Get table names first
      console.log('\n📋 Available tables:');
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
      
      const relevantTables = [];
      const allTables = [];
      
      tables.forEach(table => {
        allTables.push(table.name);
        if (table.name.includes('role') || table.name.includes('permission') || table.name.includes('user')) {
          console.log('  🎯', table.name);
          relevantTables.push(table.name);
        } else {
          console.log('    ', table.name);
        }
      });
      
      // Check for users-permissions related tables
      const upTables = allTables.filter(name => name.includes('up_') || name.includes('users_permissions'));
      
      console.log('\n🔑 Users-permissions tables:', upTables);
      
      if (upTables.length > 0) {
        upTables.forEach(tableName => {
          console.log(`\n📊 Table: ${tableName}`);
          try {
            const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 10`).all();
            console.log(`   Rows: ${rows.length}`);
            if (rows.length > 0) {
              console.log('   Data:', JSON.stringify(rows, null, 2));
            }
          } catch (e) {
            console.log('   Error reading table:', e.message);
          }
        });
      }
      
      // Also check admin_users table if it exists
      if (allTables.includes('admin_users')) {
        console.log('\n👑 Admin Users:');
        try {
          const adminUsers = db.prepare('SELECT id, email, firstname, lastname FROM admin_users').all();
          console.log('   Data:', JSON.stringify(adminUsers, null, 2));
        } catch (e) {
          console.log('   Error:', e.message);
        }
      }
      
      db.close();
    } else {
      console.log('❌ Database file not found at:', dbPath);
      
      // Check if .tmp directory exists
      const tmpDir = path.join(process.cwd(), '.tmp');
      if (fs.existsSync(tmpDir)) {
        console.log('📁 Contents of .tmp directory:');
        const files = fs.readdirSync(tmpDir);
        files.forEach(file => console.log('  ', file));
      } else {
        console.log('❌ .tmp directory not found');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRoles();
