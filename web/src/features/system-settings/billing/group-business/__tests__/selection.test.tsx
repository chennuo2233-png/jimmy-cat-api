/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { GroupBusinessSection } from '../group-business-section'
import type { GroupBusinessOverview } from '../types'

const { getGroupBusinessOverview } = vi.hoisted(() => ({
  getGroupBusinessOverview: vi.fn(),
}))

vi.mock('../api', () => ({
  createGroupBusinessRecord: vi.fn(),
  deleteGroupBusinessLedger: vi.fn(),
  getGroupBusinessOverview,
  getGroupBusinessSnapshotDetails: vi.fn(),
}))

const overview: GroupBusinessOverview = {
  products: [
    {
      id: 1,
      name: 'AWSB 渠道 A',
      group_name: '1.AWSB',
      settlement_rate_cny: '2.45',
      upstream_cost_cny: '2.4',
      sales_share_rate: '0.2',
      partner_share_rate: '0.4',
      owner_share_rate: '0.4',
      started_at: 1761868800,
      active: true,
    },
  ],
  salespeople: [],
  customers: [],
  eligible_users: [],
  ledger: [],
  snapshots: [],
}

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <GroupBusinessSection />
    </QueryClientProvider>
  )
}

describe('GroupBusinessSection', () => {
  test('automatically selects the first product and exposes setup forms', async () => {
    getGroupBusinessOverview.mockResolvedValue(overview)

    renderSection()

    expect(await screen.findByText('销售人员与客户归属')).toBeInTheDocument()
    expect(screen.getByText('手动账目')).toBeInTheDocument()
    expect(screen.getByText('每日封存与利润结算')).toBeInTheDocument()
  })
})
