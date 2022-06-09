import { useEffect, useMemo, useState } from 'react'
import { useAtom } from 'jotai'
import useSWR from 'swr'
import { Center, CircularProgress, useToast, VStack } from '@chakra-ui/react'
import styled from '@emotion/styled'
import { loader } from '@monaco-editor/react'
import { Err } from 'ts-results'
import { codeAtom, fileNameAtom, swcConfigAtom } from '../state'
import { loadSwc, parse, swcVersionAtom, transform } from '../swc'
import type { AST } from '../swc'

import Configuration from './Configuration'
import VersionSelect from './VersionSelect'
import InputEditor from './InputEditor'
import OutputEditor from './OutputEditor'

loader.config({
  paths: { vs: 'https://unpkg.com/monaco-editor@0.33.0/min/vs/' },
})

const Main = styled.main`
  display: grid;
  padding: 1em;
  gap: 1em;

  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas: 'sidebar' 'input' 'output';

  min-height: 88vh;

  @media screen and (min-width: 600px) {
    grid-template-columns: 256px 1fr;
    grid-template-rows: repeat(2, 1fr);
    grid-template-areas: 'sidebar input' 'sidebar output';

    min-height: calc(100vh - 80px);
  }

  @media screen and (min-width: 1200px) {
    grid-template-columns: 256px repeat(2, 1fr);
    grid-template-rows: 1fr;
    grid-template-areas: 'sidebar input output';

    min-height: calc(100vh - 80px);
  }
`

export default function Workspace() {
  const { data: monaco } = useSWR('monaco', () => loader.init())
  const [swcVersion] = useAtom(swcVersionAtom)
  const { data: swc, error } = useSWR(swcVersion, loadSwc)
  const [code] = useAtom(codeAtom)
  const [swcConfig] = useAtom(swcConfigAtom)
  const [fileName] = useAtom(fileNameAtom)
  const [viewMode, setViewMode] = useState('code')
  const output = useMemo(() => {
    if (error) {
      return Err(String(error))
    }

    if (!swc) {
      return Err('Loading swc...')
    }

    switch (viewMode) {
      case 'ast':
        return parse({ code, config: swcConfig, swc })
      case 'code':
      default:
        return transform({ code, fileName, config: swcConfig, swc })
    }
  }, [code, fileName, swc, error, swcConfig, viewMode])
  const toast = useToast()

  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load swc.',
        description: String(error),
        status: 'error',
        duration: 5000,
        position: 'top',
        isClosable: true,
      })
    }
  }, [error, toast])

  const isLoadingMonaco = !monaco
  if (isLoadingMonaco && !swc) {
    return (
      <Center width="full" height="88vh" display="flex" flexDirection="column">
        <CircularProgress isIndeterminate mb="3" />
        <div>
          Loading swc {swcVersion}
          {isLoadingMonaco && ' and editor'}...
        </div>
      </Center>
    )
  }

  if (output.ok === true && viewMode === 'ast') {
    const val = output.val as AST
    adjustOffsetOfAst(val, val.span.start)
  }

  return (
    <Main>
      <VStack spacing={4} alignItems="unset" gridArea="sidebar">
        <Configuration />
        <VersionSelect isLoadingSwc={!swc && !error} />
      </VStack>
      <InputEditor output={output} />
      <OutputEditor
        output={output}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </Main>
  )
}

function adjustOffsetOfAst(obj: unknown, startOffset: number) {
  if (Array.isArray(obj)) {
    obj.forEach((item) => adjustOffsetOfAst(item, startOffset))
  } else if (isRecord(obj)) {
    Object.entries(obj).forEach(([key, value]) => {
      if (key === 'span' && value && isSpan(value)) {
        const span = value
        span.start -= startOffset
        span.end -= startOffset
      } else {
        adjustOffsetOfAst(obj[key], startOffset)
      }
    })
  }
}

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null
}

function isSpan(obj: unknown): obj is { start: number; end: number } {
  return (
    typeof obj === 'object' && obj !== null && 'start' in obj && 'end' in obj
  )
}
