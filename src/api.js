import axios from 'axios';

// const baseURL = 'http://localhost/attendance-api';

// ✅ GOOD (Phone looks across Wi-Fi to your PC)
// Replace '172.16.10.XX' with your actual IP from Step 1
const baseURL = 'http://172.16.10.171/attendance_api'; 

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;