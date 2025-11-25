/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Get allowed origins from environment variable
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || ''
  if (!origins) {
    return []
  }
  return origins.split(',').map(origin => origin.trim()).filter(Boolean)
}

const allowedOrigins = getAllowedOrigins()
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  // App Router is enabled by default in Next.js 14
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    // Ensure react-pdf's deep import to its bundled pdfjs-dist resolves to the top-level package
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}
    try {
      const pdfjsPath = require.resolve('pdfjs-dist/build/pdf.mjs')
      config.resolve.alias['react-pdf/node_modules/pdfjs-dist/build/pdf.mjs'] = pdfjsPath
    } catch (_) {
      // ignore if not found at build-time; runtime will still attempt standard resolution
    }

    // Avoid bundling ONNX runtime and background-removal on the server build
    // They are browser-only and can cause SSR bundling/parsing issues
    if (isServer) {
      Object.assign(config.resolve.alias, {
        'onnxruntime-node': false,
        'onnxruntime-web': false,
        'onnxruntime-web/dist/ort.node.min.mjs': false,
        'onnxruntime-web/dist/ort.node.min.mjs.map': false,
        '@imgly/background-removal': false,
      })
    }

    // Ensure .mjs is treated properly and .map files are not parsed as JS
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    config.module.rules.push(
      { test: /\.mjs$/, type: 'javascript/auto' },
      { test: /\.mjs\.map$/i, type: 'asset/source' },
      { test: /\.map$/i, type: 'asset/source' }
    )
    return config
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()'
      },
    ]

    // Content Security Policy
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for PDF.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'),
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join('; ')

    securityHeaders.push({
      key: 'Content-Security-Policy',
      value: cspHeader
    })

    const headers = [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]

    // Add CORS headers only if allowed origins are configured
    if (allowedOrigins.length > 0) {
      headers.push({
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: isProduction ? allowedOrigins[0] : '*', // In production, use first origin; in dev, allow all
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      })
    }

    return headers
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
