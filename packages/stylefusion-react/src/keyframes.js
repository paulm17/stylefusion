export default function keyframes() {
  throw new Error(
    `${process.env.PACKAGE_NAME}: You were trying to call "keyframes" function without configuring your bundler. Make sure to install the bundler specific plugin and use it. @stylefusion/vite-plugin for Vite integration or @stylefusion/nextjs-plugin for Next.js integration.`,
  );
}
