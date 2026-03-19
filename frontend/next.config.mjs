/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['p.magickbase.com'],
  },
  reactStrictMode: true,
  experimental: {
    swcPlugins: [['@lingui/swc-plugin', {}]],
    esmExternals: true,
    gzipSize: true,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  poweredByHeader: false,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 添加 Netlify 支持
  trailingSlash: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self' https://*.rgbpp.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.live https://*.vercel.app https://*.magickbase.com https://*.rgbpp.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://*.magickbase.com https://explorer.rgbpp.io https://vercel.live https://*.vercel.app wss://*.vercel.app https://*.rgbpp.io/* wss://*.rgbpp.io/* https://mainnet-api.explorer.nervos.org; frame-src 'self' https://www.google.com https://vercel.live; worker-src 'self' blob:; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ]
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'))
    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              dimensions: false,
              template(variables, { tpl }) {
                return tpl`
                ${variables.imports};
                import { styled } from 'styled-system/jsx';
                
                ${variables.interfaces};
                
                const ${variables.componentName} = styled((${variables.props}) => (
                  ${variables.jsx}
                ));
                
                ${variables.exports};`
              },
            },
          },
        ],
      },
    )
    fileLoaderRule.exclude = /\.svg$/i
    return config
  },
  
}

export default nextConfig
