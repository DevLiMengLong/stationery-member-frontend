import axios from 'axios'

export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
  withCredentials: true
})

http.interceptors.response.use((response) => {
  const payload = response.data as ApiResponse<unknown>
  if (payload && payload.success === false) {
    return Promise.reject(new Error(payload.message || 'Request failed'))
  }
  return response
})
