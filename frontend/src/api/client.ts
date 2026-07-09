import axios, { type AxiosRequestConfig } from 'axios'
import { getLocalData } from '../mock'

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

/** null=未探测, true=后端在线, false=后端离线 */
let backendReady: boolean | null = null
let probePromise: Promise<boolean> | null = null

function normalizePath(url: string): string {
  return url.replace(/^\/?api\/v1/, '').split('?')[0]
}

/** 启动时只探测一次，避免并行请求互相覆盖状态 */
export async function probeBackend(): Promise<boolean> {
  if (backendReady !== null) return backendReady
  if (!probePromise) {
    probePromise = client
      .get('/health/db', { timeout: 5000 })
      .then(() => {
        backendReady = true
        return true
      })
      .catch(() => {
        backendReady = false
        return false
      })
  }
  return probePromise
}

export function isBackendReady(): boolean | null {
  return backendReady
}

export async function requestWithFallback<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const online = await probeBackend()
  if (online) {
    try {
      const response = await client.get<T>(path, config)
      return response.data
    } catch {
      return getLocalData(normalizePath(path)) as T
    }
  }
  return getLocalData(normalizePath(path)) as T
}

export default client
