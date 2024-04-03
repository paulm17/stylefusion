const { withPigment } = require("@stylefusion/nextjs-plugin");

module.exports = withPigment({
  reactStrictMode: true,
  transpilePackages: ["ui"],
});
