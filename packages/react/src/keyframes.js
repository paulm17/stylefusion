/**
 * `__wyw_dynamic_import` is a special global var that is set during the evaluation phase by wyw.
 * So during eval phase, it can happen that some code is calling the runtime function.
 * We do not want to throw error in that case as we want the evaluation to happen.
 */
export default function keyframes() {
  if (typeof __wyw_dynamic_import !== 'undefined') {
    return;
  }
  throw new Error(
    `${process.env.PACKAGE_NAME}: You were trying to call "keyframes" function without configuring your bundler. Make sure to install the bundler specific plugin and use it. @stylefusion/vite-plugin for Vite integration or @pigment-css/nextjs-plugin for Next.js integration.`,
  );
}
