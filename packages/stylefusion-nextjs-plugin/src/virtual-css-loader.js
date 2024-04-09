import os from 'node:os';
import fsPromises from 'fs/promises';

export const loader = async function virtualFileLoader() {
  const callback = this.async();
  const resourceQuery = this.resourceQuery.slice(1);
  const { source: filename } = JSON.parse(decodeURIComponent(resourceQuery));

  let stylesFile = "";

  if (filename !== "") {
    const filePath = `${os.tmpdir()}/${filename}`;
    stylesFile = await fsPromises.readFile(filePath, {
      encoding: 'utf8',
    });
  }

  return callback(null, stylesFile);
};

