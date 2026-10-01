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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { FILTER_ALL } from '../constants'
import type { PricingModel } from '../types'

type ModelFamilyFilterProps = {
  models: PricingModel[]
  value: string
  onChange: (value: string) => void
}

type ModelFamilyOption = {
  value: string
  labelKey: string
  count: number
  priority: number
}

function getFamilyLabel(
  vendorName: string
): Pick<ModelFamilyOption, 'labelKey' | 'priority'> {
  const normalized = vendorName.trim().toLowerCase()
  if (normalized.includes('anthropic') || normalized.includes('claude')) {
    return { labelKey: 'Anthropic / Claude', priority: 0 }
  }
  if (normalized.includes('openai') || normalized.includes('chatgpt')) {
    return { labelKey: 'OpenAI / ChatGPT', priority: 1 }
  }
  if (normalized.includes('glm') || normalized.includes('zhipu')) {
    return { labelKey: 'GLM', priority: 2 }
  }
  return { labelKey: vendorName, priority: 10 }
}

function getModelFamilyOptions(models: PricingModel[]): ModelFamilyOption[] {
  const counts = new Map<string, number>()
  for (const model of models) {
    if (!model.vendor_name) continue
    counts.set(model.vendor_name, (counts.get(model.vendor_name) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([vendorName, count]) => ({
      value: vendorName,
      count,
      ...getFamilyLabel(vendorName),
    }))
    .sort(
      (left, right) =>
        left.priority - right.priority ||
        left.labelKey.localeCompare(right.labelKey)
    )
}

export function ModelFamilyFilter(props: ModelFamilyFilterProps) {
  const { t } = useTranslation()
  const options = useMemo(
    () => getModelFamilyOptions(props.models),
    [props.models]
  )

  if (options.length === 0) return null

  return (
    <nav
      aria-label={t('Model families')}
      className='mx-auto mt-3 max-w-4xl overflow-x-auto pb-1 sm:mt-4'
    >
      <div className='flex min-w-max items-center justify-center gap-2 px-1'>
        <button
          type='button'
          aria-label={`${t('All models')} (${props.models.length})`}
          aria-pressed={props.value === FILTER_ALL}
          onClick={() => props.onChange(FILTER_ALL)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
            props.value === FILTER_ALL
              ? 'border-amber-300/60 bg-amber-400/15 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.10)]'
              : 'border-border/70 bg-background/60 text-muted-foreground hover:border-amber-400/35 hover:text-foreground'
          )}
        >
          {t('All models')}
          <span className='ml-1.5 opacity-60'>{props.models.length}</span>
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type='button'
            aria-label={`${t(option.labelKey)} (${option.count})`}
            aria-pressed={props.value === option.value}
            onClick={() => props.onChange(option.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              props.value === option.value
                ? 'border-amber-300/60 bg-amber-400/15 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.10)]'
                : 'border-border/70 bg-background/60 text-muted-foreground hover:border-amber-400/35 hover:text-foreground'
            )}
          >
            {t(option.labelKey)}
            <span className='ml-1.5 opacity-60'>{option.count}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
