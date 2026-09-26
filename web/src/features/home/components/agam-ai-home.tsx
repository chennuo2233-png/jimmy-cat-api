/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  KeyRound,
  Network,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

type AgamAiHomeProps = {
  isAuthenticated: boolean
}

export function AgamAiHome(props: AgamAiHomeProps) {
  const { t } = useTranslation()
  const primaryHref = props.isAuthenticated ? '/dashboard' : '/sign-up'
  const primaryLabel = props.isAuthenticated
    ? t('Go to Dashboard')
    : t('Create account')

  const advantages = [
    {
      icon: Network,
      title: t('Unified model access'),
      description: t('Reach leading AI models through one consistent API.'),
    },
    {
      icon: ReceiptText,
      title: t('Transparent usage'),
      description: t('Understand usage and costs with clear account records.'),
    },
    {
      icon: ShieldCheck,
      title: t('Reliable by design'),
      description: t(
        'A focused gateway designed for steady, everyday API work.'
      ),
    },
  ]

  return (
    <main className='relative overflow-hidden pt-16'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(circle_at_76%_16%,rgba(201,148,55,0.16),transparent_34%),radial-gradient(circle_at_18%_20%,rgba(133,94,35,0.10),transparent_32%)]'
      />

      <section className='relative px-6 pt-16 pb-24 md:pt-28 md:pb-32'>
        <div className='mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-20'>
          <AnimateInView className='max-w-2xl' animation='fade-up'>
            <div className='border-primary/25 bg-primary/8 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase'>
              <Sparkles aria-hidden='true' className='size-3.5' />
              {t('AGAM AI · Unified model access')}
            </div>
            <h1 className='text-4xl leading-[1.04] font-semibold tracking-[-0.035em] text-balance md:text-6xl lg:text-7xl'>
              {t('One API. Many models. Built for decisive work.')}
            </h1>
            <p className='text-muted-foreground mt-7 max-w-xl text-base leading-relaxed md:text-lg'>
              {t(
                'AGAM AI gives developers and teams a clear gateway to leading AI models, with transparent usage and a workflow made for real products.'
              )}
            </p>
            <div className='mt-9 flex flex-wrap items-center gap-3'>
              <Button
                className='bg-primary text-primary-foreground hover:bg-primary/90 group rounded-xl px-5'
                render={<Link to={primaryHref} />}
              >
                {primaryLabel}
                <ArrowRight
                  aria-hidden='true'
                  className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5'
                />
              </Button>
              <Button
                variant='outline'
                className='rounded-xl px-5'
                render={<a href='#platform' />}
              >
                {t('Explore the platform')}
              </Button>
            </div>
          </AnimateInView>

          <AnimateInView
            className='mx-auto w-full max-w-[31rem]'
            animation='scale-in'
            delay={120}
          >
            <div className='border-primary/25 relative rounded-[2rem] border bg-black p-3 shadow-[0_34px_100px_-45px_rgba(180,120,28,0.75)]'>
              <div
                aria-hidden='true'
                className='absolute -inset-px rounded-[2rem] bg-gradient-to-br from-amber-400/25 via-transparent to-amber-800/15'
              />
              <img
                src='/agam-ai-logo.webp'
                alt='AGAM AI'
                width={768}
                height={768}
                fetchPriority='high'
                decoding='async'
                className='relative aspect-square w-full rounded-[1.45rem] object-cover'
              />
            </div>
          </AnimateInView>
        </div>
      </section>

      <section
        id='platform'
        className='border-border/50 border-y px-6 py-20 md:py-24'
      >
        <div className='mx-auto max-w-6xl'>
          <AnimateInView className='mb-10 max-w-2xl' animation='fade-up'>
            <p className='text-primary mb-3 text-xs font-semibold tracking-[0.18em] uppercase'>
              {t('Built for decisive teams')}
            </p>
            <h2 className='text-3xl font-semibold tracking-tight text-balance md:text-4xl'>
              {t('Clear access. Practical tools. No unnecessary complexity.')}
            </h2>
          </AnimateInView>
          <div className='grid gap-4 md:grid-cols-3'>
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon
              return (
                <AnimateInView
                  key={advantage.title}
                  className='border-border/60 bg-muted/15 hover:border-primary/30 hover:bg-primary/5 rounded-2xl border p-6 transition-colors'
                  animation='fade-up'
                  delay={index * 90}
                >
                  <div className='border-primary/20 bg-primary/8 flex size-10 items-center justify-center rounded-xl border'>
                    <Icon
                      aria-hidden='true'
                      className='text-primary size-5'
                      strokeWidth={1.7}
                    />
                  </div>
                  <h3 className='mt-6 text-lg font-semibold'>
                    {advantage.title}
                  </h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                    {advantage.description}
                  </p>
                </AnimateInView>
              )
            })}
          </div>
        </div>
      </section>

      <section className='px-6 py-20 md:py-28'>
        <div className='mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-20'>
          <AnimateInView animation='fade-up'>
            <p className='text-primary mb-3 text-xs font-semibold tracking-[0.18em] uppercase'>
              {t('Named for Agamemnon')}
            </p>
            <h2 className='text-3xl font-semibold tracking-tight text-balance md:text-4xl'>
              {t('Built to coordinate intelligence.')}
            </h2>
          </AnimateInView>
          <AnimateInView animation='fade-up' delay={90}>
            <p className='text-muted-foreground text-base leading-relaxed md:text-lg'>
              {t(
                'AGAM AI takes its name from Agamemnon, the legendary commander who united many forces behind one objective. Our platform follows the same idea: bring leading AI models into one clear API, so builders can choose the right capability without managing a maze of providers.'
              )}
            </p>
          </AnimateInView>
        </div>
      </section>

      <section className='px-6 pb-20 md:pb-28'>
        <div className='border-border/60 bg-muted/20 mx-auto flex max-w-6xl flex-col gap-5 rounded-2xl border p-6 md:flex-row md:items-start md:p-8'>
          <div className='border-primary/20 bg-primary/8 flex size-10 shrink-0 items-center justify-center rounded-xl border'>
            <ShieldCheck
              aria-hidden='true'
              className='text-primary size-5'
              strokeWidth={1.7}
            />
          </div>
          <div>
            <h2 className='text-base font-semibold'>
              {t('Safe use, shared responsibility')}
            </h2>
            <p className='text-muted-foreground mt-2 max-w-4xl text-sm leading-relaxed'>
              {t(
                'To keep the platform useful and welcoming, we block requests involving illegal activity, fraud, explicit sexual content, graphic violence, and politically sensitive or otherwise prohibited subjects.'
              )}
            </p>
          </div>
        </div>
      </section>

      <section className='border-border/50 border-t px-6 py-20 text-center md:py-28'>
        <AnimateInView className='mx-auto max-w-2xl' animation='scale-in'>
          <KeyRound
            aria-hidden='true'
            className='text-primary mx-auto size-7'
            strokeWidth={1.6}
          />
          <h2 className='mt-5 text-3xl font-semibold tracking-tight md:text-4xl'>
            {t('Begin with AGAM AI')}
          </h2>
          <p className='text-muted-foreground mt-4 text-base leading-relaxed'>
            {t('Create your API key, choose a model, and put it to work.')}
          </p>
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <Button
              className='bg-primary text-primary-foreground hover:bg-primary/90 group rounded-xl px-5'
              render={<Link to={primaryHref} />}
            >
              {primaryLabel}
              <ArrowRight
                aria-hidden='true'
                className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5'
              />
            </Button>
            <Button
              variant='outline'
              className='rounded-xl px-5'
              render={<Link to='/about' />}
            >
              {t('About')}
            </Button>
          </div>
        </AnimateInView>
      </section>
    </main>
  )
}
