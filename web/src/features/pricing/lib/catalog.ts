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
import type { PricingModel } from '../types'

const PUBLIC_ALIAS_PREFIX = 'agam-'

const PRICING_FIELDS = [
  'quota_type',
  'model_ratio',
  'completion_ratio',
  'model_price',
  'cache_ratio',
  'create_cache_ratio',
  'image_ratio',
  'audio_ratio',
  'audio_completion_ratio',
  'billing_mode',
  'billing_expr',
] as const

function hasEquivalentPricing(left: PricingModel, right: PricingModel) {
  return PRICING_FIELDS.every((field) => left[field] === right[field])
}

function isAliasCandidate(alias: PricingModel, candidate: PricingModel) {
  const aliasName = alias.model_name.toLowerCase()
  const candidateName = candidate.model_name.toLowerCase()
  const shortName = aliasName.slice(PUBLIC_ALIAS_PREFIX.length)

  if (!aliasName.startsWith(PUBLIC_ALIAS_PREFIX) || !shortName) return false
  if (candidateName.startsWith(PUBLIC_ALIAS_PREFIX)) return false
  if (candidateName !== shortName && !candidateName.endsWith(`-${shortName}`)) {
    return false
  }
  if (
    alias.vendor_id &&
    candidate.vendor_id &&
    alias.vendor_id !== candidate.vendor_id
  ) {
    return false
  }
  return hasEquivalentPricing(alias, candidate)
}

function mergeUnique(left: string[] = [], right: string[] = []) {
  return [...new Set([...left, ...right])]
}

/**
 * Merge AGAM public aliases into their equivalent upstream-style catalog row.
 *
 * A prefix alone is never enough: the candidate must also have identical
 * pricing and a compatible vendor. Ambiguous matches remain separate so the
 * marketplace never hides a genuinely different product.
 */
export function consolidatePricingModels(models: PricingModel[]) {
  const canonicalModels = models.filter(
    (model) => !model.model_name.toLowerCase().startsWith(PUBLIC_ALIAS_PREFIX)
  )
  const mergedByName = new Map(
    canonicalModels.map((model) => [
      model.model_name,
      { ...model, aliases: [...(model.aliases || [])] },
    ])
  )
  const unmergedAliases: PricingModel[] = []

  for (const alias of models) {
    if (!alias.model_name.toLowerCase().startsWith(PUBLIC_ALIAS_PREFIX)) {
      continue
    }

    const matches = canonicalModels.filter((candidate) =>
      isAliasCandidate(alias, candidate)
    )
    const exactName = alias.model_name
      .toLowerCase()
      .slice(PUBLIC_ALIAS_PREFIX.length)
    const exactMatches = matches.filter(
      (candidate) => candidate.model_name.toLowerCase() === exactName
    )
    const target = exactMatches.length === 1 ? exactMatches[0] : matches[0]

    if (!target || (exactMatches.length === 0 && matches.length !== 1)) {
      unmergedAliases.push(alias)
      continue
    }

    const merged = mergedByName.get(target.model_name)
    if (!merged) {
      unmergedAliases.push(alias)
      continue
    }

    merged.aliases = mergeUnique(merged.aliases, [alias.model_name])
    merged.featured = Boolean(merged.featured || alias.featured)
    merged.enable_groups = mergeUnique(
      merged.enable_groups,
      alias.enable_groups
    )
    merged.supported_endpoint_types = mergeUnique(
      merged.supported_endpoint_types,
      alias.supported_endpoint_types
    )
  }

  return [...mergedByName.values(), ...unmergedAliases]
}
