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
  CircleDollarSign,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

type JimmyCatHomeProps = {
  isAuthenticated: boolean
}

export function JimmyCatHome(props: JimmyCatHomeProps) {
  const { t } = useTranslation()
  const primaryHref = props.isAuthenticated ? '/dashboard' : '/sign-up'
  const primaryLabel = props.isAuthenticated
    ? t('Go to Dashboard')
    : t('Create account')

  const principles = [
    {
      icon: Zap,
      title: t('Fast when it matters'),
      description: t(
        'Stable API access designed for the pace of real products.'
      ),
    },
    {
      icon: CircleDollarSign,
      title: t('Clear pricing'),
      description: t(
        'Straightforward, affordable usage without unnecessary complexity.'
      ),
    },
    {
      icon: ShieldCheck,
      title: t('Security by default'),
      description: t('Independent key management and protected data transmission.'),
    },
  ]

  return (
    <main className='relative overflow-hidden pt-16'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-[38rem] opacity-80'
        style={{
          background:
            'radial-gradient(ellipse 55% 44% at 80% 8%, oklch(0.78 0.12 88 / 14%) 0%, transparent 72%)',
        }}
      />

      <section className='relative px-6 pt-20 pb-24 md:pt-32 md:pb-32'>
        <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20'>
          <AnimateInView className='max-w-2xl' animation='fade-up'>
            <p className='text-muted-foreground mb-5 text-xs font-semibold tracking-[0.2em] uppercase'>
              Jimmy Cat · JMM
            </p>
            <h1 className='text-4xl leading-[1.08] font-semibold tracking-tight md:text-6xl'>
              {t('Accessible AI for real work')}
            </h1>
            <p className='text-muted-foreground mt-6 max-w-xl text-base leading-relaxed md:text-lg'>
              {t(
                'Jimmy Cat is a practical AI API platform built around transparent terms, dependable access, and sensible prices.'
              )}
            </p>
            <p className='text-muted-foreground/70 mt-4 text-sm'>
              {t('A calm, direct way to work with AI.')}
            </p>
            <div className='mt-9 flex flex-wrap items-center gap-3'>
              <Button className='group rounded-xl px-5' render={<Link to={primaryHref} />}>
                {primaryLabel}
                <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
              </Button>
              <Button
                variant='outline'
                className='rounded-xl px-5'
                render={<a href='#principles' />}
              >
                {t('Our principles')}
              </Button>
            </div>
          </AnimateInView>

          <AnimateInView
            className='mx-auto flex w-full max-w-sm justify-center lg:justify-end'
            animation='scale-in'
            delay={120}
          >
            <div className='border-border/60 bg-muted/15 relative aspect-square w-full overflow-hidden rounded-full border p-3 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.65)]'>
              <div className='bg-background/30 absolute inset-5 rounded-full' />
              <img
                src='/jmm-cat-logo-round.png'
                alt='Jimmy Cat'
                className='relative size-full rounded-full object-cover'
              />
            </div>
          </AnimateInView>
        </div>
      </section>

      <section id='principles' className='border-border/50 border-y px-6 py-20 md:py-24'>
        <div className='mx-auto max-w-6xl'>
          <AnimateInView className='mb-10 max-w-xl' animation='fade-up'>
            <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-[0.18em] uppercase'>
              {t('Our principles')}
            </p>
            <h2 className='text-3xl font-semibold tracking-tight md:text-4xl'>
              {t('Useful service, without the noise.')}
            </h2>
          </AnimateInView>
          <div className='grid gap-4 md:grid-cols-3'>
            {principles.map((principle, index) => {
              const Icon = principle.icon
              return (
                <AnimateInView
                  key={principle.title}
                  className='border-border/60 bg-muted/15 rounded-2xl border p-6'
                  animation='fade-up'
                  delay={index * 90}
                >
                  <div className='bg-background flex size-10 items-center justify-center rounded-xl border'>
                    <Icon className='text-muted-foreground size-5' strokeWidth={1.7} />
                  </div>
                  <h3 className='mt-6 text-lg font-semibold'>{principle.title}</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                    {principle.description}
                  </p>
                </AnimateInView>
              )
            })}
          </div>
        </div>
      </section>

      <section className='px-6 py-20 md:py-28'>
        <div className='mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-20'>
          <AnimateInView animation='fade-up'>
            <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-[0.18em] uppercase'>
              {t('Why Jimmy Cat')}
            </p>
            <h2 className='text-3xl font-semibold tracking-tight md:text-4xl'>
              {t('The JMM mindset')}
            </h2>
          </AnimateInView>
          <AnimateInView animation='fade-up' delay={90}>
            <p className='text-muted-foreground text-base leading-relaxed md:text-lg'>
              {t(
                'JMM began as an inside reference—Just Make Money. For us, it means building a sustainable service: useful technology, honest terms, and value that makes sense for the people using it.'
              )}
            </p>
          </AnimateInView>
        </div>
      </section>

      <section className='px-6 pb-20 md:pb-28'>
        <div className='border-border/60 bg-muted/20 mx-auto flex max-w-6xl flex-col gap-5 rounded-2xl border p-6 md:flex-row md:items-start md:p-8'>
          <div className='bg-background flex size-10 shrink-0 items-center justify-center rounded-xl border'>
            <ShieldAlert className='text-muted-foreground size-5' strokeWidth={1.7} />
          </div>
          <div>
            <h2 className='text-base font-semibold'>{t('Safe use, shared responsibility')}</h2>
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
          <KeyRound className='text-muted-foreground mx-auto size-7' strokeWidth={1.6} />
          <h2 className='mt-5 text-3xl font-semibold tracking-tight md:text-4xl'>
            {t('Start with one key')}
          </h2>
          <p className='text-muted-foreground mt-4 text-base leading-relaxed'>
            {t('Create an API key in your account and begin when you are ready.')}
          </p>
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <Button className='group rounded-xl px-5' render={<Link to={primaryHref} />}>
              {primaryLabel}
              <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
            </Button>
            <Button variant='outline' className='rounded-xl px-5' render={<Link to='/about' />}>
              {t('About')}
            </Button>
          </div>
        </AnimateInView>
      </section>
    </main>
  )
}
