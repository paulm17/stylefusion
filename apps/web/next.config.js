const { withPigment } = require("@stylefusion/nextjs-plugin");

module.exports = withPigment({
  reactStrictMode: true,
  transpilePackages: ["ui"],
}, {
  // purge: {
  //   libraries: ["@acme"],
  //   filename: "./component_names.txt"
  // }
});
