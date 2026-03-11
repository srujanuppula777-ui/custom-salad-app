import axios from 'axios'

const api = axios.create({
    baseURL: `http://${window.location.hostname}:8000`,
    headers: { 'Content-Type': 'application/json' },
})

export default api
