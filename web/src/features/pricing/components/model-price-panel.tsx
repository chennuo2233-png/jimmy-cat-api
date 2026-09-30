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
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { getDynamicPricingSummary } from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
import {
  formatFixedPriceWithRatio,
  formatPriceWithRatio,
  stripTrailingZeros,
} from '../lib/price'
import type { PriceType, PricingModel, TokenUnit } from '../types'

type ModelPricePanelProps = {
  model: PricingModel
  title: string
  description?: string
  ratio: number
  tokenUnit: TokenUnit
  official?: boolean
  showRechargePrice?: boolean
  priceRate?: number
  usdExchangeRate?: number
}

function formatRatio(ratio: number) {
  return `${Number(ratio.toFixed(4))}×`
}

export function ModelPricePanel(props: ModelPricePanelProps) {
  const { t } = useTranslation()
  const useRechargePrice = props.official
    ? false
    : (props.showRechargePrice ?? false)
  const dynamicSummary = getDynamicPricingSummary(props.model, {
    tokenUnit: props.tokenUnit,
    showRechargePrice: useRechargePrice,
    priceRate: props.priceRate,
    usdExchangeRate: props.usdExchangeRate,
    groupRatioMultiplier: props.ratio,
  })

  const metrics: { key: string; label: string; value: string }[] = []
  if (dynamicSummary && !dynamicSummary.isSpecialExpression) {
    for (const entry of dynamicSummary.entries) {
      metrics.push({
        key: entry.key,
        label: t(entry.shortLabel),
        value: stripTrailingZeros(entry.formatted),
      })
    }
  } else if (isTokenBasedModel(props.model)) {
    const priceTypes: {
      type: PriceType
      label: string
      available: boolean
    }[] = [
      { type: 'input', label: t('Input'), available: true },
      { type: 'output', label: t('Output'), available: true },
      {
        type: 'cache',
        label: t('Cache read'),
        available: props.model.cache_ratio != null,
      },
      {
        type: 'create_cache',
        label: t('Cache write'),
        available: props.model.create_cache_ratio != null,
      },
      {
        type: 'image',
        label: t('Image input'),
        available: props.model.image_ratio != null,
      },
      {
        type: 'audio_input',
        label: t('Audio input'),
        available: props.model.audio_ratio != null,
      },
      {
        type: 'audio_output',
        label: t('Audio output'),
        available:
          props.model.audio_ratio != null &&
          props.model.audio_completion_ratio != null,
      },
    ]

    for (const priceType of priceTypes) {
      if (!priceType.available) continue
      metrics.push({
        key: priceType.type,
        label: priceType.label,
        value: stripTrailingZeros(
          formatPriceWithRatio(
            props.model,
            priceType.type,
            props.tokenUnit,
            props.ratio,
            useRechargePrice,
            props.priceRate,
            props.usdExchangeRate
          )
        ),
      })
    }
  } else {
    metrics.push({
      key: 'request',
      label: t('Per request'),
      value: stripTrailingZeros(
        formatFixedPriceWithRatio(
          props.model,
          props.ratio,
          useRechargePrice,
          props.priceRate,
          props.usdExchangeRate
        )
      ),
    })
  }

  return (
    <section
      className={cn(
        'min-w-[220px] flex-1 rounded-xl border p-4',
        props.official
          ? 'border-amber-400/35 bg-amber-400/[0.07] shadow-[inset_0_1px_0_rgba(251,191,36,0.08)]'
          : 'border-border/70 bg-background/55'
      )}
      aria-label={props.title}
    >
      <div className='mb-3 flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h4 className='truncate text-sm font-semibold'>{props.title}</h4>
          {props.description && (
            <p className='text-muted-foreground mt-1 line-clamp-2 text-[11px] leading-relaxed'>
              {props.description}
            </p>
          )}
        </div>
        <Badge
          variant={props.official ? 'default' : 'secondary'}
          className={cn(
            'shrink-0 font-mono text-[10px]',
            props.official && 'bg-amber-400 text-black hover:bg-amber-400'
          )}
        >
          {formatRatio(props.ratio)}
        </Badge>
      </div>

      {dynamicSummary?.isSpecialExpression ? (
        <p className='text-muted-foreground text-xs leading-relaxed'>
          {t(
            'This model uses a custom billing expression. Open details for the complete pricing rules.'
          )}
        </p>
      ) : (
        <dl className='space-y-2'>
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className='border-border/50 flex items-baseline justify-between gap-4 border-b pb-2 last:border-0 last:pb-0'
            >
              <dt className='text-muted-foreground text-xs'>{metric.label}</dt>
              <dd className='font-mono text-sm font-semibold tabular-nums'>
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className='text-muted-foreground/60 mt-3 text-[10px]'>
        {isTokenBasedModel(props.model)
          ? t('Price per {{unit}} tokens', {
              unit: props.tokenUnit === 'M' ? '1M' : '1K',
            })
          : t('Charged per request')}
      </p>
    </section>
  )
}
