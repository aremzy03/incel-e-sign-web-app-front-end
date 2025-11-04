/** @type {import('next').NextConfig} */
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
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
