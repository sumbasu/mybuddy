export const INDIAN_CITIES = [
  // Metro & Tier 1
  'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Surat', 'Jaipur',

  // Tier 2
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Vadodara', 'Patna', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad',
  'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah',
  'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
  'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli',

  // Tier 3 & Growing cities
  'Mysuru', 'Tiruchirappalli', 'Bareilly', 'Aligarh', 'Moradabad',
  'Jalandhar', 'Bhubaneswar', 'Salem', 'Warangal', 'Guntur',
  'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati',
  'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad',
  'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur',
  'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer',
  'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni',
  'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli',
  'Mangaluru', 'Erode', 'Belgaum', 'Ambattur', 'Tiruppur',
  'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala',
  'Davanagere', 'Kozhikode', 'Kurnool', 'Tirunelveli', 'Thiruvananthapuram',
  'Gurgaon', 'Faridabad', 'Prayagraj', 'Jalandhar', 'Agra',
  'Thrissur', 'Panaji', 'Imphal', 'Shillong', 'Aizawl',
  'Kohima', 'Itanagar', 'Gangtok', 'Shimla', 'Dharamshala',
  'Pondicherry', 'Port Blair',
].sort();

export function searchCities(query: string): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(q)).slice(0, 8);
}

export function isValidCity(name: string): boolean {
  return INDIAN_CITIES.some(c => c.toLowerCase() === name.toLowerCase());
}
