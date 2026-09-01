const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal, self-contained server output for Docker -- see Dockerfile.
  output: 'standalone',
  experimental: {
    // Points file tracing at the workspace root so it resolves the hoisted
    // node_modules correctly in this npm-workspaces repo (Next 14; this
    // option moves out of `experimental` in Next 15+).
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

module.exports = nextConfig;
