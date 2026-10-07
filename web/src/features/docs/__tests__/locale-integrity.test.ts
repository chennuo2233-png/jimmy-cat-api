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

import en from '@/i18n/locales/en.json'
import fr from '@/i18n/locales/fr.json'
import ja from '@/i18n/locales/ja.json'
import ru from '@/i18n/locales/ru.json'
import vi from '@/i18n/locales/vi.json'
import zhTW from '@/i18n/locales/zh-TW.json'
import zhCN from '@/i18n/locales/zh.json'

const locales = {
  en,
  zhCN,
  zhTW,
  fr,
  ja,
  ru,
  vi,
}

describe('docs locale integrity', () => {
  test('keeps every documentation key in the active translation namespace', () => {
    const docsKeys = Object.keys(en.translation).filter((key) =>
      key.startsWith('docs.')
    )

    expect(docsKeys.length).toBeGreaterThan(100)

    for (const locale of Object.values(locales)) {
      expect(
        Object.keys(locale).filter((key) => key.startsWith('docs.'))
      ).toEqual([])
      expect(
        docsKeys.every((key) => Object.hasOwn(locale.translation, key))
      ).toBe(true)
    }
  })
})
