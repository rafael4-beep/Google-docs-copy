/** @type {import('next').NextConfig} */
const nextConfig = {
  // mammoth pulls in Node-oriented dependencies that should not be bundled by
  // the server compiler; keep it external so it loads as a normal require().
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
