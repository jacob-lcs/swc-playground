import type * as SwcStripTypes from "@swc/wasm-typescript-esm";
import semver from "semver";
import { Err, Ok, type Result } from "ts-results";

interface SwcModule {
  default(): Promise<unknown>;
  parseSync(code: string, options: ParseOnlyOptions): AST;
  transformSync(code: string, options: Config): TransformationOutput;
}

export interface Config {
  jsc: {
    parser: ParserOptions;
    target?: EsVersion;
    loose?: boolean;
    minify?: {
      compress?: boolean | CompressOptions;
      mangle?: boolean | MangleOptions;
      format?: Record<string, unknown>;
      ecma?: number | string;
      keepClassnames?: boolean;
      keepFnames?: boolean;
      module?: boolean;
      safari10?: boolean;
      toplevel?: boolean;
      sourceMap?: boolean | TerserSourceMapOption;
      outputPath?: string;
      inlineSourcesContent?: boolean;
      emitSourceMapColumns?: boolean;
    };
    transform?: TransformOptions;
    externalHelpers?: boolean;
    keepClassNames?: boolean;
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
  module?: ModuleOptions;
  minify?: boolean;
  env?: EnvOptions;
  isModule?: boolean | "unknown";
  sourceMaps?: boolean | "inline";
  inlineSourcesContent?: boolean;
  experimental?: Record<never, never>;
  filename?: string;
}

export type ParserOptions =
  | {
      syntax: "ecmascript";
      jsx?: boolean;
      functionBind?: boolean;
      decorators?: boolean;
      decoratorsBeforeExport?: boolean;
      exportDefaultFrom?: boolean;
      importAssertions?: boolean;
      staticBlocks?: boolean;
      privateInObject?: boolean;
    }
  | {
      syntax: "typescript";
      tsx?: boolean;
      decorators?: boolean;
    };

export type EsVersion =
  | "es3"
  | "es5"
  | "es2015"
  | "es2016"
  | "es2017"
  | "es2018"
  | "es2019"
  | "es2020"
  | "es2021"
  | "es2022"
  | "es2023"
  | "es2024";

export type ModuleOptions =
  | {
      type: "es6";
      strict?: boolean;
      strictMode?: boolean;
      lazy?: boolean;
      noInterop?: boolean;
    }
  | {
      type: "commonjs";
      strict?: boolean;
      strictMode?: boolean;
      lazy?: boolean;
      noInterop?: boolean;
    }
  | {
      type: "amd";
      moduleId?: string;
      strict?: boolean;
      strictMode?: boolean;
      lazy?: boolean;
      noInterop?: boolean;
    }
  | {
      type: "umd";
      globals?: Record<string, string>;
      strict?: boolean;
      strictMode?: boolean;
      lazy?: boolean;
      noInterop?: boolean;
    }
  | {
      type: "systemjs";
      allowTopLevelThis?: boolean;
    };

export interface CompressOptions {
  arguments?: boolean;
  arrows?: boolean;
  booleans?: boolean;
  booleans_as_integers?: boolean;
  collapse_vars?: boolean;
  comparisons?: boolean;
  computed_props?: boolean;
  conditionals?: boolean;
  dead_code?: boolean;
  defaults?: boolean;
  directives?: boolean;
  drop_console?: boolean;
  drop_debugger?: boolean;
  ecma?: number | string;
  evaluate?: boolean;
  expression?: boolean;
  global_defs?: Record<string, string>;
  hoist_funs?: boolean;
  hoist_props?: boolean;
  hoist_vars?: boolean;
  ie8?: boolean;
  if_return?: boolean;
  inline?: boolean | number;
  join_vars?: boolean;
  keep_classnames?: boolean;
  keep_fargs?: boolean;
  keep_fnames?: boolean;
  keep_infinity?: boolean;
  loops?: boolean;
  negate_iife?: boolean;
  passes?: number;
  properties?: boolean;
  pure_getters?: boolean | "strict" | string;
  pure_funcs?: string[];
  reduce_funcs?: boolean;
  reduce_vars?: boolean;
  sequences?: boolean | number;
  side_effects?: boolean;
  switches?: boolean;
  top_retain?: string[] | string | null;
  toplevel?: boolean | string;
  typeofs?: boolean;
  unsafe?: boolean;
  unsafe_arrows?: boolean;
  unsafe_comps?: boolean;
  unsafe_Function?: boolean;
  unsafe_math?: boolean;
  unsafe_symbols?: boolean;
  unsafe_methods?: boolean;
  unsafe_proto?: boolean;
  unsafe_regexp?: boolean;
  unsafe_undefined?: boolean;
  unused?: boolean;
  module?: boolean;
  const_to_let?: boolean;
  pristine_globals?: boolean;
}

export interface MangleOptions {
  props?: {
    reserved?: string[];
    undeclared?: boolean;
    regex?: null | string;
  };
  toplevel?: boolean;
  keep_classnames?: boolean;
  keep_fnames?: boolean;
  keep_private_props?: boolean;
  ie8?: boolean;
  safari10?: boolean;
}

export interface TerserSourceMapOption {
  filename?: string;
  url?: string;
  root?: string;
  content?: string;
}

export interface TransformOptions {
  react?: {
    runtime?: "automatic" | "classic";
    importSource?: string;
    pragma?: string;
    pragmaFrag?: string;
    throwIfNamespace?: boolean;
    development?: boolean;
    useBuiltins?: boolean;
    refresh?: {
      refreshReg?: string;
      refreshSig?: string;
      emitFullSignatures?: boolean;
    };
  };
  constModules?: {
    globals?: Record<string, Record<string, string>>;
  };
  optimizer?: {
    globals?: {
      vars?: Record<string, string>;
      envs?: string[] | Record<string, string>;
      typeofs?: Record<string, string>;
    };
    simplify?: boolean;
    jsonify?: {
      minCost?: number;
    };
  };
  legacyDecorator?: boolean;
  decoratorMetadata?: boolean;
  useDefineForClassFields?: boolean;
  verbatimModuleSyntax?: boolean;
}

export interface EnvOptions {
  targets?:
    | string
    | string[]
    | Record<
        | "chrome"
        | "opera"
        | "edge"
        | "firefox"
        | "safari"
        | "ie"
        | "ios"
        | "android"
        | "node"
        | "electron",
        string
      >;
  mode?: "usage" | "entry";
  skip?: string[];
  dynamicImport?: boolean;
  loose?: boolean;
  include?: string[];
  exclude?: string[];
  coreJs?: 2 | 3 | string;
  shippedProposals?: boolean;
  forceAllTransforms?: boolean;
  bugfixes?: boolean;
}

export type ParseOnlyOptions = ParserOptions & {
  comments?: boolean;
  isModule?: boolean | "unknown";
  target?: EsVersion;
};

export interface AST {
  type: "Module" | "Script";
  body: unknown;
  span: { start: number; end: number; ctxt: number };
}

export interface TransformationOutput {
  code: string;
}

/** SWC renamed npm package since v1.2.166. */
export function getPackageName(version: string) {
  return semver.gt(version, "1.2.165") && semver.lte(version, "1.2.170")
    ? "@swc/binding_core_wasm"
    : "@swc/wasm-web";
}

export function loadSwc(
  version: string
): Promise<[SwcModule, typeof SwcStripTypes | null]> {
  return Promise.all([
    loadSwcCore(version),
    semver.gte(version, "1.7.1") ? loadSwcStripTypes(version) : null,
  ]);
}

async function loadSwcCore(version: string): Promise<SwcModule> {
  const packageName = getPackageName(version);
  const entryFileName =
    semver.gt(version, "1.2.165") && semver.lt(version, "1.6.7")
      ? "wasm-web.js"
      : "wasm.js";
  const swcModule: SwcModule = await import(
    /* webpackIgnore: true */
    `https://unpkg.com/${packageName}@${version}/${entryFileName}`
  );
  await swcModule.default();
  return swcModule;
}

async function loadSwcStripTypes(
  version: string
): Promise<typeof SwcStripTypes> {
  const swcModule: typeof SwcStripTypes = await import(
    /* webpackIgnore: true */
    `https://unpkg.com/@swc/wasm-typescript-esm@${version}/wasm.js`
  );
  await swcModule.default();
  return swcModule;
}

export type TransformationResult = Result<TransformationOutput, string>;

export function transform({
  code,
  config,
  fileName,
  swc,
}: {
  code: string;
  fileName: string;
  config: Config;
  swc: SwcModule;
}): TransformationResult {
  try {
    return Ok(swc.transformSync(code, { ...config, filename: fileName }));
  } catch (error) {
    return handleSwcError(error);
  }
}

export type ParserResult = Result<AST, string>;

export function parse({
  code,
  config,
  swc,
}: {
  code: string;
  config: Config;
  swc: SwcModule;
}): ParserResult {
  try {
    return Ok(
      swc.parseSync(code, {
        ...config.jsc.parser,
        target: config.jsc.target,
        isModule: config.isModule ?? "unknown",
      })
    );
  } catch (error) {
    return handleSwcError(error);
  }
}

function handleSwcError(error: unknown): Err<string> {
  if (typeof error === "string") {
    return Err(error);
  } else if (error instanceof Error) {
    return Err(`${error.toString()}\n\n${error.stack}`);
  } else {
    return Err(String(error));
  }
}

type StripTypeError = Record<"code" | "message", string>;

function isStripTypeError(error: unknown): error is StripTypeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

type StripTypeError = Record<"code" | "message", string>;

function isStripTypeError(error: unknown): error is StripTypeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

export function stripTypes({
  code,
  config,
  fileName,
  swc,
}: {
  code: string;
  config: Config;
  fileName: string;
  swc: typeof SwcStripTypes;
}): Result<SwcStripTypes.TransformOutput, string> {
  try {
    return Ok(
      swc.transformSync(code, {
        filename: fileName,
        module:
          typeof config.isModule === "boolean" ? config.isModule : undefined,
      })
    );
  } catch (error) {
    return handleSwcError(error);
  }
}
