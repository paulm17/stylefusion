import { genUnoCSS } from "@stylefusion/unocss"

export const loader = async function virtualFileLoader() {
  const callback = this.async();
  const resourceQuery = this.resourceQuery.slice(1);
  const { source, root } = JSON.parse(decodeURIComponent(resourceQuery));
  const unocss = await genUnoCSS(source);

  const result = `${root} ${unocss}`;

  return callback(null, result);
};

