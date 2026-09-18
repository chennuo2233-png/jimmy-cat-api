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
import { render, screen } from '@testing-library/react'
import { Layers } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { LogStatCards } from '@/features/dashboard/components/models/log-stat-cards'

const tokenNotice =
  'Only input and output tokens are included; cached tokens are excluded.'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}))

vi.mock('@/features/dashboard/api', () => ({
  getUserQuotaDates: () => new Promise(() => {}),
}))

vi.mock('@/features/dashboard/hooks/use-dashboard-config', () => ({
  useModelStatCardsConfig: () => [
    {
      key: 'tokens',
      title: 'Total Tokens',
      description:
        'Only input and output tokens are included; cached tokens are excluded.',
      tooltip:
        'Only input and output tokens are included; cached tokens are excluded.',
      icon: Layers,
      iconTone: 'chart-4',
      getValue: () => 0,
    },
  ],
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => null,
}))

describe('LogStatCards token notice', () => {
  it('exposes the cache exclusion notice through an accessible tooltip trigger', () => {
    render(<LogStatCards />)

    expect(
      screen.getByRole('button', {
        name: `Total Tokens: ${tokenNotice}`,
      })
    ).toBeInTheDocument()
  })
})
