const { withPigment } = require("@stylefusion/nextjs-plugin");

module.exports = withPigment(
  {
    reactStrictMode: true,
    transpilePackages: ["ui"],
  },
  {
    purge: {
      libraries: ["@raikou"],
      filename: "./node_modules/@raikou/system/dist/component_names.txt",
    },
  },
);
