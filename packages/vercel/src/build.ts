import { ResolvedConfig } from 'vite';
import glob from 'fast-glob';
import path, { basename, dirname } from 'path';
import { getOutput, getRoot, pathRelativeTo } from './utils';
import { build, BuildOptions, type Plugin } from 'esbuild';
import { VercelOutputIsr, ViteVercelApiEntry } from './types';
import { assert } from './assert';
import { vercelOutputVcConfigSchema } from './schemas/config/vc-config';
import fs, { copyFile } from 'fs/promises';
import type { Header, Rewrite } from '@vercel/routing-utils';
import _eval from 'eval';
import { vercelEndpointExports } from './schemas/exports';
import { generateCode, loadFile } from 'magicast';
import { getNodeVersion } from '@vercel/build-utils';
import { nodeFileTrace } from '@vercel/nft';
import { workspaceRootSync } from 'workspace-root';

export function getAdditionalEndpoints(resolvedConfig: ResolvedConfig) {
  return (resolvedConfig.vercel?.additionalEndpoints ?? []).map((e) => ({
    ...e,
    addRoute: e.addRoute ?? true,
    // path.resolve removes the trailing slash if any
    destination: path.posix.resolve('/', e.destination) + '.func',
  }));
}

export function getEntries(
  resolvedConfig: ResolvedConfig,
): ViteVercelApiEntry[] {
  const apiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  if (apiEntries.length > 0) {
    console.warn(
      '@vercel/build is currently force building /api files itself, with no way to disable it. ' +
        'In order to avoid double compilation, you should temporarily rename /api to /_api while using this plugin. ' +
        '/_api functions are compiled under .vercel/output/functions/api/*.func as if they were in /api.',
    );
  }

  const otherApiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/_api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  return [...apiEntries, ...otherApiEntries].reduce((entryPoints, filePath) => {
    const outFilePath = pathRelativeTo(
      filePath,
      resolvedConfig,
      filePath.includes('/_api/') ? '_api' : 'api',
    );
    const parsed = path.posix.parse(outFilePath);

    entryPoints.push({
      source: filePath,
      destination: `api/${path.posix.join(parsed.dir, parsed.name)}.func`,
      addRoute: true,
    });

    return entryPoints;
  }, getAdditionalEndpoints(resolvedConfig));
}

const edgeWasmPlugin: Plugin = {
  name: 'edge-wasm-vercel',
  setup(build) {
    build.onResolve({ filter: /\.wasm/ }, (args) => {
      return {
        path: args.path.replace(/\.wasm\?module$/i, '.wasm'),
        external: true,
      };
    });
  },
};

const vercelOgPlugin = (ctx: { found: boolean; index: string }): Plugin => {
  return {
    name: 'vercel-og',
    setup(build) {
      build.onResolve({ filter: /@vercel\/og/ }, () => {
        ctx.found = true;
        return undefined;
      });

      build.onLoad({ filter: /@vercel\/og/ }, (args) => {
        ctx.index = args.path;
        return undefined;
      });
    },
  };
};

const standardBuildOptions: BuildOptions = {
  bundle: true,
  target: 'es2020',
  format: 'esm',
  platform: 'node',
  logLevel: 'info',
  logOverride: {
    'ignored-bare-import': 'verbose',
    'require-resolve-not-external': 'verbose',
  },
  minify: false,
  plugins: [],
};

export async function buildFn(
  resolvedConfig: ResolvedConfig,
  entry: ViteVercelApiEntry,
  buildOptions?: BuildOptions,
) {
  assert(
    entry.destination.length > 0,
    `Endpoint ${
      typeof entry.source === 'string' ? entry.source : '-'
    } does not have build destination`,
  );

  const options = Object.assign({}, standardBuildOptions);

  if (buildOptions) {
    Object.assign(options, buildOptions);
  }

  const filename =
    entry.edge || options.format === 'cjs' ? 'index.js' : 'index.mjs';
  const outfile = path.join(
    getOutput(resolvedConfig, 'functions'),
    entry.destination,
    filename,
  );

  Object.assign(options, { outfile });

  if (!options.stdin) {
    if (typeof entry.source === 'string') {
      options.entryPoints = [entry.source];
    } else {
      assert(
        typeof entry.source === 'object',
        `\`{ source }\` must be a string or an object`,
      );
      assert(
        typeof entry.source.contents === 'string',
        `\`{ contents }\` must be a string`,
      );
      options.stdin = entry.source;
    }
  }

  if (entry.edge) {
    options.conditions = [
      'edge-light',
      'browser',
      'module',
      'import',
      'require',
    ];
    options.plugins?.push(edgeWasmPlugin);
    options.format = 'esm';
  } else if (options.format === 'esm') {
    options.banner = {
      js: `import { createRequire as VPV_createRequire } from "node:module";
import { fileURLToPath as VPV_fileURLToPath } from "node:url";
import { dirname as VPV_dirname } from "node:path";
const require = VPV_createRequire(import.meta.url);
const __filename = VPV_fileURLToPath(import.meta.url);
const __dirname = VPV_dirname(__filename);
`,
    };
  }

  const ctx = { found: false, index: '' };
  options.plugins!.push(vercelOgPlugin(ctx));

  const output = await build(options);

  // guess some assets dependencies
  if (typeof entry.source == 'string') {
    const base = workspaceRootSync(resolvedConfig.root) || resolvedConfig.root;
    const { fileList, reasons } = await nodeFileTrace([entry.source], {
      base,
      processCwd: resolvedConfig.root,
      mixedModules: true,
      ignore: [
        '**/node_modules/react{,-dom,-dom-server-turbopack}/**/*.development.js',
        '**/*.d.ts',
        '**/*.map',
        '**/node_modules/webpack5/**/*',
      ],
      async readFile(filepath) {
        if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
          const result = await build({
            ...standardBuildOptions,
            entryPoints: [entry.source as string],
            bundle: false,
            write: false,
          });

          return result.outputFiles[0].text;
        }

        return fs.readFile(filepath, 'utf-8');
      },
    });

    for (const file of fileList) {
      if (
        reasons.has(file) &&
        reasons.get(file)!.type.includes('asset') &&
        !file.endsWith('.js') &&
        !file.endsWith('.cjs') &&
        !file.endsWith('.mjs') &&
        !file.endsWith('package.json')
      ) {
        await copyFile(
          path.join(base, file),
          path.join(
            getOutput(resolvedConfig, 'functions'),
            entry.destination,
            basename(file),
          ),
        );
      }
    }
  }

  await writeVcConfig(
    resolvedConfig,
    entry.destination,
    Boolean(entry.edge),
    filename,
  );

  return output;
}

