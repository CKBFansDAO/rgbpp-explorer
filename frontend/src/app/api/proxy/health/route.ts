import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    const targetUrl = getTargetUrl()
    const proxyEnabled = isProxyEnabled()
    
    console.log('Proxy Health Check: Testing connection to', targetUrl)
    console.log('Proxy enabled:', proxyEnabled)
    
    // 如果代理未启用，返回状态信息
    if (!proxyEnabled) {
      return NextResponse.json({ 
        status: 'proxy_disabled',
        target: targetUrl,
        proxyEnabled: false,
        message: 'Proxy is disabled. Set NEXT_PUBLIC_ENABLE_PROXY=true to enable',
        proxyEndpoint: '/api/proxy'
      })
    }
    
    // 尝试连接目标服务器
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    })

    console.log('Proxy Health Check response status:', response.status)
    
    if (response.ok) {
      return NextResponse.json({ 
        status: 'healthy',
        target: targetUrl,
        responseStatus: response.status,
        proxyEnabled: true,
        proxyEndpoint: '/api/proxy'
      })
    } else {
      return NextResponse.json({ 
        status: 'unhealthy',
        target: targetUrl,
        responseStatus: response.status,
        error: `HTTP ${response.status}`,
        proxyEnabled: true,
        proxyEndpoint: '/api/proxy'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Proxy Health Check error:', error)
    return NextResponse.json({ 
      status: 'unhealthy',
      target: getTargetUrl(),
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? error.code : undefined,
      proxyEnabled: isProxyEnabled(),
      proxyEndpoint: '/api/proxy'
    }, { status: 503 })
  }
} 