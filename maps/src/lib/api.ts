import axios from 'axios'

const hostname = window.location.hostname
const parts = hostname.split('.')
const subdomain = parts.length > 2 ? parts[0] : null
const isProd = !hostname.endsWith('.test') && !hostname.endsWith('localhost')
const apiBase = isProd
  ? import.meta.env.VITE_API_URL
  : subdomain
    ? `http://${subdomain}.mapadovoto-api.test/api`
    : import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: apiBase,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export default api
