const getEnvironmentVariable = (name, fallback = null) => {
  const value = import.meta.env[name];
  if (!value && fallback === null) {
    console.warn(`Missing required environment variable: ${name}`);
    return null;
  }
  return value || fallback;
};

export const API_CONFIG = {
  BASE_URL: getEnvironmentVariable('VITE_API_URL', 'http://localhost:8000'),
};

export const API_BASE_URL = API_CONFIG.BASE_URL;