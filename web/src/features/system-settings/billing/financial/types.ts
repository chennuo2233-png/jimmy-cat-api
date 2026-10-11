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
export type FinancialDirection = 'income' | 'expense'
export type FinancialCurrency = 'USD' | 'USDT' | 'CNY'

export type FinancialCategory =
  | 'other_income'
  | 'upstream_purchase'
  | 'customer_test'
  | 'other_expense'

export type FinancialEntry = {
  id: number
  direction: FinancialDirection
  category: FinancialCategory
  currency: FinancialCurrency
  amount: string
  exchange_rate: string
  usd_value: string
  occurred_at: number
  note: string
  created_by: number
  created_at: number
}

export type FinancialSummary = {
  customer_top_up_usd: string
  customer_top_up_count: number
  other_income_usd: string
  upstream_purchase_usd: string
  customer_test_usd: string
  other_expense_usd: string
  total_income_usd: string
  total_expense_usd: string
  net_profit_usd: string
  cny_per_usd: string
  entries: FinancialEntry[]
}

export type FinancialReportResponse = {
  start_at: number
  end_at: number
  summary: FinancialSummary
}

export type CreateFinancialEntryInput = {
  direction: FinancialDirection
  category: FinancialCategory
  currency: FinancialCurrency
  amount: string
  occurred_on: string
  note: string
}
