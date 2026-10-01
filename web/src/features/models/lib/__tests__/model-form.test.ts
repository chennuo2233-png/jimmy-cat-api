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

import type { Model } from '../../types'
import {
  transformFormDataToModelPayload,
  transformModelToFormDefaults,
} from '../model-form'

const featuredModel: Model = {
  id: 1,
  model_name: 'claude-sonnet-5-5',
  status: 1,
  sync_official: 1,
  featured: true,
  created_time: 1,
  updated_time: 1,
  name_rule: 0,
}

describe('model form featured setting', () => {
  test('loads the persisted featured state into the admin form', () => {
    expect(transformModelToFormDefaults(featuredModel).featured).toBe(true)
  })

  test('keeps the featured state in the model update payload', () => {
    const defaults = transformModelToFormDefaults(featuredModel)

    expect(transformFormDataToModelPayload(defaults).featured).toBe(true)
  })
})
