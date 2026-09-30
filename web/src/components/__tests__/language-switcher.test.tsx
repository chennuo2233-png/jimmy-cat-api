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

import { LanguageSwitcher } from '@/components/language-switcher'
import { useAuthStore } from '@/stores/auth-store'

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'ru',
  fallbackLng: 'ru',
  supportedLngs: ['en', 'zhCN', 'fr', 'ru', 'ja', 'vi', 'zhTW'],
  resources: Object.fromEntries(
    ['en', 'zhCN', 'fr', 'ru', 'ja', 'vi', 'zhTW'].map((language) => [
      language,
      { translation: { 'Change language': 'Change language' } },
    ])
  ),
})

function renderSwitcher() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher showLabel />
    </I18nextProvider>
  )
}

beforeEach(async () => {
  useAuthStore.getState().auth.reset('complete')
  await i18n.changeLanguage('ru')
})

afterEach(() => {
  cleanup()
  useAuthStore.getState().auth.reset()
})

describe('LanguageSwitcher', () => {
  test('offers every supported interface language', async () => {
    renderSwitcher()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Русский/ }))

    expect(screen.getAllByRole('menuitem')).toHaveLength(7)
    expect(screen.getByRole('menuitem', { name: /English/ })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: /简体中文/ })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: /繁體中文/ })).toBeVisible()
  })

  test('changes the visible language and synchronizes the document locale', async () => {
    renderSwitcher()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /Русский/ }))
    await user.click(screen.getByRole('menuitem', { name: /简体中文/ }))

    await waitFor(() => expect(i18n.language).toBe('zhCN'))
    expect(document.documentElement).toHaveAttribute('lang', 'zh-CN')
    expect(screen.getByRole('button', { name: /简体中文/ })).toBeVisible()
  })
})
