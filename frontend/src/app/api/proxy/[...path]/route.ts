import { NextRequest, NextResponse } from 'next/server'

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// 获取目标API URL
const getTargetUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_TRPC_API_URL || 'https://web3-api.magickbase.com/api/trpc'
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

// 检查是否启用代理
const isProxyEnabled = () => {
  const proxyEnabled = process.env.NEXT_PUBLIC_ENABLE_PROXY
  return proxyEnabled === 'true' || proxyEnabled === '1'
}

// 检查是否启用缓存
const isCacheEnabled = () => {
  const cacheEnabled = process.env.NEXT_PUBLIC_ENABLE_CACHE
  return cacheEnabled === 'true' || cacheEnabled === '1'
}

// 获取缓存TTL（秒）
const getCacheTTL = () => {
  const ttl = process.env.NEXT_PUBLIC_CACHE_TTL
  return ttl ? parseInt(ttl) : 300 // 默认5分钟
}

// 生成缓存键
const generateCacheKey = (method: string, path: string, body?: string, searchParams?: URLSearchParams) => {
  const params = searchParams ? Array.from(searchParams.entries()).sort((a, b) => a[0].localeCompare(b[0])).join('&') : ''
  const bodyHash = body ? Buffer.from(body).toString('base64').slice(0, 16) : ''
  return `${method}:${path}:${params}:${bodyHash}`
}

// 检查缓存是否有效
const isCacheValid = (cacheEntry: { data: any; timestamp: number; ttl: number }) => {
  const now = Date.now()
  return (now - cacheEntry.timestamp) < (cacheEntry.ttl * 1000)
}

// 获取缓存数据
const getCachedData = (cacheKey: string) => {
  const cacheEntry = cache.get(cacheKey)
  if (cacheEntry && isCacheValid(cacheEntry)) {
    console.log(`Cache HIT: ${cacheKey}`)
    return cacheEntry.data
  }
  if (cacheEntry) {
    console.log(`Cache EXPIRED: ${cacheKey}`)
    cache.delete(cacheKey)
  }
  return null
}

// 设置缓存数据
const setCachedData = (cacheKey: string, data: any, ttl: number) => {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  })
  console.log(`Cache SET: ${cacheKey}, TTL: ${ttl}s`)
}

