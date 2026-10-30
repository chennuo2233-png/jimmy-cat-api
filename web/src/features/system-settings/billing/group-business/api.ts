/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { api } from '@/lib/api'

import type {
  GroupBusinessCustomerSnapshot,
  GroupBusinessOverview,
} from './types'

export async function getGroupBusinessOverview(params: {
  productId?: number
  startDate?: string
  endDate?: string
}) {
  const response = await api.get('/api/user/group-business', {
    params: {
      product_id: params.productId,
      start_date: params.startDate,
      end_date: params.endDate,
    },
  })
  return response.data.data as GroupBusinessOverview
}

export async function createGroupBusinessRecord(
  path: string,
  payload: unknown
) {
  const response = await api.post(`/api/user/group-business/${path}`, payload)
  return response.data
}

export async function deleteGroupBusinessLedger(id: number) {
  const response = await api.delete(`/api/user/group-business/ledger/${id}`)
  return response.data
}

export async function getGroupBusinessSnapshotDetails(id: number) {
  const response = await api.get(
    `/api/user/group-business/snapshots/${id}/details`
  )
  return response.data.data as GroupBusinessCustomerSnapshot[]
}
