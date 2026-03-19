import {  NextResponse } from 'next/server'

// 获取目标API URL
const getTargetUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_TRPC_API_URL || 'https://web3-api.magickbase.com/api/trpc'
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

export async function GET() {
  try {
    const targetUrl = getTargetUrl()
    
    // 测试健康检查
    const healthResponse = await fetch('/api/proxy/health')
    const healthData = await healthResponse.json()
    
    // 测试一个简单的代理请求
    const testResponse = await fetch('/api/proxy/rgbpp.marketCap')
    const testData = await testResponse.json()
    
    return NextResponse.json({
      status: 'test_completed',
      health: healthData,
      testRequest: testData,
      targetUrl,
      proxyEndpoint: '/api/proxy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'test_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      targetUrl: getTargetUrl(),
      proxyEndpoint: '/api/proxy',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 