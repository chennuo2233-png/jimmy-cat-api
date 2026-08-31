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
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { initReactI18next, I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationStore } from '@/stores/notification-store'

import { DailyAnnouncementDialog } from '../daily-announcement-dialog'

vi.mock('@/hooks/use-status', () => ({
  useStatus: vi.fn(),
}))

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: { Close: 'Close' } } },
})

beforeEach(() => {
  useNotificationStore.setState({ announcementPopupDates: {} })
  useAuthStore.getState().auth.setUser({
    id: 42,
    username: 'customer',
    role: 1,
  })
  vi.mocked(useStatus).mockReturnValue({
    status: {
      announcements_enabled: true,
      announcements: [
        {
          content: 'Scheduled maintenance is complete.',
          publishDate: '2026-08-31T00:00:00Z',
        },
      ],
    },
    loading: false,
    error: null,
  })
})

afterEach(() => {
  cleanup()
  useAuthStore.getState().auth.setUser(null)
  vi.clearAllMocks()
})

describe('DailyAnnouncementDialog', () => {
  test('shows the latest announcement once and records dismissal using the UTC+3 date', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DailyAnnouncementDialog />
      </I18nextProvider>
    )

    expect(
      await screen.findByText('Scheduled maintenance is complete.')
    ).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }))

    const expectedDate = new Date(Date.now() + 3 * 60 * 60 * 1_000)
      .toISOString()
      .slice(0, 10)
    expect(useNotificationStore.getState().announcementPopupDates['42']).toBe(
      expectedDate
    )
  })
})
