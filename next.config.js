/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        unoptimized: true, // Required for static export
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
};

module.exports = nextConfig;
