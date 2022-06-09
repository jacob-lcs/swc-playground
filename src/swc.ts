import { atom } from 'jotai'
import { Ok, Err } from 'ts-results'
import type { Result } from 'ts-results'
import type { JSONSchema6 } from 'json-schema'
import semver from 'semver'

interface SwcModule {
  default(): Promise<unknown>
  parseSync(code: string, options: ParseOnlyOptions): AST
  transformSync(code: string, options: Config): TransformationOutput
}

export interface Config {
  jsc: {
    parser: ParserOptions
    target?: EsVersion
    loose?: boolean
    minify?: {
      compress?: boolean | CompressOptions
      mangle?: boolean | MangleOptions
      format?: Record<string, unknown>
      ecma?: number | string
      keepClassnames?: boolean
      keepFnames?: boolean
      module?: boolean
      safari10?: boolean
      toplevel?: boolean
      sourceMap?: {
        filename?: string
        url?: string
        root?: string
        content?: string
      }
      outputPath?: string
      inlineSourcesContent?: boolean
    }
    transform?: TransformOptions
    externalHelpers?: boolean
    keepClassNames?: boolean
    baseUrl?: string
    paths?: Record<string, string[]>
  }
  module?: ModuleOptions
  minify?: boolean
  env?: EnvOptions
  isModule?: boolean
  sourceMaps?: boolean | 'inline'
  inlineSourcesContent?: boolean
  experimental?: Record<never, never>
  filename?: string
}

export type ParserOptions =
  | {
      syntax: 'ecmascript'
      jsx?: boolean
      functionBind?: boolean
      decorators?: boolean
      decoratorsBeforeExport?: boolean
      exportDefaultFrom?: boolean
      importAssertions?: boolean
      staticBlocks?: boolean
      privateInObject?: boolean
    }
  | {
      syntax: 'typescript'
      tsx?: boolean
      decorators?: boolean
    }

export type EsVersion =
  | 'es3'
  | 'es5'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'es2021'
  | 'es2022'

export type ModuleOptions =
  | {
      type: 'es6'
      strict?: boolean
      strictMode?: boolean
      lazy?: boolean
      noInterop?: boolean
    }
  | {
      type: 'commonjs'
      strict?: boolean
      strictMode?: boolean
      lazy?: boolean
      noInterop?: boolean
    }
  | {
      type: 'amd'
      moduleId?: string
      strict?: boolean
      strictMode?: boolean
      lazy?: boolean
      noInterop?: boolean
    }
  | {
      type: 'umd'
      globals?: Record<string, string>
      strict?: boolean
      strictMode?: boolean
      lazy?: boolean
      noInterop?: boolean
    }
  | {
      type: 'systemjs'
      allowTopLevelThis?: boolean
    }

export interface CompressOptions {
  arguments?: boolean
  arrows?: boolean
  booleans?: boolean
  booleans_as_integers?: boolean
  collapse_vars?: boolean
  comparisons?: boolean
  computed_props?: boolean
  conditionals?: boolean
  dead_code?: boolean
  defaults?: boolean
  directives?: boolean
  drop_console?: boolean
  drop_debugger?: boolean
  ecma?: number | string
  evaluate?: boolean
  expression?: boolean
  global_defs?: Record<string, unknown>
  hoist_funs?: boolean
  hoist_props?: boolean
  hoist_vars?: boolean
  ie8?: boolean
  if_return?: boolean
  inline?: boolean | number
  join_vars?: boolean
  keep_classnames?: boolean
  keep_fargs?: boolean
  keep_fnames?: boolean
  keep_infinity?: boolean
  loops?: boolean
  negate_iife?: boolean
  passes?: number
  properties?: boolean
  pure_getters?: boolean | 'strict' | string
  pure_funcs?: string[]
  reduce_funcs?: boolean
  reduce_vars?: boolean
  sequences?: boolean | number
  side_effects?: boolean
  switches?: boolean
  top_retain?: string[] | string | null
  toplevel?: boolean | string
  typeofs?: boolean
  unsafe?: boolean
  unsafe_arrows?: boolean
  unsafe_comps?: boolean
  unsafe_Function?: boolean
  unsafe_math?: boolean
  unsafe_symbols?: boolean
  unsafe_methods?: boolean
  unsafe_proto?: boolean
  unsafe_regexp?: boolean
  unsafe_undefined?: boolean
  unused?: boolean
  module?: boolean
}

export interface MangleOptions {
  props?: {
    reserved?: string[]
    undeclared?: boolean
    regex?: null | string
  }
  toplevel?: boolean
  keep_classnames?: boolean
  keep_fnames?: boolean
  keep_private_props?: boolean
  ie8?: boolean
  safari10?: boolean
}

