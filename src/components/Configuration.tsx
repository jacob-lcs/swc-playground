import {
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Switch,
  VStack,
} from '@chakra-ui/react'
import { useAtom } from 'jotai'
import { Base64 } from 'js-base64'
import { applyEdits, format, modify } from 'jsonc-parser'
import { ungzip } from 'pako'
import { useEffect } from 'react'
import type * as React from 'react'
import semver from 'semver'
import {
  defaultCompressOptions,
  defaultEnvOptions,
  defaultMangleOptions,
  parsedSwcConfigAtom,
  swcConfigAtom,
} from '../state'
import { type ParserOptions } from '../swc'
import { JSONC_FORMATTING_OPTIONS, useBgColor, useBorderColor } from '../utils'
import CompressOptionsModal from './CompressOptionsModal'
import ConfigEditorModal from './ConfigEditorModal'
import MangleOptionsModal from './MangleOptionsModal'

const STORAGE_KEY = 'v1.config'

interface Props {
  swcVersion: string
  stripTypes: boolean
  onStripTypesChange(value: boolean): void
}

export default function Configuration(props: Props) {
  const [swcConfig, setSwcConfig] = useAtom(swcConfigAtom)
  const [parsedSwcConfig] = useAtom(parsedSwcConfigAtom)
  const bg = useBgColor()
  const borderColor = useBorderColor()

  useEffect(() => {
    const url = new URL(location.href)
    const encodedConfig = url.searchParams.get('config')
    const storedConfig = localStorage.getItem(STORAGE_KEY)
    const configJSON = encodedConfig
      ? ungzip(Base64.toUint8Array(encodedConfig), { to: 'string' })
      : storedConfig
    if (!configJSON) {
      return
    }
    if (configJSON.startsWith('{"')) {
      // pretty format JSON
      setSwcConfig(
        applyEdits(
          configJSON,
          format(configJSON, undefined, JSONC_FORMATTING_OPTIONS)
        )
      )
    } else {
      setSwcConfig(configJSON)
    }
  }, [setSwcConfig])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, swcConfig)
  }, [swcConfig])

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSwcConfig((config) => {
      const jsxOrTsx = parsedSwcConfig.jsc.parser.syntax === 'typescript'
        ? parsedSwcConfig.jsc.parser.tsx
        : parsedSwcConfig.jsc.parser.jsx
      const parserOptions: ParserOptions = event.target.value === 'typescript'
        ? { syntax: 'typescript', tsx: jsxOrTsx }
        : { syntax: 'ecmascript', jsx: jsxOrTsx }

      return applyEdits(
        config,
        modify(config, ['jsc', 'parser'], parserOptions, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    })
  }

  const handleTargetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['jsc', 'target'], event.target.value, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleModuleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(
          config,
          ['module'],
          { type: event.target.value },
          {
            formattingOptions: JSONC_FORMATTING_OPTIONS,
          }
        )
      )
    )
  }

  const handleSourceTypeChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLSelectElement>) => {
    const isModule = (() => {
      switch (value) {
        case 'module':
          return true
        case 'script':
          return false
        default:
          return 'unknown'
      }
    })()
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['isModule'], isModule, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleJSX = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['jsc', 'parser', 'jsx'], event.target.checked, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleTSX = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['jsc', 'parser', 'tsx'], event.target.checked, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleMinify = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['minify'], event.target.checked, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleCompress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const options = event.target.checked ? defaultCompressOptions : false
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['jsc', 'minify', 'compress'], options, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleMangle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const options = event.target.checked ? defaultMangleOptions : false
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['jsc', 'minify', 'mangle'], options, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleLoose = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['jsc', 'loose'], event.target.checked, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleEnvTargets = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const options = event.target.checked ? defaultEnvOptions : undefined
    setSwcConfig((config) =>
      applyEdits(
        config,
        [
          ...modify(config, ['env'], options, {
            formattingOptions: JSONC_FORMATTING_OPTIONS,
          }),
          ...modify(
            config,
            ['jsc', 'target'],
            event.target.checked ? undefined : 'es5',
            {
              formattingOptions: JSONC_FORMATTING_OPTIONS,
              getInsertionIndex: (properties) => properties.indexOf('parser') + 1,
            }
          ),
        ]
      )
    )
  }

  const handleEnvTargetsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(config, ['env', 'targets'], event.target.value, {
          formattingOptions: JSONC_FORMATTING_OPTIONS,
        })
      )
    )
  }

  const handleToggleEnvBugfixes = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSwcConfig((config) =>
      applyEdits(
        config,
        modify(
          config,
          ['env', 'bugfixes'],
          event.target.checked ? true : undefined,
          { formattingOptions: JSONC_FORMATTING_OPTIONS }
        )
      )
    )
  }

  return (
    <Flex direction="column">
      <Heading size="md" mb="8px">
        Configuration
      </Heading>
      <Flex
        direction="column"
        p="2"
        bg={bg}
        borderColor={borderColor}
        borderWidth="1px"
      >
        <VStack spacing="2">
          <FormControl>
            <FormLabel htmlFor="swc-syntax">Language</FormLabel>
            <Select
              id="swc-syntax"
              value={parsedSwcConfig.jsc.parser.syntax}
              onInput={handleLanguageChange}
            >
              <option value="ecmascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
            </Select>
          </FormControl>
          <FormControl isDisabled={parsedSwcConfig.env?.targets != null}>
            <FormLabel htmlFor="swc-target">Target</FormLabel>
            <Select
              id="swc-target"
              value={parsedSwcConfig.jsc.target}
              onChange={handleTargetChange}
            >
              <option value="es3">ES3</option>
              <option value="es5">ES5</option>
              <option value="es2015">ES2015</option>
              <option value="es2016">ES2016</option>
              <option value="es2017">ES2017</option>
              <option value="es2018">ES2018</option>
              <option value="es2019">ES2019</option>
              <option value="es2020">ES2020</option>
              <option value="es2021">ES2021</option>
              <option value="es2022">ES2022</option>
              <option value="es2023">ES2023</option>
              <option value="es2024">ES2024</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="swc-module">Module</FormLabel>
            <Select
              id="swc-module"
              value={parsedSwcConfig.module?.type}
              onChange={handleModuleChange}
            >
              <option value="es6">ES Modules</option>
              <option value="commonjs">CommonJS</option>
              <option value="amd">AMD</option>
              <option value="umd">UMD</option>
              <option value="systemjs">SystemJS</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="swc-source-type">Source Type</FormLabel>
            <Select
              id="swc-source-type"
              value={parsedSwcConfig.isModule === 'unknown'
                ? 'unknown'
                : parsedSwcConfig.isModule
                ? 'module'
                : 'script'}
              onChange={handleSourceTypeChange}
            >
              <option value="module">Module</option>
              <option value="script">Script</option>
              <option value="unknown">Unknown</option>
            </Select>
          </FormControl>
          {parsedSwcConfig.jsc.parser.syntax === 'ecmascript'
            ? (
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="swc-jsx"
                  isChecked={parsedSwcConfig.jsc.parser.jsx}
                  onChange={handleToggleJSX}
                />
                <FormLabel htmlFor="swc-jsx" ml="2" mb="0">
                  JSX
                </FormLabel>
              </FormControl>
            )
            : (
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="swc-tsx"
                  isChecked={parsedSwcConfig.jsc.parser.tsx}
                  onChange={handleToggleTSX}
                />
                <FormLabel htmlFor="swc-tsx" ml="2" mb="0">
                  TSX
                </FormLabel>
              </FormControl>
            )}
          <FormControl display="flex" alignItems="center">
            <Switch
              id="swc-loose"
              isChecked={parsedSwcConfig.jsc.loose}
              onChange={handleToggleLoose}
            />
            <FormLabel htmlFor="swc-loose" ml="2" mb="0">
              Loose
            </FormLabel>
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <Switch
              id="swc-minify"
              isChecked={parsedSwcConfig.minify}
              onChange={handleToggleMinify}
            />
            <FormLabel htmlFor="swc-minify" ml="2" mb="0">
              Minify
            </FormLabel>
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <Switch
              id="swc-compress"
              isChecked={!!parsedSwcConfig.jsc?.minify?.compress}
              onChange={handleToggleCompress}
            />
            <FormLabel htmlFor="swc-copress" ml="2" mb="0">
              Compress
            </FormLabel>
            {parsedSwcConfig.jsc?.minify?.compress && <CompressOptionsModal />}
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <Switch
              id="swc-mangle"
              isChecked={!!parsedSwcConfig.jsc?.minify?.mangle}
              onChange={handleToggleMangle}
            />
            <FormLabel htmlFor="swc-mangle" ml="2" mb="0">
              Mangle
            </FormLabel>
            {parsedSwcConfig.jsc?.minify?.mangle && <MangleOptionsModal />}
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <Switch
              id="swc-env-targets"
              isChecked={parsedSwcConfig.env?.targets != null}
              onChange={handleToggleEnvTargets}
            />
            <FormLabel htmlFor="swc-env-targets" ml="2" mb="0">
              Env Targets
            </FormLabel>
          </FormControl>
          {typeof parsedSwcConfig.env?.targets === 'string' && (
            <>
              <FormControl display="flex" alignItems="center">
                <Input
                  display="block"
                  placeholder="Browserslist query"
                  value={parsedSwcConfig.env.targets}
                  onChange={handleEnvTargetsChange}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="swc-env-bugfixes"
                  isChecked={parsedSwcConfig.env?.bugfixes == true}
                  onChange={handleToggleEnvBugfixes}
                />
                <FormLabel htmlFor="swc-env-bugfixes" ml="2" mb="0">
                  Bugfixes
                </FormLabel>
              </FormControl>
            </>
          )}
          <FormControl display="flex" alignItems="center">
            <Switch
              id="strip-types"
              isChecked={props.stripTypes}
              onChange={(event) => props.onStripTypesChange(event.target.checked)}
              disabled={semver.lt(props.swcVersion, '1.7.1')}
            />
            <FormLabel htmlFor="strip-types" ml="2" mb="0">
              Strip Types Only
            </FormLabel>
          </FormControl>
        </VStack>
        <ConfigEditorModal />
      </Flex>
    </Flex>
  )
}
