import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const pwa = withPWA({
  dest: "public",
  disable: !isProd,
  register: true,
  scope: "/",
  sw: "service-worker.js",
});

const nextConfig = {
  reactStrictMode: true,
};

export default pwa(nextConfig);
