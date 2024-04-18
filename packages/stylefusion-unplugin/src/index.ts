import * as path from 'node:path';
// @ts-ignore
import { transformAsync } from '@babel/core';
import {
  type Preprocessor,
  type PluginOptions as WywInJsPluginOptions,
  type IFileReporterOptions,
  TransformCacheCollection,
  transform,
  createFileReporter,
} from '@wyw-in-js/transform';
import { asyncResolveFallback } from '@wyw-in-js/shared';
import {
  UnpluginFactoryOutput,
  WebpackPluginInstance,
  createUnplugin,
  UnpluginOptions,
} from 'unplugin';
import {
  preprocessor as basePreprocessor,
  generateTokenCss,
  generateThemeTokens,
  extendTheme,
  type Theme as BaseTheme,
} from '@stylefusion/react/utils';
import type { ResolvePluginInstance } from 'webpack';
import { extractClassNames, genLayers, genStyleRootObj } from "@stylefusion/unocss"
import os from 'node:os';
import fsPromises from 'fs/promises';
import fs from 'fs';

type NextMeta = {
  type: 'next';
  dev: boolean;
  isServer: boolean;
  outputCss: boolean;
  placeholderCssFile: string;
};

type ViteMeta = {
  type: 'vite';
};

type WebpackMeta = {
  type: 'webpack';
};

type Meta = NextMeta | ViteMeta | WebpackMeta;
export type AsyncResolver = (what: string, importer: string, stack: string[]) => Promise<string>;

export type PigmentOptions<Theme extends BaseTheme = BaseTheme> = {
  theme?: Theme;
  transformLibraries?: string[];
  preprocessor?: Preprocessor;
  debug?: IFileReporterOptions | false;
  sourceMap?: boolean;
  meta?: Meta;
  asyncResolve?: (...args: Parameters<AsyncResolver>) => Promise<string | null>;
  transformSx?: boolean;
  // option to remove unused css from libraries
  purge?: {
    libraries: string[],
    filename: string,
  }
} & Partial<WywInJsPluginOptions>;

const extensions = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'];

function hasCorectExtension(fileName: string) {
  return extensions.some((ext) => fileName.endsWith(ext));
}

const VIRTUAL_CSS_FILE = `\0zero-runtime-styles.css`;
const VIRTUAL_THEME_FILE = `\0zero-runtime-theme.js`;

function isZeroRuntimeThemeFile(fileName: string) {
  return fileName === VIRTUAL_CSS_FILE || fileName === VIRTUAL_THEME_FILE;
}

function isZeroRuntimeProcessableFile(fileName: string, transformLibraries: string[]) {
  const isNodeModule = fileName.includes('node_modules');
  const isTransformableFile =
    isNodeModule && transformLibraries.some((libName) => fileName.includes(libName));
  return (
    hasCorectExtension(fileName) &&
    (isTransformableFile || !isNodeModule) &&
    !fileName.includes('runtime/build')
  );
}

/**
 * Next.js initializes the plugin multiple times. So all the calls
 * have to share the same Maps.
 */
const globalCssFileLookup = new Map<string, string>();
const globalCssLookup = new Map<string, string>();

const pluginName = 'PigmentCSSWebpackPlugin';

function innerNoop() {
  return null;
}

function outerNoop() {
  return innerNoop;
}

async function genComponentList(components: string) {
  if (components !== "") {
    const componentNames = await fsPromises.readFile(components, {
      encoding: 'utf8',
    });
    
    return componentNames.split(",");
  }

  return [];
}  