export interface TransformOptions {
  react?: {
    runtime?: 'automatic' | 'classic'
    importSource?: string
    pragma?: string
    pragmaFrag?: string
    throwIfNamespace?: boolean
    development?: boolean
    useBuiltins?: boolean
    refresh?: {
      refreshReg?: string
      refreshSig?: string
      emitFullSignatures?: boolean
    }
  }
  constModules?: {
    globals?: Record<string, Record<string, string>>
  }
  optimizer?: {
    globals?: {
      vars?: Record<string, string>
      envs?: string[] | Record<string, string>
      typeofs?: Record<string, string>
    }
    simplify?: boolean
    jsonify?: {
      minCost?: number
    }
  }
  legacyDecorator?: boolean
  decoratorMetadata?: boolean
}

export interface EnvOptions {
  targets?:
    | string
    | string[]
    | Record<
        | 'chrome'
        | 'opera'
        | 'edge'
        | 'firefox'
        | 'safari'
        | 'ie'
        | 'ios'
        | 'android'
        | 'node'
        | 'electron',
        string
      >
  mode?: 'usage' | 'entry'
  skip?: string[]
  dynamicImport?: boolean
  loose?: boolean
  include?: string[]
  exclude?: string[]
  coreJs?: 2 | 3 | '2' | '3'
  shippedProposals?: boolean
  forceAllTransforms?: boolean
  bugfixes?: boolean
}

export type ParseOnlyOptions = ParserOptions & {
  comments?: boolean
  is_module?: boolean
  target?: EsVersion
}

export interface AST {
  type: 'Module' | 'Script'
  body: unknown
  span: { start: number; end: number; ctxt: number }
}

export interface TransformationOutput {
  code: string
}

export const swcVersionAtom = atom(
  new URLSearchParams(location.search).get('version') ??
    process.env.NEXT_PUBLIC_SWC_VERSION
)

/** SWC renamed npm package since v1.2.166. */
export function getPackageName(version: string) {
  return semver.gt(version, '1.2.165') && semver.lte(version, '1.2.170')
    ? '@swc/binding_core_wasm'
    : '@swc/wasm-web'
}

export async function loadSwc(version: string): Promise<SwcModule> {
  const packageName = getPackageName(version)
  const entryFileName = semver.gt(version, '1.2.165')
    ? 'wasm-web.js'
    : 'wasm.js'
  const module: SwcModule = await import(
    /* webpackIgnore: true */
    `https://unpkg.com/${packageName}@${version}/${entryFileName}`
  )
  await module.default()
  return module
}

export type TransformationResult = Result<TransformationOutput, string>

export function transform({
  code,
  config,
  fileName,
  swc,
}: {
  code: string
  fileName: string
  config: Config
  swc: SwcModule
}): TransformationResult {
  try {
    return Ok(swc.transformSync(code, { ...config, filename: fileName }))
  } catch (error) {
    return handleSwcError(error)
  }
}

export type ParserResult = Result<AST, string>

export function parse({
  code,
  config,
  swc,
}: {
  code: string
  config: Config
  swc: SwcModule
}): ParserResult {
  try {
    return Ok(
      swc.parseSync(code, { ...config.jsc.parser, target: config.jsc.target })
    )
  } catch (error) {
    return handleSwcError(error)
  }
}

function handleSwcError(error: unknown): Err<string> {
  if (typeof error === 'string') {
    return Err(error)
  } else if (error instanceof Error) {
    return Err(`${error.toString()}\n\n${error.stack}`)
  } else {
    return Err(String(error))
  }
}

