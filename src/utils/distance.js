/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Filter doctors by distance from business location
 * @param {Array} doctors - Array of doctor objects with latitude and longitude
 * @param {number} businessLat - Business latitude
 * @param {number} businessLng - Business longitude  
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Array} Filtered doctors within distance
 */
function filterDoctorsByDistance(doctors, businessLat, businessLng, maxDistance) {
  if (!businessLat || !businessLng || maxDistance === -1) {
    return doctors; // Return all doctors if no location or "anywhere" filter
  }

  return doctors.filter(doctor => {
    if (!doctor.latitude || !doctor.longitude) {
      return false; // Exclude doctors without location data
    }

    const distance = calculateDistance(
      businessLat,
      businessLng,
      parseFloat(doctor.latitude),
      parseFloat(doctor.longitude)
    );

    return distance <= maxDistance;
  });
}

module.exports = {
  calculateDistance,
  filterDoctorsByDistance
};