function generateRandomString(length = 8) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const plugin = createUnplugin<PigmentOptions, true>((options) => {
  const {
    theme,
    meta,
    transformLibraries = [],
    preprocessor = basePreprocessor,
    asyncResolve: asyncResolveOpt,
    debug = false,
    sourceMap = false,
    transformSx = true,
    overrideContext,
    tagResolver,
    ...rest
  } = options;
  const cache = new TransformCacheCollection();
  const { emitter, onDone } = createFileReporter(debug ?? false);
  const cssLookup = meta?.type === 'next' ? globalCssLookup : new Map<string, string>();
  const cssFileLookup = meta?.type === 'next' ? globalCssFileLookup : new Map<string, string>();
  const isNext = meta?.type === 'next';
  const outputCss = isNext && meta.outputCss;
  const allComponents = [] as string[];
  const imports = [] as string[];
  const cssFiles = new Set<string>();
  const layerStyles = {} as Record<string, string[]>;
  const unoStyles = new Set<string>();

  const babelTransformPlugin: UnpluginOptions = {
    name: 'zero-plugin-transform-babel',
    enforce: 'post',
    transformInclude(id) {
      return isZeroRuntimeProcessableFile(id, transformLibraries);
    },
    async transform(code, id) {
      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        plugins: [[`${process.env.RUNTIME_PACKAGE_NAME}/exports/sx-plugin`]],
      });
      if (!result) {
        return null;
      }
      return {
        code: result.code ?? code,
        map: result.map,
      };
    },
  };


  let webpackResolver: AsyncResolver;

  const asyncResolve: AsyncResolver = async (what, importer, stack) => {
    const result = await asyncResolveOpt?.(what, importer, stack);
    if (typeof result === 'string') {
      return result;
    }
    if (webpackResolver) {
      return webpackResolver(what, importer, stack);
    }
    return asyncResolveFallback(what, importer, stack);
  };

  async function checkFileExists(filePath: string) {
    try {
       await fsPromises.access(filePath, fsPromises.constants.F_OK);
       return true; // File exists
    } catch (error) {
       return false; // File does not exist
    }
   }

  const wywInJSTransformPlugin: UnpluginOptions = {
    name: 'zero-plugin-transform-wyw-in-js',
    enforce: 'post',
    async buildEnd() {
      // clean up css files
      // try {
      //   const valid = await checkFileExists(fileName);
      //   if (valid) {
      //     await fsPromises.unlink(fileName);          
      //   }
      // } catch (error) {}  

      onDone(process.cwd());
    },
    transformInclude(id) {      
      return isZeroRuntimeProcessableFile(id, transformLibraries);
    },
    async transform(code, id) {
      const transformServices = {
        options: {
          filename: id,
          root: process.cwd(),
          preprocessor,
          pluginOptions: {
            ...rest,
            themeArgs: {
              theme,
            },
            overrideContext(context: Record<string, unknown>, filename: string) {
              if (overrideContext) {
                return overrideContext(context, filename);
              }
              if (!context.$RefreshSig$) {
                context.$RefreshSig$ = outerNoop;
              }
              return context;
            },
            tagResolver(source: string, tag: string) {
              const tagResult = tagResolver?.(source, tag);
              if (tagResult) {
                return tagResult;
              }
              if (source.endsWith('/zero-styled')) {
                return require.resolve(`${process.env.RUNTIME_PACKAGE_NAME}/exports/${tag}`);
              }
              return null;
            },
            babelOptions: {
              ...rest.babelOptions,
              // plugins: [
              //   `${process.env.RUNTIME_PACKAGE_NAME}/exports/remove-prop-types-plugin`,
              //   'babel-plugin-define-var', // A fix for undefined variables in the eval phase of wyw-in-js, more details on https://github.com/siriwatknp/babel-plugin-define-var?tab=readme-ov-file#problem
              //   ...(rest.babelOptions?.plugins ?? []),
              // ],
            },
          },
        },
        cache,
        eventEmitter: emitter,
      };

      // generate the imported list of components
      const genValidImports = (code: string) => {
        const imports = [] as string[];

        if (options.purge && options.purge.libraries.length > 0) {
          options.purge.libraries.forEach((library) => {
            const regex = new RegExp(`import\\s+\\{\\s*([^}]+)\\s*\\}\\s+from\\s+['"]${library}\\/(server|client)['"]`, 'g');

            let match;
            while ((match = regex.exec(code)) !== null) {
              if (match && match[1]) {
                const items = match[1].split(',').map(item => item.trim());
                const validImports = items.filter(item => allComponents.includes(item));
                imports.push(...validImports);
              }
            }
          });          
        }

        return imports;
      }

      const matchLibraryAndComponents = (line: string, library: string[], components: string[]) => {
        const libraryMatch = library.some((lib) => line.includes(lib) || line.includes(lib.replace("@", "")));
        const componentsMatch = components.some((imp) => line.includes(imp));

        return libraryMatch && componentsMatch;
      }
      
      try {
        // load all components from purge option
        if (options.purge && options.purge.filename) {
          if (allComponents.length === 0) {
            const componentList = await genComponentList(options.purge.filename);

            allComponents.push(...componentList);
          }

          // Now determine whether some components need to be purged
          const libraries = options.purge && options.purge.libraries || [];
          const match = matchLibraryAndComponents(id, libraries, allComponents);

          if (match) {
            const allowed = imports.some((imp) => id.includes(`/${imp}/`));

            if (!allowed) {
              return null;
            }
          }
        }        

        if (id.endsWith(".tsx")) {
          // retrieve validated imports
          imports.push(...genValidImports(code));

          // add to classNames styles
          const unocssStyles = extractClassNames(code) as string;
          const unoStyles_s = unocssStyles.split(" ");
          unoStyles_s.forEach(style => {
            if (style !== "" && !unoStyles.has(style)) {
              unoStyles.add(style);
            }
          });
        }        

        const result = await transform(transformServices, code, asyncResolve);

        if (!result.cssText) {
          return null;
        }

        let { cssText } = result;
        let { css } = genStyleRootObj(cssText);

        // const styles = JSON.parse(css);
        // Object.keys(styles).forEach((key) => {
        //   if (!layerStyles[key]) {
        //     layerStyles[key] = [] as string[];

        //     styles[key].split(" ").forEach((style: string) => {
        //       if (!layerStyles[key]!.includes(style)) {
        //         layerStyles[key]!.push(style);
        //       }
        //     })
        //   } else {
        //     styles[key].split(" ").forEach((style: string) => {
        //       if (!layerStyles[key]!.includes(style)) {
        //         layerStyles[key]!.push(style);
        //       }
        //     })
        //   }
        // });

        if (isNext && !outputCss) {
          return {
            code: result.code,
            map: result.sourceMap,
          };
        }
      
        if (sourceMap && result.cssSourceMapText) {
          const map = Buffer.from(result.cssSourceMapText).toString('base64');
          cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
        }

        // Virtual modules do not work consistently in Next.js (the build is done at least
        // thrice) resulting in error in subsequent builds. So we use a placeholder CSS
        // file with the actual CSS content as part of the query params.

        if (isNext) {
          const layers = await genLayers(css, unoStyles);

          // Use a file to pass styles to virtual-css-loader otherwise the placeholder duplicates
          // the same styles :( 
          const fileName = `raikou_tmp_file.txt`;         
          const filePath = `${os.tmpdir()}/${fileName}`;
          // don't async otherwise corruption occurs
          fs.writeFileSync(filePath, layers, { encoding: 'utf8', flag: 'w', mode: 0o666 });
                    
          const  data = `${meta.placeholderCssFile}?${encodeURIComponent(
            JSON.stringify({
              source: fileName,
            }),
          )}`;

          return {
            // CSS import should be the last so that nested components produce correct CSS order injection.
            code: `${result.code}\n import ${JSON.stringify(data)}`,
            map: result.sourceMap,
          };
        } 
      } catch (e) {
        const error = new Error((e as Error).message);
        error.stack = (e as Error).stack;
        throw error;
      }
    },
    webpack(compiler) {
      const resolverPlugin: ResolvePluginInstance = {
        apply(resolver) {
          webpackResolver = function webpackAsyncResolve(
            what: string,
            importer: string,
            stack: string[],
          ) {
            const context = path.isAbsolute(importer)
              ? path.dirname(importer)
              : path.join(process.cwd(), path.dirname(importer));
            return new Promise((resolve, reject) => {
              resolver.resolve({}, context, what, { stack: new Set(stack) }, (err, result) => {
                if (err) {
                  reject(err);
                } else if (result) {
                  resolve(result);
                } else {
                  reject(new Error(`${process.env.PACKAGE_NAME}: Cannot resolve ${what}`));
                }
              });
            });
          };
        },
      };
      compiler.options.resolve.plugins = compiler.options.resolve.plugins || [];
      compiler.options.resolve.plugins.push(resolverPlugin);
    },
  };

  const plugins: Array<UnpluginOptions> = [
    {
      name: 'zero-plugin-theme-tokens',
      enforce: 'pre',
      webpack(compiler) {
        compiler.hooks.normalModuleFactory.tap(pluginName, (nmf) => {
          nmf.hooks.createModule.tap(
            pluginName,
            // @ts-expect-error CreateData is typed as 'object'...
            (createData: { matchResource?: string; settings: { sideEffects?: boolean } }) => {
              if (createData.matchResource && createData.matchResource.endsWith('.zero.css')) {
                createData.settings.sideEffects = true;
              }
            },
          );
        });        
      },
      ...(isNext
        ? {
            transformInclude(id) {
              return (
                // this file should exist in the package
                id.endsWith(`${process.env.RUNTIME_PACKAGE_NAME}/styles.css`) ||
                id.endsWith('/stylefusion-react/styles.css') ||
                id.includes(`${process.env.RUNTIME_PACKAGE_NAME}/theme`) ||
                id.includes('/stylefusion-react/theme')
              );
            },
            transform(_code, id) {
              if (id.endsWith('styles.css')) {
                return theme ? generateTokenCss(theme) : _code;
              }
              if (id.includes('stylefusion-react/theme')) {
                return `export default ${
                  theme ? JSON.stringify(generateThemeTokens(theme)) : '{}'
                };`;
              }
              return null;
            },
          }
        : {
            resolveId(source: string) {
              if (source === `${process.env.RUNTIME_PACKAGE_NAME}/styles.css`) {
                return VIRTUAL_CSS_FILE;
              }
              if (source === `${process.env.RUNTIME_PACKAGE_NAME}/theme`) {
                return VIRTUAL_THEME_FILE;
              }
              return null;
            },
            loadInclude(id) {
              return isZeroRuntimeThemeFile(id);
            },
            load(id) {
              if (id === VIRTUAL_CSS_FILE && theme) {
                return generateTokenCss(theme);
              }
              if (id === VIRTUAL_THEME_FILE) {
                return `export default ${
                  theme ? JSON.stringify(generateThemeTokens(theme)) : '{}'
                };`;
              }
              return null;
            },
          }),
    },
  ];

  if (transformSx) {
    plugins.push(babelTransformPlugin);
  }

  plugins.push(wywInJSTransformPlugin);

  // This is already handled separately for Next.js using `placeholderCssFile`
  if (!isNext) {
    plugins.push({
      name: 'zero-plugin-load-output-css',
      enforce: 'pre',
      resolveId(source: string) {
        return cssFileLookup.get(source);
      },
      loadInclude(id) {
        return id.endsWith('.zero.css');
      },
      load(id) {
        return cssLookup.get(id) ?? '';
      },
    });
  }
  return plugins;
});

export const webpack = plugin.webpack as unknown as UnpluginFactoryOutput<
  PigmentOptions,
  WebpackPluginInstance
>;

export { extendTheme };