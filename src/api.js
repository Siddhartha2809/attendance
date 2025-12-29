import axios from 'axios';

const api = axios.create({
    baseURL:"http://172.16.10.171/attendance_api",
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;