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
import { CheckCircle2, Settings2, TerminalSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const shellSetup = `export ANTHROPIC_BASE_URL="https://agamai.online"
export ANTHROPIC_AUTH_TOKEN="YOUR_AGAM_API_KEY"
export CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1

claude`

const powerShellSetup = `$env:ANTHROPIC_BASE_URL = "https://agamai.online"
$env:ANTHROPIC_AUTH_TOKEN = "YOUR_AGAM_API_KEY"
$env:CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = "1"

claude`

const persistentSetup = `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://agamai.online",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_AGAM_API_KEY",
    "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY": "1"
  }
}`

export function ClaudeCodeGuide() {
  const { t } = useTranslation()

  return (
    <div className='mt-8 flex flex-col gap-4'>
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <Settings2 className='text-primary mb-2 size-6' />
            <CardTitle>{t('docs.claudeCode.step1.title')}</CardTitle>
            <CardDescription className='leading-6'>
              {t('docs.claudeCode.step1.description')}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <TerminalSquare className='text-primary mb-2 size-6' />
            <CardTitle>{t('docs.claudeCode.step2.title')}</CardTitle>
            <CardDescription className='leading-6'>
              {t('docs.claudeCode.step2.description')}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CheckCircle2 className='text-primary mb-2 size-6' />
            <CardTitle>{t('docs.claudeCode.step3.title')}</CardTitle>
            <CardDescription className='leading-6'>
              {t('docs.claudeCode.step3.description')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle>{t('docs.claudeCode.terminal.title')}</CardTitle>
          <CardDescription className='leading-6'>
            {t('docs.claudeCode.terminal.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='shell'>
            <TabsList aria-label={t('docs.claudeCode.setupSelector')}>
              <TabsTrigger value='shell'>Bash / Zsh</TabsTrigger>
              <TabsTrigger value='powershell'>PowerShell</TabsTrigger>
            </TabsList>
            <TabsContent value='shell' className='mt-3'>
              <CodeBlock code={shellSetup} language='bash'>
                <CodeBlockCopyButton />
              </CodeBlock>
            </TabsContent>
            <TabsContent value='powershell' className='mt-3'>
              <CodeBlock code={powerShellSetup} language='powershell'>
                <CodeBlockCopyButton />
              </CodeBlock>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle>{t('docs.claudeCode.persistent.title')}</CardTitle>
          <CardDescription className='leading-6'>
            {t('docs.claudeCode.persistent.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <p className='text-muted-foreground text-sm'>
            <code>~/.claude/settings.json</code> ·{' '}
            {t('docs.claudeCode.windows')}:{' '}
            <code>%USERPROFILE%\\.claude\\settings.json</code>
          </p>
          <CodeBlock code={persistentSetup} language='json'>
            <CodeBlockCopyButton />
          </CodeBlock>
        </CardContent>
      </Card>

      <Alert className='border-primary/25 bg-primary/5'>
        <CheckCircle2 />
        <AlertTitle>{t('docs.claudeCode.verify.title')}</AlertTitle>
        <AlertDescription>
          {t('docs.claudeCode.verify.description')}
        </AlertDescription>
      </Alert>
    </div>
  )
}
