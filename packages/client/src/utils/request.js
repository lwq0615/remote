import axios from 'axios'
import { message, notification } from 'ant-design-vue'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // 设置统一的请求前缀
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 这里可以添加统一的请求处理，比如添加 token
    return config
  },
  error => {
    notification.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 这里可以统一处理响应
    return res
  },
  error => {
    notification.error({
      description: error.response?.data?.message || error.message || '请求失败',
      message: '请求错误'
    })
    return Promise.reject(error.response?.data || error)
  }
)

// 封装 GET 请求
export function get(url, params) {
  return request({
    method: 'get',
    url,
    params
  })
}

// 封装 POST 请求
export function post(url, data) {
  return request({
    method: 'post',
    url,
    data
  })
}

// 导出 request 实例
export default {
  get,
  post
}