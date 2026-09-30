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
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { describe, expect, test, vi } from 'vitest'

import type { PricingModel } from '../../types'
import { ModelComparisonCard } from '../model-comparison-card'

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        'Official / base price': 'Official / base price',
        'Also callable as': 'Also callable as',
        Input: 'Input',
        Output: 'Output',
        'Price per {{unit}} tokens': 'Price per {{unit}} tokens',
      },
    },
  },
})

const model: PricingModel = {
  id: 1,
  model_name: 'claude-fable-5-1',
  aliases: ['agam-fable-5-1'],
  quota_type: 0,
  model_ratio: 5,
  completion_ratio: 5,
  enable_groups: ['default', 'economy'],
  supported_endpoint_types: ['anthropic'],
}

describe('ModelComparisonCard', () => {
  test('shows one official price and the effective price for every group', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ModelComparisonCard
          model={model}
          tokenUnit='M'
          groupRatio={{ default: 1, economy: 0.3 }}
          usableGroup={{
            default: { desc: 'Standard access', ratio: 1 },
            economy: { desc: 'Economy access', ratio: 0.3 },
          }}
          onDetails={vi.fn()}
        />
      </I18nextProvider>
    )

    expect(
      screen.getByRole('region', { name: 'Official / base price' })
    ).toBeVisible()
    expect(screen.getByRole('region', { name: 'default' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'economy' })).toBeVisible()
    expect(screen.getByText('agam-fable-5-1')).toBeVisible()
    expect(screen.getByText('0.3×')).toBeVisible()
    expect(screen.getAllByText('$10').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('$3')).toBeVisible()
  })
})
