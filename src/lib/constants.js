export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
export const PLATFORM_FEE_PCT = 5;
export const TAX_PCT = 2;

export const CITIES_BY_PROVINCE = {
  Punjab: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang', 'Gujrat', 'Kasur', 'Rahim Yar Khan', 'Sahiwal', 'Okara'],
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad', 'Shikarpur', 'Khairpur', 'Dadu', 'Thatta', 'Badin'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Mingora', 'Kohat', 'Dera Ismail Khan', 'Swabi', 'Nowshera', 'Charsadda', 'Mansehra'],
  Balochistan: ['Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Dera Murad Jamali', 'Sibi', 'Zhob'],
  'Islamabad Capital Territory': ['Islamabad'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Chilas'],
  'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bagh'],
};

export const PROVINCES = Object.keys(CITIES_BY_PROVINCE);