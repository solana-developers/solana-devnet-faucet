/** @type {import('next').NextConfig} */
module.exports = {
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://solplay.de" },
        ],
      },
    ];
  },
};
