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
import { api } from '@/lib/api'

import type {
  CreateFinancialEntryInput,
  FinancialReportResponse,
} from './types'

export async function getFinancialReport(startDate: string, endDate: string) {
  const response = await api.get('/api/user/finance', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  })
  return response.data.data as FinancialReportResponse
}

export async function createFinancialEntry(input: CreateFinancialEntryInput) {
  const response = await api.post('/api/user/finance/entries', input)
  return response.data
}

export async function deleteFinancialEntry(id: number) {
  const response = await api.delete(`/api/user/finance/entries/${id}`)
  return response.data
}

export async function updateFinancialExchangeRate(cnyPerUSD: string) {
  const response = await api.put('/api/user/finance/exchange-rate', {
    cny_per_usd: cnyPerUSD,
  })
  return response.data
}
