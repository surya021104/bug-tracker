// API Configuration - Single source of truth
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API Configuration:');
  console.log('  - API_URL:', API_URL);
  console.log('  - Mode:', import.meta.env.MODE);
  console.log('  - Env Var:', import.meta.env.VITE_API_URL);
}

export { API_URL };
export default API_URL;
