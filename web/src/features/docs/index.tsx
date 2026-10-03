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
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Braces,
  CircleDollarSign,
  KeyRound,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Network,
  Settings2,
  TerminalSquare,
  Wrench,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { ApiCodeExamples } from './components/api-code-examples'
import { ClaudeCodeGuide } from './components/claude-code-guide'

function SectionHeading(props: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className='flex max-w-3xl flex-col gap-2'>
      <p className='text-primary text-sm font-semibold tracking-wide uppercase'>
        {props.eyebrow}
      </p>
      <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
        {props.title}
      </h2>
      <p className='text-muted-foreground text-base leading-7'>
        {props.description}
      </p>
    </div>
  )
}

function StepCard(props: {
  number: string
  title: string
  description: string
}) {
  return (
    <Card className='border-primary/15 bg-card/70 h-full'>
      <CardHeader>
        <div className='bg-primary/10 text-primary mb-2 flex size-9 items-center justify-center rounded-full text-sm font-bold'>
          {props.number}
        </div>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription className='leading-6'>
          {props.description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export function Docs() {
  const { t } = useTranslation()
  const navigation = [
    ['quick-start', t('docs.nav.quickStart')],
    ['protocols', t('docs.nav.protocols')],
    ['examples', t('docs.nav.examples')],
    ['clients', t('docs.nav.clients')],
    ['claude-code', t('docs.nav.claudeCode')],
    ['tools', t('docs.nav.tools')],
    ['billing', t('docs.nav.billing')],
    ['errors', t('docs.nav.errors')],
  ]

  const errorRows = [
    ['401', t('docs.errors.401')],
    ['403', t('docs.errors.403')],
    ['404', t('docs.errors.404')],
    ['429', t('docs.errors.429')],
    ['client_gone', t('docs.errors.clientGone')],
  ]

  const endpointRows = [
    [t('docs.endpoints.openaiSdk'), 'https://agamai.online/v1'],
    [t('docs.endpoints.claudeSdk'), 'https://agamai.online'],
    [t('docs.endpoints.claudeMessages'), 'POST /v1/messages'],
    [t('docs.endpoints.modelList'), 'GET /v1/models'],
  ]

  return (
    <PublicLayout showMainContainer={false}>
      <main className='relative isolate overflow-hidden pt-14'>
        <div className='bg-primary/10 absolute top-0 left-1/2 -z-10 h-[36rem] w-[70rem] -translate-x-1/2 rounded-full blur-3xl' />

        <section className='container px-4 pt-16 pb-14 sm:pt-24 sm:pb-20'>
          <div className='mx-auto flex max-w-4xl flex-col items-center gap-6 text-center'>
            <Badge variant='outline' className='border-primary/40 bg-primary/5'>
              <BookOpen className='size-3.5' />
              {t('docs.hero.badge')}
            </Badge>
            <div className='flex flex-col gap-4'>
              <h1 className='text-4xl font-semibold tracking-tight text-balance sm:text-6xl'>
                {t('docs.hero.title')}
              </h1>
              <p className='text-muted-foreground mx-auto max-w-2xl text-lg leading-8 text-balance'>
                {t('docs.hero.description')}
              </p>
            </div>
            <div className='flex flex-wrap justify-center gap-3'>
              <Button
                size='lg'
                render={<a href='#quick-start' />}
                nativeButton={false}
              >
                <Zap data-icon='inline-start' />
                {t('docs.hero.start')}
              </Button>
              <Button
                variant='outline'
                size='lg'
                render={<Link to='/pricing' />}
                nativeButton={false}
              >
                {t('docs.hero.models')}
                <ArrowRight data-icon='inline-end' />
              </Button>
            </div>
            <div className='border-border/70 bg-card/70 flex flex-col items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur sm:flex-row'>
              <div className='text-center sm:text-start'>
                <p className='text-sm font-medium'>
                  {t('docs.language.title')}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {t('docs.language.description')}
                </p>
              </div>
              <LanguageSwitcher showLabel align='center' />
            </div>
          </div>
        </section>

        <div className='container grid gap-10 px-4 pb-24 lg:grid-cols-[13rem_minmax(0,1fr)]'>
          <aside className='hidden lg:block'>
            <nav
              className='sticky top-24 flex flex-col gap-1'
              aria-label={t('docs.nav.label')}
            >
              {navigation.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className='text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-2 text-sm transition-colors'
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <div className='flex min-w-0 flex-col gap-20'>
            <section id='quick-start' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.quickStart.eyebrow')}
                title={t('docs.quickStart.title')}
                description={t('docs.quickStart.description')}
              />
              <div className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <StepCard
                  number='01'
                  title={t('docs.quickStart.step1.title')}
                  description={t('docs.quickStart.step1.description')}
                />
                <StepCard
                  number='02'
                  title={t('docs.quickStart.step2.title')}
                  description={t('docs.quickStart.step2.description')}
                />
                <StepCard
                  number='03'
                  title={t('docs.quickStart.step3.title')}
                  description={t('docs.quickStart.step3.description')}
                />
                <StepCard
                  number='04'
                  title={t('docs.quickStart.step4.title')}
                  description={t('docs.quickStart.step4.description')}
                />
              </div>
            </section>

            <section id='protocols' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.protocols.eyebrow')}
                title={t('docs.protocols.title')}
                description={t('docs.protocols.description')}
              />
              <div className='mt-8 grid gap-4 md:grid-cols-2'>
                <Card className='border-primary/20'>
                  <CardHeader>
                    <Network className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.protocol.openai.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.protocol.openai.description')}
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className='border-primary/20'>
                  <CardHeader>
                    <Braces className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.protocol.claude.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.protocol.claude.description')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
              <Alert className='border-primary/25 bg-primary/5 mt-4'>
                <AlertTriangle />
                <AlertTitle>{t('docs.compatibility.title')}</AlertTitle>
                <AlertDescription>
                  {t('docs.compatibility.description')}
                </AlertDescription>
              </Alert>
            </section>

            <section id='examples' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.examples.eyebrow')}
                title={t('docs.examples.title')}
                description={t('docs.examples.description')}
              />
              <div className='mt-8'>
                <ApiCodeExamples />
              </div>
              <Card className='mt-5'>
                <CardHeader>
                  <CardTitle>{t('docs.endpoints.title')}</CardTitle>
                  <CardDescription>
                    {t('docs.endpoints.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-0'>
                  {endpointRows.map(([label, value], index) => (
                    <div key={label}>
                      {index > 0 && <Separator />}
                      <div className='grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:items-center'>
                        <span className='text-muted-foreground text-sm'>
                          {label}
                        </span>
                        <code className='text-foreground overflow-x-auto text-sm'>
                          {value}
                        </code>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section id='clients' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.clients.eyebrow')}
                title={t('docs.clients.title')}
                description={t('docs.clients.description')}
              />
              <div className='mt-8 grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <Settings2 className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.clients.generic.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.clients.generic.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className='grid gap-3 text-sm'>
                      <div className='grid gap-1 sm:grid-cols-[7rem_1fr]'>
                        <dt className='text-muted-foreground'>
                          {t('docs.clients.baseUrl')}
                        </dt>
                        <dd>
                          <code>https://agamai.online/v1</code>
                        </dd>
                      </div>
                      <div className='grid gap-1 sm:grid-cols-[7rem_1fr]'>
                        <dt className='text-muted-foreground'>
                          {t('docs.clients.apiKey')}
                        </dt>
                        <dd>{t('docs.clients.yourKey')}</dd>
                      </div>
                      <div className='grid gap-1 sm:grid-cols-[7rem_1fr]'>
                        <dt className='text-muted-foreground'>
                          {t('docs.clients.model')}
                        </dt>
                        <dd>{t('docs.clients.exactModel')}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Braces className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.clients.claude.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.clients.claude.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className='grid gap-3 text-sm'>
                      <div className='grid gap-1 sm:grid-cols-[7rem_1fr]'>
                        <dt className='text-muted-foreground'>
                          {t('docs.clients.baseUrl')}
                        </dt>
                        <dd>
                          <code>https://agamai.online</code>
                        </dd>
                      </div>
                      <div className='grid gap-1 sm:grid-cols-[7rem_1fr]'>
                        <dt className='text-muted-foreground'>
                          {t('docs.clients.header')}
                        </dt>
                        <dd>
                          <code>x-api-key</code>
                        </dd>
                      </div>
                      <div className='grid gap-1 sm:grid-cols-[7rem_1fr]'>
                        <dt className='text-muted-foreground'>
                          {t('docs.clients.path')}
                        </dt>
                        <dd>
                          <code>/v1/messages</code>
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
              <Alert className='mt-4'>
                <ListChecks />
                <AlertTitle>{t('docs.clients.validation.title')}</AlertTitle>
                <AlertDescription>
                  {t('docs.clients.validation.description')}
                </AlertDescription>
              </Alert>
            </section>

            <section id='claude-code' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.claudeCode.eyebrow')}
                title={t('docs.claudeCode.title')}
                description={t('docs.claudeCode.description')}
              />
              <ClaudeCodeGuide />
            </section>

            <section id='tools' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.tools.eyebrow')}
                title={t('docs.tools.title')}
                description={t('docs.tools.description')}
              />
              <div className='mt-8 grid gap-4 md:grid-cols-3'>
                <Card>
                  <CardHeader>
                    <Wrench className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.tools.card1.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.tools.card1.description')}
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <TerminalSquare className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.tools.card2.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.tools.card2.description')}
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <LockKeyhole className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.tools.card3.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.tools.card3.description')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
              <Card className='mt-4 overflow-hidden'>
                <CardHeader>
                  <CardTitle>
                    {t('docs.tools.streamingExample.title')}
                  </CardTitle>
                  <CardDescription className='leading-6'>
                    {t('docs.tools.streamingExample.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className='bg-muted/50 overflow-x-auto rounded-lg p-4 text-xs leading-6'>
                    <code>{`{
  "model": "jmm-fable-5-1",
  "stream": true,
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}`}</code>
                  </pre>
                </CardContent>
              </Card>
            </section>

            <section id='billing' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.billing.eyebrow')}
                title={t('docs.billing.title')}
                description={t('docs.billing.description')}
              />
              <div className='mt-8 grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CircleDollarSign className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.billing.card1.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.billing.card1.description')}
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <KeyRound className='text-primary mb-2 size-6' />
                    <CardTitle>{t('docs.billing.card2.title')}</CardTitle>
                    <CardDescription className='leading-6'>
                      {t('docs.billing.card2.description')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

            <section id='errors' className='scroll-mt-24'>
              <SectionHeading
                eyebrow={t('docs.errors.eyebrow')}
                title={t('docs.errors.title')}
                description={t('docs.errors.description')}
              />
              <Card className='mt-8'>
                <CardContent className='flex flex-col gap-0 pt-1'>
                  {errorRows.map(([code, explanation], index) => (
                    <div key={code}>
                      {index > 0 && <Separator />}
                      <div className='grid gap-2 py-4 sm:grid-cols-[8rem_1fr]'>
                        <code className='text-primary font-semibold'>
                          {code}
                        </code>
                        <p className='text-muted-foreground leading-6'>
                          {explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className='border-primary/25 bg-primary/5 mt-6 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-start gap-3'>
                  <LifeBuoy className='text-primary mt-0.5 size-5 shrink-0' />
                  <div className='flex flex-col gap-1'>
                    <p className='font-medium'>{t('docs.support.title')}</p>
                    <p className='text-muted-foreground text-sm leading-6'>
                      {t('docs.support.description')}
                    </p>
                  </div>
                </div>
                <Button
                  variant='outline'
                  render={
                    <a
                      href='https://t.me/agam_ai'
                      target='_blank'
                      rel='noopener noreferrer'
                    />
                  }
                  nativeButton={false}
                >
                  Telegram
                  <ArrowRight data-icon='inline-end' />
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </PublicLayout>
  )
}
