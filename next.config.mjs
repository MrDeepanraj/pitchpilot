/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // node:sqlite is a Node builtin — no bundling needed. Keep server externals clean.
  serverExternalPackages: [],
};

export default nextConfig;
