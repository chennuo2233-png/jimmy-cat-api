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
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import type { PricingModel } from '../../types'
import { ModelFamilyFilter } from '../model-family-filter'

const models = [
  {
    id: 1,
    model_name: 'claude-sonnet',
    vendor_name: 'Anthropic',
  },
  { id: 2, model_name: 'claude-opus', vendor_name: 'Anthropic' },
  { id: 3, model_name: 'gpt-5', vendor_name: 'OpenAI' },
  { id: 4, model_name: 'glm-5', vendor_name: 'Zhipu GLM' },
].map(
  (model): PricingModel => ({
    ...model,
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 1,
    enable_groups: ['default'],
  })
)

describe('ModelFamilyFilter', () => {
  test('shows compact provider families with the current selection', () => {
    render(
      <ModelFamilyFilter models={models} value='Anthropic' onChange={vi.fn()} />
    )

    expect(
      screen.getByRole('navigation', { name: 'Model families' })
    ).toHaveClass('overflow-x-auto')
    expect(
      screen.getByRole('button', { name: 'Anthropic / Claude (2)' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'OpenAI / ChatGPT (1)' })
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'GLM (1)' })).toBeVisible()
  })

  test('updates the shared vendor filter when a family is selected', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ModelFamilyFilter models={models} value='all' onChange={onChange} />
    )

    await user.click(
      screen.getByRole('button', { name: 'OpenAI / ChatGPT (1)' })
    )

    expect(onChange).toHaveBeenCalledWith('OpenAI')
  })
})
