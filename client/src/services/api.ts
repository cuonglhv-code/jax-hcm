import axios from 'axios'

let _accessToken: string | null = null
let _onLogout: (() => void) | null = null

export function setAccessToken(token: string | null) { _accessToken = token }
export function setLogoutHandler(fn: () => void)     { _onLogout = fn }

export const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use(config => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }
    if (isRefreshing) {
      return new Promise(resolve => {
        refreshQueue.push(token => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }
    original._retry = true
    isRefreshing = true
    try {
      const { data } = await axios.post(
        '/api/auth/refresh', {}, { withCredentials: true }
      )
      const newToken = data.data.accessToken
      setAccessToken(newToken)
      refreshQueue.forEach(cb => cb(newToken))
      refreshQueue = []
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch {
      setAccessToken(null)
      _onLogout?.()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)