// 清理过期缓存
const cleanupExpiredCache = () => {
  const now = Date.now()
  let cleanedCount = 0
  for (const [key, entry] of cache.entries()) {
    if (!isCacheValid(entry)) {
      cache.delete(key)
      cleanedCount+=1
    }
  }
  if (cleanedCount > 0) {
    console.log(`Cache cleanup: removed ${cleanedCount} expired entries`)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const { searchParams } = new URL(request.url)
    
    // 检查代理开关
    if (!isProxyEnabled()) {
      console.log('Proxy disabled, returning direct response')
      return NextResponse.json({ 
        error: 'Proxy is disabled',
        message: 'Set NEXT_PUBLIC_ENABLE_PROXY=true to enable proxy',
        directUrl: `${getTargetUrl()}/${path}`
      }, { status: 503 })
    }
    
    const targetUrl = getTargetUrl()
    
    // 生成缓存键
    const cacheKey = generateCacheKey('GET', path, undefined, searchParams)
    
    // 检查缓存
    if (isCacheEnabled()) {
      cleanupExpiredCache()
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData, { 
          status: 200,
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        })
      }
    }
    
    // 构建目标URL
    const fullTargetUrl = new URL(`${targetUrl}/${path}`)
    
    // 复制所有查询参数
    for (const [key, value] of searchParams.entries()) {
      fullTargetUrl.searchParams.set(key, value)
    }

    console.log(`Proxy GET: ${request.url} -> ${fullTargetUrl.toString()}`)

    // 转发请求到目标服务器
    const response = await fetch(fullTargetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || '',
        'Accept': request.headers.get('Accept') || 'application/json',
        'Cache-Control': 'no-cache',
      },
    })

    console.log(`Proxy Response Status: ${response.status}`)

    if (!response.ok) {
      console.error('Proxy Response Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Proxy Error Response:', errorText)
      return NextResponse.json({ error: `Target server error: ${response.status}` }, { status: response.status })
    }

    // 获取响应数据
    const data = await response.json()
    
    // 缓存响应数据
    if (isCacheEnabled()) {
      const ttl = getCacheTTL()
      setCachedData(cacheKey, data, ttl)
    }
    
    // 返回响应，保持原始状态码
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey
      }
    })
  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ 
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const body = await request.text() // 获取原始请求体
    const { searchParams } = new URL(request.url)
    
    // 检查代理开关
    if (!isProxyEnabled()) {
      console.log('Proxy disabled, returning direct response')
      return NextResponse.json({ 
        error: 'Proxy is disabled',
        message: 'Set NEXT_PUBLIC_ENABLE_PROXY=true to enable proxy',
        directUrl: `${getTargetUrl()}/${path}`
      }, { status: 503 })
    }
    
    const targetUrl = getTargetUrl()
    
    // 生成缓存键
    const cacheKey = generateCacheKey('POST', path, body, searchParams)
    
    // 检查缓存
    if (isCacheEnabled()) {
      cleanupExpiredCache()
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData, { 
          status: 200,
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        })
      }
    }
    
    // 构建目标URL
    const fullTargetUrl = `${targetUrl}/${path}`

    console.log(`Proxy POST: ${request.url} -> ${fullTargetUrl}`)
    console.log(`Proxy Body: ${body}`)

    // 转发请求到目标服务器
    const response = await fetch(fullTargetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'User-Agent': request.headers.get('User-Agent') || '',
        'Accept': request.headers.get('Accept') || 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: body, // 直接转发原始请求体
    })

    console.log(`Proxy Response Status: ${response.status}`)

    if (!response.ok) {
      console.error('Proxy Response Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Proxy Error Response:', errorText)
      return NextResponse.json({ error: `Target server error: ${response.status}` }, { status: response.status })
    }

    // 获取响应数据
    const data = await response.json()
    
    // 缓存响应数据
    if (isCacheEnabled()) {
      const ttl = getCacheTTL()
      setCachedData(cacheKey, data, ttl)
    }
    
    // 返回响应，保持原始状态码
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey
      }
    })
  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ 
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const body = await request.text()
    
    // 检查代理开关
    if (!isProxyEnabled()) {
      console.log('Proxy disabled, returning direct response')
      return NextResponse.json({ 
        error: 'Proxy is disabled',
        message: 'Set NEXT_PUBLIC_ENABLE_PROXY=true to enable proxy',
        directUrl: `${getTargetUrl()}/${path}`
      }, { status: 503 })
    }
    
    const targetUrl = getTargetUrl()
    
    const fullTargetUrl = `${targetUrl}/${path}`

    console.log(`Proxy PUT: ${request.url} -> ${fullTargetUrl}`)

    const response = await fetch(fullTargetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'User-Agent': request.headers.get('User-Agent') || '',
        'Accept': request.headers.get('Accept') || 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: body,
    })

    console.log(`Proxy Response Status: ${response.status}`)

    if (!response.ok) {
      console.error('Proxy Response Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Proxy Error Response:', errorText)
      return NextResponse.json({ error: `Target server error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ 
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    
    // 检查代理开关
    if (!isProxyEnabled()) {
      console.log('Proxy disabled, returning direct response')
      return NextResponse.json({ 
        error: 'Proxy is disabled',
        message: 'Set NEXT_PUBLIC_ENABLE_PROXY=true to enable proxy',
        directUrl: `${getTargetUrl()}/${path}`
      }, { status: 503 })
    }
    
    const targetUrl = getTargetUrl()
    
    const fullTargetUrl = `${targetUrl}/${path}`

    console.log(`Proxy DELETE: ${request.url} -> ${fullTargetUrl}`)

    const response = await fetch(fullTargetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'User-Agent': request.headers.get('User-Agent') || '',
        'Accept': request.headers.get('Accept') || 'application/json',
        'Cache-Control': 'no-cache',
      },
    })

    console.log(`Proxy Response Status: ${response.status}`)

    if (!response.ok) {
      console.error('Proxy Response Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Proxy Error Response:', errorText)
      return NextResponse.json({ error: `Target server error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ 
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 