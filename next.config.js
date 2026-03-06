/** @type {import('next').NextConfig} */

// Conditionally load bundle analyzer only if ANALYZE is true and module is available
let withBundleAnalyzer = (config) => config
try {
  if (process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    })
  }
} catch (error) {
  // Bundle analyzer not available, continue without it
  console.warn('@next/bundle-analyzer not found, skipping bundle analysis')
}

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

    if (isServer) {
      // Redirect the modern pdfjs-dist ESM build to the legacy build on the server.
      // The modern build uses browser-only APIs (DOMMatrix, etc.) at module init time,
      // causing "ReferenceError: DOMMatrix is not defined" during SSR.
      // The legacy build is polyfilled for Node.js environments.
      try {
        const pdfjsLegacyPath = require.resolve('pdfjs-dist/legacy/build/pdf.mjs')
        config.resolve.alias['pdfjs-dist/build/pdf.mjs'] = pdfjsLegacyPath
        config.resolve.alias['pdfjs-dist'] = pdfjsLegacyPath
        config.resolve.alias['react-pdf/node_modules/pdfjs-dist/build/pdf.mjs'] = pdfjsLegacyPath
      } catch (_) {
        // legacy build not found; server will still warn but won't crash if ssr:false is used
      }

      // Avoid bundling ONNX runtime and background-removal on the server build
      // They are browser-only and can cause SSR bundling/parsing issues
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

    // Silence known safe Webpack warnings from onnxruntime-web dynamic requires
    config.ignoreWarnings = config.ignoreWarnings || []
    config.ignoreWarnings.push({
      module: /onnxruntime-web/,
      message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
    })

    return config
  },
  async headers() {
    // Derive the backend origin (for CSP connect-src) from NEXT_PUBLIC_API_URL, ignoring any path.
    let apiOrigin = ''
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL).origin
      } catch {
        // If URL parsing fails, leave apiOrigin empty and rely on 'self' only.
      }
    }

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
    // Allow images and XHR/WebSocket connections to the backend API origin (for profile photos, etc.)
    const imgSrc = "img-src 'self' data: blob: https:" + (apiOrigin ? ` ${apiOrigin}` : '')
    const connectSrc = "connect-src 'self'" + (apiOrigin ? ` ${apiOrigin}` : '')

    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for PDF.js
      "style-src 'self' 'unsafe-inline'",
      imgSrc,
      "font-src 'self' data:",
      connectSrc,
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
  // Reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
