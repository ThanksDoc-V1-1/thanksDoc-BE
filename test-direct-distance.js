// Test the distance calculation directly with the fixed data structure
const { calculateDistance } = require('./src/utils/distance');

// Test with the actual production coordinates
const arafatCoords = { lat: 0.34, lng: 32.58 };
const kihihiCoords = { lat: 0.34, lng: 32.58 };

console.log('🔢 Testing Distance Calculation:');
console.log('Doctor (Arafat):', arafatCoords);
console.log('Business (KIHIHI):', kihihiCoords);

// Test the utility function
const distanceKm = calculateDistance(
  arafatCoords.lat, 
  arafatCoords.lng, 
  kihihiCoords.lat, 
  kihihiCoords.lng
);

console.log('Distance in KM:', distanceKm);

// Convert to miles like the email service does
const distanceMiles = distanceKm * 0.621371;
console.log('Distance in Miles:', distanceMiles);

// Apply the email service formatting logic
let formattedDistance;
if (distanceMiles < 0.1) {
  // Very close - show in feet
  const feet = Math.round(distanceMiles * 5280);
  formattedDistance = `${feet}ft`;
} else if (distanceMiles < 1) {
  // Less than a mile - show one decimal place
  formattedDistance = `${distanceMiles.toFixed(1)} miles`;
} else if (distanceMiles < 10) {
  // Less than 10 miles - show one decimal place
  formattedDistance = `${distanceMiles.toFixed(1)} miles`;
} else {
  // 10+ miles - round to nearest mile
  formattedDistance = `${Math.round(distanceMiles)} miles`;
}

console.log('📏 Formatted Distance:', formattedDistance);
console.log('✅ Expected result: Should show "0ft" or "Less than 500 feet" since coordinates are identical');
