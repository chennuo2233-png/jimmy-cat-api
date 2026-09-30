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
import { afterEach, describe, expect, test, vi } from 'vitest'

import { ApiCodeExamples } from '../components/api-code-examples'

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        'docs.protocol.openai.title': 'OpenAI-compatible',
        'docs.protocol.claude.title': 'Claude native',
        'docs.examples.protocolSelector': 'API protocol',
        'docs.examples.languageSelector': 'Programming language',
        'docs.examples.copyCode': 'Copy code',
      },
    },
  },
})

function renderExamples() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ApiCodeExamples />
    </I18nextProvider>
  )
}

afterEach(cleanup)

describe('ApiCodeExamples', () => {
  test('shows an OpenAI-compatible Python example by default', () => {
    renderExamples()

    expect(
      screen.getByText(/base_url="https:\/\/agamai\.online\/v1"/)
    ).toBeInTheDocument()
  })

  test('switches to the Claude native cURL example', async () => {
    renderExamples()
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: 'Claude native' }))
    await user.click(screen.getByRole('tab', { name: 'cURL' }))

    expect(
      screen.getByText(/curl https:\/\/agamai\.online\/v1\/messages/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/anthropic-version: 2023-06-01/)
    ).toBeInTheDocument()
  })

  test('copies the currently selected example', async () => {
    renderExamples()
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')

    await user.click(screen.getByRole('button', { name: 'Copy code' }))

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('https://agamai.online/v1')
      )
    )
  })
})
