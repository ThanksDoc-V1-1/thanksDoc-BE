#!/usr/bin/env node

const axios = require('axios');

async function checkDoctorData() {
  try {
    const response = await axios.get('http://localhost:1337/api/doctors');
    const doctors = response.data.data;
    
    console.log('Doctor Data Analysis:');
    console.log('====================');
    
    doctors.forEach((doctor, index) => {
      console.log(`\nDoctor ${index + 1}:`);
      console.log(`- ID: ${doctor.id}`);
      console.log(`- name: "${doctor.name}"`);
      console.log(`- firstName: "${doctor.firstName}"`);
      console.log(`- lastName: "${doctor.lastName}"`);
      console.log(`- phone: "${doctor.phone}"`);
      console.log(`- Full name computed: "${doctor.firstName || ''} ${doctor.lastName || ''}".trim()`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDoctorData();