export async function writeVcConfig(
  resolvedConfig: ResolvedConfig,
  destination: string,
  edge: boolean,
  filename: string,
): Promise<void> {
  const vcConfig = path.join(
    getOutput(resolvedConfig, 'functions'),
    destination,
    '.vc-config.json',
  );

  const nodeVersion = await getNodeVersion(getOutput(resolvedConfig));

  await fs.writeFile(
    vcConfig,
    JSON.stringify(
      vercelOutputVcConfigSchema.parse(
        edge
          ? {
              runtime: 'edge',
              entrypoint: filename,
            }
          : {
              runtime: nodeVersion.runtime,
              handler: filename,
              maxDuration: resolvedConfig.vercel?.defaultMaxDuration,
              launcherType: 'Nodejs',
              shouldAddHelpers: true,
            },
      ),
      undefined,
      2,
    ),
    'utf-8',
  );
}

function getSourceAndDestination(destination: string) {
  if (destination.startsWith('api/')) {
    return path.posix.resolve('/', destination);
  }
  return path.posix.resolve('/', destination, ':match*');
}

const RE_BRACKETS = /^\[([^/]+)\]$/gm;
function replaceBrackets(source: string) {
  return source
    .split('/')
    .map((segment) => segment.replace(RE_BRACKETS, ':$1'))
    .join('/');
}

async function removeDefaultExport(filepath: string) {
  const mod = await loadFile(filepath);
  try {
    delete mod.exports.default;
  } catch (_) {
    // ignore
  }

  return generateCode(mod).code;
}

async function extractExports(filepath: string) {
  try {
    // default export is removed so that generated bundle contains only
    // named exports related code
    const contents = await removeDefaultExport(filepath);

    const buildOptions = {
      ...standardBuildOptions,
      format: 'cjs',
      minify: false,
      write: false,
      legalComments: 'none',
    } satisfies BuildOptions;

    buildOptions.stdin = {
      sourcefile: filepath,
      contents,
      loader: filepath.endsWith('.ts')
        ? 'ts'
        : filepath.endsWith('.tsx')
          ? 'tsx'
          : filepath.endsWith('.js')
            ? 'js'
            : filepath.endsWith('.jsx')
              ? 'jsx'
              : 'default',
      resolveDir: dirname(filepath),
    };

    const output = await build(buildOptions);
    const bundle = new TextDecoder().decode(output.outputFiles[0]?.contents);

    return vercelEndpointExports.parse(_eval(bundle, filepath, {}, true));
  } catch (e) {
    console.warn(`Warning: failed to read exports of '${filepath}'`, e);
  }
}

export async function buildEndpoints(resolvedConfig: ResolvedConfig): Promise<{
  rewrites: Rewrite[];
  isr: Record<string, VercelOutputIsr>;
  headers: Header[];
}> {
  const entries = getEntries(resolvedConfig);

  for (const entry of entries) {
    if (typeof entry.source === 'string') {
      const exports = await extractExports(entry.source);

      if (exports) {
        if (entry.headers || exports.headers) {
          entry.headers = {
            ...exports.headers,
            ...entry.headers,
          };
        }

        if (entry.edge !== undefined && exports.edge !== undefined) {
          throw new Error(
            `edge configuration should be defined either in the endpoint itself or through Vite config, not both ('${entry.source}')`,
          );
        }

        if (exports.edge !== undefined) {
          entry.edge = exports.edge;
        }

        if (entry.isr !== undefined && exports.isr !== undefined) {
          throw new Error(
            `isr configuration should be defined either in the endpoint itself or through Vite config, not both ('${entry.source}')`,
          );
        }

        if (exports.isr) {
          entry.isr = exports.isr;
        }
      }
    }

    await buildFn(resolvedConfig, entry);
  }

  const isrEntries = entries
    .filter((e) => e.isr)
    .map(
      (e) =>
        [
          e.destination.replace(/\.func$/, ''),
          { expiration: e.isr!.expiration },
        ] as const,
    );

  return {
    rewrites: entries
      .filter((e) => e.addRoute !== false)
      .map((e) => e.destination.replace(/\.func$/, ''))
      .map((destination) => ({
        source: replaceBrackets(getSourceAndDestination(destination)),
        destination: getSourceAndDestination(destination),
      })),
    isr: Object.fromEntries(isrEntries),
    headers: entries
      .filter((e) => e.headers)
      .map((e) => ({
        source: '/' + e.destination.replace(/\.func$/, ''),
        headers: Object.entries(e.headers!).map(([key, value]) => ({
          key,
          value,
        })),
      })),
  };
}
