const { withPigment } = require("@stylefusion/nextjs-plugin");

module.exports = withPigment({
  reactStrictMode: true,
  transpilePackages: ["ui"],
}, {
  // purge: {
  //   libraries: ["@raikou"],
  //   filename: "./component_names.txt"
  // }
});
