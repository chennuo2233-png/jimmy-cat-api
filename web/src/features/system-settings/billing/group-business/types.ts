/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
export type GroupBusinessProduct = {
  id: number
  name: string
  group_name: string
  settlement_rate_cny: string
  upstream_cost_cny: string
  sales_share_rate: string
  partner_share_rate: string
  owner_share_rate: string
  started_at: number
  active: boolean
}

export type GroupBusinessSalesperson = {
  id: number
  name: string
  active: boolean
}

export type GroupBusinessCustomer = {
  id: number
  product_id: number
  user_id: number
  salesperson_id: number
  username: string
  chat_name: string
  effective_at: number
  active: boolean
  note: string
}

export type GroupBusinessEligibleUser = { id: number; username: string }

export type GroupBusinessLedger = {
  id: number
  product_id: number
  customer_id: number
  type: GroupBusinessLedgerType
  cash_amount_cny: string
  credit_amount_cny: string
  upstream_balance_cny: string
  occurred_at: number
  note: string
}

export type GroupBusinessLedgerType =
  | 'payment'
  | 'trial_credit'
  | 'upstream_purchase'
  | 'upstream_balance'
  | 'refund'
  | 'other_income'
  | 'other_expense'

export type GroupBusinessSnapshot = {
  id: number
  product_id: number
  date: string
  customer_payment_cny: string
  refund_cny: string
  paid_consumption_cny: string
  trial_consumption_cny: string
  total_consumption_cny: string
  paid_upstream_cost_cny: string
  trial_upstream_cost_cny: string
  gross_margin_cny: string
  distributable_margin_cny: string
  sales_commission_cny: string
  partner_share_cny: string
  owner_share_cny: string
  upstream_purchased_cny: string
  latest_upstream_balance_cny: string
  customer_count: number
}

export type GroupBusinessCustomerSnapshot = {
  id: number
  username: string
  salesperson_name: string
  chat_name: string
  paid_consumption_cny: string
  trial_consumption_cny: string
  upstream_cost_cny: string
  margin_cny: string
  sales_commission_cny: string
}

export type GroupBusinessOverview = {
  products: GroupBusinessProduct[]
  salespeople: GroupBusinessSalesperson[]
  customers?: GroupBusinessCustomer[]
  eligible_users?: GroupBusinessEligibleUser[]
  ledger?: GroupBusinessLedger[]
  snapshots?: GroupBusinessSnapshot[]
}
