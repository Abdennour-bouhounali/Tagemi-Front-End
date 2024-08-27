import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api', // Proxy to your backend
  headers: {
    Accept: 'application/json',
    'Content-Type': 'multipart/form-data',
},
});

export default axiosInstance;
