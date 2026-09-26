/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { cleanup, render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, PropsWithChildren } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { AgamAiHome } from '../agam-ai-home'

vi.mock('@tanstack/react-router', () => ({
  Link: (
    props: PropsWithChildren<
      AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
    >
  ) => {
    const { to, ...anchorProps } = props
    return <a {...anchorProps} href={to} />
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/components/animate-in-view', () => ({
  AnimateInView: (props: PropsWithChildren<{ className?: string }>) => (
    <div className={props.className}>{props.children}</div>
  ),
}))

afterEach(() => {
  cleanup()
})

describe('AGAM AI home branding', () => {
  test('shows the new brand, supplied logo, and primary account action', () => {
    render(<AgamAiHome isAuthenticated={false} />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'One API. Many models. Built for decisive work.',
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'AGAM AI' })).toHaveAttribute(
      'src',
      '/agam-ai-logo.webp'
    )
    expect(
      screen.getAllByRole('button', { name: /Create account/ })
    ).toHaveLength(2)
    expect(screen.queryByText(/Jimmy|JMM/i)).not.toBeInTheDocument()
  })
})
