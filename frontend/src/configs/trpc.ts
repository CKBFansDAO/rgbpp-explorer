import type { TRPCRouter } from '@magickbase/p'
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import SuperJSON from 'superjson'

// 配置 tRPC 客户端
export const trpc = createTRPCReact<TRPCRouter>()

// 获取tRPC URL
const getTrpcUrl = () => {
  // 检查是否启用代理
  const proxyEnabled = process.env.NEXT_PUBLIC_ENABLE_PROXY
  const isProxyOn = proxyEnabled === 'true' || proxyEnabled === '1'
  
  if (isProxyOn) {
    console.log('Using proxy for tRPC requests')
    return '/api/proxy'
  } else {
    console.log('Using direct tRPC URL')
    return process.env.NEXT_PUBLIC_TRPC_API_URL || 'https://web3-api.magickbase.com/api/trpc/'
  }
}

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getTrpcUrl(),
        // @ts-ignore
        transformer: SuperJSON,
        headers() {
          return {
            // Authorization: `Bearer ${process.env.NEXT_PUBLIC_TRPC_API_KEY}`,
            origin: 'x-requested-with'
          }
        },
      }),
    ],
  })
}