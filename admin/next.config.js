/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyBD1fVKMQDypIwq6PmoUgAVifuzua1F5N8",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "mobi-c064c.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mobi-c064c",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "mobi-c064c.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "964234380308",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:964234380308:web:84e56e1f6ae92917dfd301",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' chrome-extension: chrome-extension://* moz-extension: moz-extension://* 'wasm-unsafe-eval';",
          },
        ],
      },
    ];
  },
  // Empty turbopack config to silence the warning
  turbopack: {},
};

module.exports = nextConfig;
