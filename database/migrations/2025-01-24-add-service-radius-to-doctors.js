'use strict';

/**
 * Migration to add serviceRadius field to doctors table
 */

async function up(knex) {
  // Add serviceRadius column to doctors table with default value of 12 miles
  await knex.schema.table('doctors', (table) => {
    table.integer('service_radius').defaultTo(12).comment('Maximum distance in miles for receiving service requests');
  });
  
  console.log('✅ Added service_radius column to doctors table');
}

async function down(knex) {
  // Remove serviceRadius column from doctors table
  await knex.schema.table('doctors', (table) => {
    table.dropColumn('service_radius');
  });
  
  console.log('✅ Removed service_radius column from doctors table');
}

module.exports = { up, down };
