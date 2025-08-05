/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // FORCE DEPLOY TRIGGER
  env: {
    DEPLOY_TIMESTAMP: new Date().toISOString(),
    RECEIPT_SYSTEM_VERSION: '0.1.3'
  }
}

module.exports = nextConfig