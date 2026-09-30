/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  type ApiProtocol,
  type CodeLanguage,
  codeSamples,
} from '../code-samples'

const languages: { id: CodeLanguage; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'curl', label: 'cURL' },
  { id: 'powershell', label: 'PowerShell' },
]

function CodePanel(props: { protocol: ApiProtocol }) {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<CodeLanguage>('python')
  const [copied, setCopied] = useState(false)
  const code = codeSamples[props.protocol][language]

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Tabs
      value={language}
      onValueChange={(value) => setLanguage(value as CodeLanguage)}
      className='gap-0'
    >
      <div className='border-border bg-muted/40 flex items-center justify-between gap-2 border-b px-3 py-2'>
        <TabsList
          aria-label={t('docs.examples.languageSelector')}
          className='h-auto max-w-[calc(100%-2.5rem)] justify-start overflow-x-auto'
        >
          {languages.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className='px-2.5 py-1'>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={t('docs.examples.copyCode')}
          onClick={copyCode}
        >
          {copied ? <Check className='text-primary' /> : <Copy />}
        </Button>
      </div>
      {languages.map((item) => (
        <TabsContent key={item.id} value={item.id} className='m-0'>
          <pre className='max-h-[34rem] overflow-auto p-4 text-[0.78rem] leading-6'>
            <code>{codeSamples[props.protocol][item.id]}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function ApiCodeExamples() {
  const { t } = useTranslation()

  return (
    <Tabs defaultValue='openai' className='gap-4'>
      <TabsList aria-label={t('docs.examples.protocolSelector')}>
        <TabsTrigger value='openai'>
          {t('docs.protocol.openai.title')}
        </TabsTrigger>
        <TabsTrigger value='claude'>
          {t('docs.protocol.claude.title')}
        </TabsTrigger>
      </TabsList>
      <div className='border-border bg-card overflow-hidden rounded-xl border shadow-sm'>
        <TabsContent value='openai' className='m-0'>
          <CodePanel protocol='openai' />
        </TabsContent>
        <TabsContent value='claude' className='m-0'>
          <CodePanel protocol='claude' />
        </TabsContent>
      </div>
    </Tabs>
  )
}