export const configSchema: JSONSchema6 = {
  type: 'object',
  properties: {
    jsc: {
      type: 'object',
      properties: {
        parser: {
          type: 'object',
          required: ['syntax'],
          oneOf: [
            {
              type: 'object',
              properties: {
                syntax: {
                  type: 'string',
                  enum: ['ecmascript'],
                },
                jsx: { type: 'boolean' },
                functionBind: { type: 'boolean' },
                decorators: { type: 'boolean' },
                decoratorsBeforeExport: { type: 'boolean' },
                exportDefaultFrom: { type: 'boolean' },
                importAssertions: { type: 'boolean' },
                staticBlocks: { type: 'boolean' },
                privateInObject: { type: 'boolean' },
              },
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                syntax: {
                  type: 'string',
                  enum: ['typescript'],
                },
                tsx: { type: 'boolean' },
                decorators: { type: 'boolean' },
              },
              additionalProperties: false,
            },
          ],
        },
        target: {
          type: 'string',
          enum: [
            'es3',
            'es5',
            'es2015',
            'es2016',
            'es2017',
            'es2018',
            'es2019',
            'es2020',
            'es2021',
            'es2022',
          ],
        },
        loose: { type: 'boolean' },
        minify: {
          type: 'object',
          properties: {
            compress: {
              anyOf: [
                { type: 'boolean' },
                {
                  type: 'object',
                  properties: {
                    arguments: { type: 'boolean' },
                    arrows: { type: 'boolean' },
                    booleans: { type: 'boolean' },
                    booleans_as_integers: { type: 'boolean' },
                    collapse_vars: { type: 'boolean' },
                    comparisons: { type: 'boolean' },
                    computed_props: { type: 'boolean' },
                    conditionals: { type: 'boolean' },
                    dead_code: { type: 'boolean' },
                    defaults: { type: 'boolean', default: true },
                    directives: { type: 'boolean' },
                    drop_console: { type: 'boolean' },
                    drop_debugger: { type: 'boolean' },
                    ecma: {
                      anyOf: [
                        { type: 'integer', minimum: 0 },
                        { type: 'string' },
                      ],
                    },
                    evaluate: { type: 'boolean' },
                    expression: { type: 'boolean' },
                    global_defs: { type: 'object' },
                    hoist_funs: { type: 'boolean' },
                    hoist_props: { type: 'boolean' },
                    hoist_vars: { type: 'boolean' },
                    ie8: { type: 'boolean' },
                    if_return: { type: 'boolean' },
                    inline: {
                      anyOf: [
                        { type: 'boolean' },
                        { type: 'integer', minimum: 0, maximum: 255 },
                      ],
                    },
                    join_vars: { type: 'boolean' },
                    keep_classnames: { type: 'boolean' },
                    keep_fargs: { type: 'boolean' },
                    keep_fnames: { type: 'boolean' },
                    keep_infinity: { type: 'boolean' },
                    loops: { type: 'boolean' },
                    negate_iife: { type: 'boolean' },
                    passes: { type: 'integer', minimum: 0 },
                    properties: { type: 'boolean' },
                    pure_getters: {
                      anyOf: [
                        { type: 'boolean' },
                        { type: 'string', enum: ['strict'] },
                        { type: 'string' },
                      ],
                    },
                    pure_funcs: { type: 'array', items: { type: 'string' } },
                    reduce_funcs: { type: 'boolean' },
                    reduce_vars: { type: 'boolean' },
                    sequences: {
                      anyOf: [
                        { type: 'boolean' },
                        { type: 'integer', minimum: 0, maximum: 255 },
                      ],
                    },
                    side_effects: { type: 'boolean' },
                    switches: { type: 'boolean' },
                    top_retain: {
                      anyOf: [
                        { type: 'array', items: { type: 'string' } },
                        { type: 'string' },
                        { type: 'null' },
                      ],
                    },
                    toplevel: {
                      anyOf: [{ type: 'boolean' }, { type: 'string' }],
                    },
                    typeofs: { type: 'boolean' },
                    unsafe: { type: 'boolean' },
                    unsafe_arrows: { type: 'boolean' },
                    unsafe_comps: { type: 'boolean' },
                    unsafe_Function: { type: 'boolean' },
                    unsafe_math: { type: 'boolean' },
                    unsafe_symbols: { type: 'boolean' },
                    unsafe_methods: { type: 'boolean' },
                    unsafe_proto: { type: 'boolean' },
                    unsafe_regexp: { type: 'boolean' },
                    unsafe_undefined: { type: 'boolean' },
                    unused: { type: 'boolean' },
                    module: { type: 'boolean' },
                  },
                  additionalProperties: false,
                },
              ],
            },
            mangle: {
              anyOf: [
                { type: 'boolean' },
                {
                  type: 'object',
                  properties: {
                    props: {
                      type: 'object',
                      properties: {
                        reserved: { type: 'array', items: { type: 'string' } },
                        undeclared: { type: 'boolean' },
                        regex: {
                          anyOf: [{ type: 'null' }, { type: 'string' }],
                        },
                      },
                      additionalProperties: false,
                    },
                    toplevel: { type: 'boolean' },
                    keep_classnames: { type: 'boolean' },
                    keep_fnames: { type: 'boolean' },
                    keep_private_props: { type: 'boolean' },
                    ie8: { type: 'boolean' },
                    safari10: { type: 'boolean' },
                  },
                  additionalProperties: false,
                },
              ],
            },
            format: { type: 'object' },
            ecma: {
              anyOf: [{ type: 'integer', minimum: 0 }, { type: 'string' }],
            },
            keepClassnames: { type: 'boolean' },
            keepFnames: { type: 'boolean' },
            module: { type: 'boolean' },
            safari10: { type: 'boolean' },
            toplevel: { type: 'boolean' },
            sourceMap: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                url: { type: 'string' },
                root: { type: 'string' },
                content: { type: 'string' },
              },
              additionalProperties: false,
            },
            outputPath: { type: 'string' },
            inlineSourcesContent: { type: 'boolean', default: true },
          },
          additionalProperties: false,
        },
        transform: {
          type: 'object',
          properties: {
            react: {
              type: 'object',
              properties: {
                runtime: {
                  type: 'string',
                  enum: ['automatic', 'classic'],
                },
                importSource: { type: 'string' },
                pragma: { type: 'string' },
                pragmaFrag: { type: 'string' },
                throwIfNamespace: { type: 'boolean' },
                development: { type: 'boolean' },
                useBuiltins: { type: 'boolean' },
                refresh: {
                  type: 'object',
                  properties: {
                    refreshReg: { type: 'string' },
                    refreshSig: { type: 'string' },
                    emitFullSignatures: { type: 'boolean' },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            constModules: {
              type: 'object',
              properties: {
                globals: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    additionalProperties: {
                      type: 'string',
                    },
                  },
                },
              },
              additionalProperties: false,
            },
            optimizer: {
              type: 'object',
              properties: {
                globals: {
                  type: 'object',
                  properties: {
                    vars: {
                      type: 'object',
                      additionalProperties: { type: 'string' },
                    },
                    envs: {
                      anyOf: [
                        { type: 'array', items: { type: 'string' } },
                        {
                          type: 'object',
                          additionalProperties: { type: 'string' },
                        },
                      ],
                    },
                    typeofs: {
                      type: 'object',
                      additionalProperties: { type: 'string' },
                    },
                  },
                  additionalProperties: false,
                },
                simplify: { type: 'boolean' },
                jsonify: {
                  type: 'object',
                  properties: { minCost: { type: 'integer', default: 1024 } },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            legacyDecorator: { type: 'boolean' },
            decoratorMetadata: { type: 'boolean' },
          },
          additionalProperties: false,
        },
        externalHelpers: { type: 'boolean', default: false },
        keepClassNames: { type: 'boolean', default: false },
        baseUrl: { type: 'string' },
        paths: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } },
        },
      },
      additionalProperties: false,
    },
    module: {
      type: 'object',
      anyOf: [
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['es6'],
            },
            strict: { type: 'boolean', default: false },
            strictMode: { type: 'boolean', default: true },
            lazy: { type: 'boolean', default: false },
            noInterop: { type: 'boolean', default: false },
          },
          additionalProperties: false,
        },
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['commonjs'],
            },
            strict: { type: 'boolean', default: false },
            strictMode: { type: 'boolean', default: true },
            lazy: { type: 'boolean', default: false },
            noInterop: { type: 'boolean', default: false },
          },
          additionalProperties: false,
        },
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['amd'],
            },
            moduleId: { type: 'string' },
            strict: { type: 'boolean', default: false },
            strictMode: { type: 'boolean', default: true },
            lazy: { type: 'boolean', default: false },
            noInterop: { type: 'boolean', default: false },
          },
          additionalProperties: false,
        },
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['umd'],
            },
            globals: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            strict: { type: 'boolean', default: false },
            strictMode: { type: 'boolean', default: true },
            lazy: { type: 'boolean', default: false },
            noInterop: { type: 'boolean', default: false },
          },
          additionalProperties: false,
        },
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['systemjs'],
            },
            allowTopLevelThis: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      ],
    },
    minify: {
      type: 'boolean',
    },
    isModule: {
      type: 'boolean',
    },
    env: {
      type: 'object',
      properties: {
        targets: {
          anyOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
            {
              type: 'object',
              properties: {
                chrome: { type: 'string' },
                opera: { type: 'string' },
                edge: { type: 'string' },
                firefox: { type: 'string' },
                safari: { type: 'string' },
                ie: { type: 'string' },
                ios: { type: 'string' },
                android: { type: 'string' },
                node: { type: 'string' },
                electron: { type: 'string' },
              },
            },
          ],
        },
        mode: { type: 'string', enum: ['usage', 'entry'] },
        skip: { type: 'array', items: { type: 'string' } },
        dynamicImport: { type: 'boolean' },
        loose: { type: 'boolean' },
        include: { type: 'array', items: { type: 'string' } },
        exclude: { type: 'array', items: { type: 'string' } },
        coreJs: {
          oneOf: [
            { type: 'integer', enum: [2, 3] },
            { type: 'string', enum: ['2', '3'] },
          ],
        },
        shippedProposals: { type: 'boolean' },
        forceAllTransforms: { type: 'boolean' },
        bugfixes: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    sourceMaps: {
      anyOf: [{ type: 'boolean' }, { type: 'string', enum: ['inline'] }],
    },
    inlineSourcesContent: { type: 'boolean' },
    experimental: { type: 'object', additionalProperties: false },
  },
  additionalProperties: false,
}
