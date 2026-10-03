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
import { ChevronRight, Copy, Sparkles } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getLobeIcon } from '@/lib/lobe-icon'

import { FILTER_ALL } from '../constants'
import { parseTags } from '../lib/filters'
import {
  getAvailableGroups,
  getConfiguredGroupRatio,
} from '../lib/model-helpers'
import type { PricingModel, TokenUnit } from '../types'
import { ModelPricePanel } from './model-price-panel'

type ModelComparisonCardProps = {
  model: PricingModel
  tokenUnit: TokenUnit
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  selectedGroup?: string
  showRechargePrice?: boolean
  priceRate?: number
  usdExchangeRate?: number
  onDetails: () => void
  onIntegrationGuide: () => void
}

export const ModelComparisonCard = memo(function ModelComparisonCard(
  props: ModelComparisonCardProps
) {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()
  const aliases = props.model.aliases || []
  const tags = parseTags(props.model.tags).slice(0, 3)
  const iconKey = props.model.icon || props.model.vendor_icon
  const icon = iconKey ? getLobeIcon(iconKey, 30) : null
  const groups = getAvailableGroups(props.model, props.usableGroup)
    .filter(
      (group) =>
        !props.selectedGroup ||
        props.selectedGroup === FILTER_ALL ||
        group === props.selectedGroup
    )
    .sort(
      (left, right) =>
        getConfiguredGroupRatio(props.groupRatio, left) -
        getConfiguredGroupRatio(props.groupRatio, right)
    )

  return (
    <article
      className='overflow-hidden rounded-2xl border border-amber-400/20 bg-[linear-gradient(145deg,rgba(251,191,36,0.035),transparent_38%)] shadow-[0_18px_60px_rgba(0,0,0,0.12)]'
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 360px' }}
    >
      <header className='border-border/70 flex flex-col gap-4 border-b px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.06]'>
            {icon || (
              <span className='font-bold text-amber-300'>
                {props.model.model_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='font-mono text-base font-bold break-all sm:text-lg'>
                <button
                  type='button'
                  onClick={props.onIntegrationGuide}
                  className='text-start underline-offset-4 transition-colors hover:text-amber-300 hover:underline focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:outline-none'
                >
                  {props.model.model_name}
                </button>
              </h2>
              {props.model.featured && (
                <Badge className='gap-1 border border-amber-300/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/15'>
                  <Sparkles className='size-3' aria-hidden='true' />
                  {t('Featured')}
                </Badge>
              )}
              {props.model.vendor_name && (
                <Badge variant='outline' className='text-[10px]'>
                  {props.model.vendor_name}
                </Badge>
              )}
              {tags.map((tag) => (
                <Badge key={tag} variant='secondary' className='text-[10px]'>
                  {tag}
                </Badge>
              ))}
            </div>
            <p className='text-muted-foreground mt-1.5 max-w-4xl text-xs leading-relaxed sm:text-sm'>
              {props.model.description || t('No description available.')}
            </p>

            {aliases.length > 0 && (
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <span className='text-muted-foreground text-[11px] font-medium'>
                  {t('Also callable as')}
                </span>
                {aliases.map((alias) => (
                  <button
                    key={alias}
                    type='button'
                    onClick={() => copyToClipboard(alias)}
                    className='border-border/70 bg-background/70 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors hover:border-amber-400/40 hover:text-amber-300'
                    title={t('Copy model ID')}
                  >
                    {alias}
                    <Copy className='size-3' />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => copyToClipboard(props.model.model_name)}
            className='gap-1.5'
          >
            <Copy className='size-3.5' />
            {t('Copy ID')}
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={props.onDetails}
            className='gap-1.5 border-amber-400/25'
          >
            {t('Details')}
            <ChevronRight className='size-3.5' />
          </Button>
        </div>
      </header>

      <div className='overflow-x-auto p-4 sm:p-5'>
        <div className='flex min-w-max gap-3'>
          <ModelPricePanel
            model={props.model}
            title={t('Official / base price')}
            description={t(
              'Price before group multipliers. Custom models use this as the reference price.'
            )}
            ratio={1}
            tokenUnit={props.tokenUnit}
            official
            priceRate={props.priceRate}
            usdExchangeRate={props.usdExchangeRate}
          />
          {groups.map((group) => (
            <ModelPricePanel
              key={group}
              model={props.model}
              title={group}
              description={props.usableGroup[group]?.desc}
              ratio={getConfiguredGroupRatio(props.groupRatio, group)}
              tokenUnit={props.tokenUnit}
              showRechargePrice={props.showRechargePrice}
              priceRate={props.priceRate}
              usdExchangeRate={props.usdExchangeRate}
            />
          ))}
        </div>
      </div>
    </article>
  )
})
