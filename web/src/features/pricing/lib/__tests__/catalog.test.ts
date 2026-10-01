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
import { describe, expect, test } from 'vitest'

import type { PricingModel } from '../../types'
import { consolidatePricingModels } from '../catalog'
import { filterBySearch, sortModels } from '../filters'

function createModel(
  modelName: string,
  overrides: Partial<PricingModel> = {}
): PricingModel {
  return {
    id: overrides.id ?? modelName.length,
    model_name: modelName,
    quota_type: 0,
    model_ratio: 5,
    completion_ratio: 5,
    enable_groups: ['default'],
    supported_endpoint_types: ['anthropic'],
    vendor_id: 1,
    ...overrides,
  }
}

describe('consolidatePricingModels', () => {
  test('merges an equivalent AGAM alias into the canonical model', () => {
    const result = consolidatePricingModels([
      createModel('claude-fable-5-1'),
      createModel('agam-fable-5-1', {
        enable_groups: ['premium'],
        supported_endpoint_types: ['openai'],
      }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      model_name: 'claude-fable-5-1',
      aliases: ['agam-fable-5-1'],
    })
    expect(result[0].enable_groups).toEqual(['default', 'premium'])
    expect(result[0].supported_endpoint_types).toEqual(['anthropic', 'openai'])
  })

  test('keeps aliases separate when their pricing differs', () => {
    const result = consolidatePricingModels([
      createModel('claude-fable-5-1'),
      createModel('agam-fable-5-1', { model_ratio: 6 }),
    ])

    expect(result.map((model) => model.model_name)).toEqual([
      'claude-fable-5-1',
      'agam-fable-5-1',
    ])
  })

  test('keeps ambiguous suffix matches visible', () => {
    const result = consolidatePricingModels([
      createModel('claude-fable-5-1'),
      createModel('vendor-fable-5-1'),
      createModel('agam-fable-5-1'),
    ])

    expect(result).toHaveLength(3)
  })

  test('allows customers to search by a merged alias', () => {
    const consolidated = consolidatePricingModels([
      createModel('claude-fable-5-1'),
      createModel('agam-fable-5-1'),
    ])

    expect(filterBySearch(consolidated, 'agam-fable')).toHaveLength(1)
  })

  test('inherits featured state from a merged AGAM alias', () => {
    const result = consolidatePricingModels([
      createModel('claude-fable-5-1'),
      createModel('agam-fable-5-1', { featured: true }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].featured).toBe(true)
  })

  test('keeps featured models first for every customer sort option', () => {
    const regular = createModel('alpha', { model_ratio: 1 })
    const featured = createModel('zeta', {
      model_ratio: 100,
      featured: true,
    })

    expect(sortModels([regular, featured], 'name')[0].model_name).toBe('zeta')
    expect(sortModels([regular, featured], 'price-low')[0].model_name).toBe(
      'zeta'
    )
    expect(sortModels([regular, featured], 'price-high')[0].model_name).toBe(
      'zeta'
    )
  })
})
