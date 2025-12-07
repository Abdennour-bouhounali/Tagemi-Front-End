const requiredEnvVars = [
  'VITE_API_URL',
];

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Missing environment variables: ${missing.join(', ')}`);
    }
  }
  
  return missing.length === 0;
};

export const getEnvironmentVariable = (name, fallback = null) => {
  const value = import.meta.env[name];
  if (!value && fallback === null) {
    console.warn(`Missing environment variable: ${name}, using fallback value: ${fallback}`);
  }
  return value || fallback;
};