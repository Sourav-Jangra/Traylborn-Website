import type { NextConfig } from "next";

// Media library items from Cloudinary are served through next/image, so the account's
// delivery path must be allowed here. Read at build time: set CLOUDINARY_CLOUD_NAME before
// `next build`.
const cloudinaryCloud = process.env.CLOUDINARY_CLOUD_NAME;
const validCloud = cloudinaryCloud && /^[A-Za-z0-9_-]{1,64}$/.test(cloudinaryCloud) ? cloudinaryCloud : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: validCloud ? [{ protocol: "https", hostname: "res.cloudinary.com", pathname: `/${validCloud}/**` }] : [],
  },
};

export default nextConfig;
