/**
 * Standardized Indian States and Districts Dataset
 * Used across Registration, Place Browsing, Place Reporting, and Admin Management
 */

export const INDIAN_LOCATIONS = {
  "Andhra Pradesh": [
    "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool",
    "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
  ],
  "Arunachal Pradesh": [
    "Changlang", "East Kameng", "East Siang", "Lohit", "Papum Pare", "Tawang", "Tirap", "West Kameng", "West Siang"
  ],
  "Assam": [
    "Cachar", "Dibrugarh", "Guwahati / Kamrup", "Jorhat", "Nagaon", "Silchar", "Sonitpur", "Tinsukia"
  ],
  "Bihar": [
    "Bhagalpur", "Darbhanga", "Gaya", "Muzaffarpur", "Patna", "Purnia", "Rohtas", "Vaishali"
  ],
  "Chhattisgarh": [
    "Bastar", "Bilaspur", "Durg", "Korba", "Raigarh", "Raipur", "Rajnandgaon"
  ],
  "Delhi": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
    "North West Delhi", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  "Goa": [
    "North Goa", "South Goa"
  ],
  "Gujarat": [
    "Ahmedabad", "Amreli", "Anand", "Bhavnagar", "Gandhinagar", "Jamnagar", "Junagadh",
    "Kutch", "Mehsana", "Rajkot", "Surat", "Vadodara", "Valsad"
  ],
  "Haryana": [
    "Ambala", "Faridabad", "Gurugram", "Hisar", "Karnal", "Panipat", "Rohtak", "Sonipat"
  ],
  "Himachal Pradesh": [
    "Kangra", "Kullu", "Mandi", "Shimla", "Solan", "Una"
  ],
  "Jharkhand": [
    "Bokaro", "Dhanbad", "East Singhbhum (Jamshedpur)", "Hazaribagh", "Ranchi"
  ],
  "Karnataka": [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar",
    "Dakshina Kannada (Mangaluru)", "Dharwad (Hubballi)", "Kalaburagi", "Mysuru", "Shivamogga", "Tumakuru", "Udupi"
  ],
  "Kerala": [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam",
    "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
    "Thiruvananthapuram", "Thrissur", "Wayanad"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Gwalior", "Indore", "Jabalpur", "Rewa", "Sagar", "Ujjain"
  ],
  "Maharashtra": [
    "Ahmednagar", "Aurangabad (Chhatrapati Sambhajinagar)", "Kolhapur", "Mumbai City",
    "Mumbai Suburban", "Nagpur", "Nashik", "Navi Mumbai", "Palghar", "Pune", "Solapur", "Thane"
  ],
  "Odisha": [
    "Balasore", "Berhampur", "Bhubaneswar / Khordha", "Cuttack", "Ganjam", "Puri", "Rourkela / Sundargarh", "Sambalpur"
  ],
  "Punjab": [
    "Amritsar", "Bathinda", "Jalandhar", "Ludhiana", "Mohali (SAS Nagar)", "Patiala"
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Bikaner", "Jaipur", "Jodhpur", "Kota", "Udaipur"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari",
    "Madurai", "Salem", "Thanjavur", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Vellore"
  ],
  "Telangana": [
    "Hyderabad", "Karimnagar", "Khammam", "Medchal-Malkajgiri", "Nizamabad", "Rangareddy", "Warangal"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ayodhya", "Bareilly", "Ghaziabad", "Gorakhpur", "Kanpur",
    "Lucknow", "Mathura", "Meerut", "Moradabad", "Noida (Gautam Buddha Nagar)", "Prayagraj", "Varanasi"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Nainital", "Rishikesh", "Udham Singh Nagar"
  ],
  "West Bengal": [
    "Asansol / Paschim Bardhaman", "Darjeeling", "Hooghly", "Howrah", "Kolkata",
    "North 24 Parganas", "Siliguri", "South 24 Parganas"
  ]
};

export const STATES_LIST = Object.keys(INDIAN_LOCATIONS).sort();

export const getDistrictsForState = (stateName) => {
  if (!stateName || !INDIAN_LOCATIONS[stateName]) {
    return [];
  }
  return INDIAN_LOCATIONS[stateName];
};
