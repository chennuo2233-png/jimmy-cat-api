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
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { useAuthStore } from '@/stores/auth-store'

import { FirstVisitLanguageDialog } from '../first-visit-language-dialog'

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'ru',
  fallbackLng: 'ru',
  resources: {
    en: { translation: {} },
    ru: {
      translation: {
        'Choose your language': 'Выберите язык',
        'English interface': 'Интерфейс на английском',
        'Russian interface': 'Интерфейс на русском',
        'Vietnamese interface': 'Интерфейс на вьетнамском',
      },
    },
  },
})

function renderDialog() {
  return render(
    <I18nextProvider i18n={i18n}>
      <FirstVisitLanguageDialog />
    </I18nextProvider>
  )
}

beforeEach(async () => {
  window.localStorage.clear()
  useAuthStore.getState().auth.reset('complete')
  await i18n.changeLanguage('ru')
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  useAuthStore.getState().auth.reset()
})

describe('FirstVisitLanguageDialog', () => {
  test('shows Russian as the default language for a first-time visitor', () => {
    renderDialog()

    expect(
      screen.getByRole('dialog', { name: 'Выберите язык' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Русский/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  test('changes language and remembers the completed choice', async () => {
    renderDialog()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /English/ }))

    await waitFor(() => expect(i18n.language).toBe('en'))
    expect(window.localStorage.getItem('language_welcome_seen_v1')).toBe('true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('allows backdrop dismissal without choosing and does not show again', async () => {
    const view = renderDialog()
    const backdrop = document.querySelector('[data-slot="dialog-overlay"]')

    expect(backdrop).not.toBeNull()
    await userEvent.setup().click(backdrop as HTMLElement)

    expect(window.localStorage.getItem('language_welcome_seen_v1')).toBe('true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    view.unmount()
    renderDialog()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('does not interrupt an authenticated user', () => {
    useAuthStore.getState().auth.setUser({
      id: 42,
      username: 'customer',
      role: 1,
    })

    renderDialog()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
