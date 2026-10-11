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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { SettingsSection } from '../../components/settings-section'
import {
  createFinancialEntry,
  deleteFinancialEntry,
  getFinancialReport,
  updateFinancialExchangeRate,
} from './api'
import type {
  CreateFinancialEntryInput,
  FinancialCategory,
  FinancialDirection,
} from './types'

function getBeijingDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )
  return `${values.year}-${values.month}-${values.day}`
}

function formatUSD(value: string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return '$0.00'
  }
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

function formatBeijingDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp * 1000))
}

const expenseCategories: FinancialCategory[] = [
  'upstream_purchase',
  'customer_test',
  'other_expense',
]

function getInitialEntry(today: string): CreateFinancialEntryInput {
  return {
    direction: 'expense',
    category: 'upstream_purchase',
    currency: 'CNY',
    amount: '',
    occurred_on: today,
    note: '',
  }
}

export function FinancialReportSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const today = useMemo(() => getBeijingDate(), [])
  const [startDate, setStartDate] = useState(() => `${today.slice(0, 8)}01`)
  const [endDate, setEndDate] = useState(today)
  const [entry, setEntry] = useState(() => getInitialEntry(today))
  const [cnyPerUSD, setCnyPerUSD] = useState('6.7')

  const reportQuery = useQuery({
    queryKey: ['financial-report', startDate, endDate],
    queryFn: () => getFinancialReport(startDate, endDate),
  })
  const summary = reportQuery.data?.summary

  useEffect(() => {
    if (summary?.cny_per_usd) {
      setCnyPerUSD(summary.cny_per_usd)
    }
  }, [summary?.cny_per_usd])

  const refreshReport = () =>
    queryClient.invalidateQueries({ queryKey: ['financial-report'] })

  const createMutation = useMutation({
    mutationFn: createFinancialEntry,
    onSuccess: () => {
      toast.success(t('Financial entry saved'))
      setEntry(getInitialEntry(today))
      void refreshReport()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteFinancialEntry,
    onSuccess: () => {
      toast.success(t('Financial entry deleted'))
      void refreshReport()
    },
  })
  const exchangeRateMutation = useMutation({
    mutationFn: updateFinancialExchangeRate,
    onSuccess: () => {
      toast.success(t('Exchange rate saved'))
      void refreshReport()
    },
  })

  const categoryLabel = (category: FinancialCategory) => {
    if (category === 'other_income') return t('Other income')
    if (category === 'upstream_purchase') return t('Upstream purchase')
    if (category === 'customer_test') return t('Customer testing')
    return t('Other expense')
  }

  const changeDirection = (direction: FinancialDirection) => {
    setEntry((current) => ({
      ...current,
      direction,
      category: direction === 'income' ? 'other_income' : 'upstream_purchase',
    }))
  }

  const submitEntry = () => {
    if (!entry.amount || !entry.occurred_on) {
      toast.error(t('Enter an amount and date'))
      return
    }
    createMutation.mutate(entry)
  }

  const saveExchangeRate = () => {
    if (!cnyPerUSD) {
      toast.error(t('Enter a valid exchange rate'))
      return
    }
    exchangeRateMutation.mutate(cnyPerUSD)
  }

  const setRange = (range: 'today' | 'month') => {
    if (range === 'today') {
      setStartDate(today)
      setEndDate(today)
      return
    }
    setStartDate(`${today.slice(0, 8)}01`)
    setEndDate(today)
  }

  return (
    <SettingsSection title={t('Financial Report')}>
      <p className='text-muted-foreground text-sm'>
        {t('Cash-basis report. Dates use Beijing time (UTC+8).')}
      </p>
      <div className='flex flex-wrap items-end gap-3'>
        <div className='grid gap-1.5'>
          <Label htmlFor='finance-start-date'>{t('Start date')}</Label>
          <Input
            id='finance-start-date'
            type='date'
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor='finance-end-date'>{t('End date')}</Label>
          <Input
            id='finance-end-date'
            type='date'
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <Button variant='outline' onClick={() => setRange('today')}>
          {t('Today')}
        </Button>
        <Button variant='outline' onClick={() => setRange('month')}>
          {t('This month')}
        </Button>
        <Button variant='outline' onClick={() => void refreshReport()}>
          <RefreshCw className='size-4' aria-hidden='true' />
          {t('Refresh')}
        </Button>
      </div>

      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <FinancialCard
          icon={<ArrowUpFromLine className='size-4' aria-hidden='true' />}
          label={t('Customer recharges')}
          value={formatUSD(summary?.customer_top_up_usd ?? '0')}
          description={t('{{count}} successful payments', {
            count: summary?.customer_top_up_count ?? 0,
          })}
        />
        <FinancialCard
          icon={<ArrowUpFromLine className='size-4' aria-hidden='true' />}
          label={t('Total income')}
          value={formatUSD(summary?.total_income_usd ?? '0')}
          description={t('Includes manual other income')}
        />
        <FinancialCard
          icon={<ArrowDownToLine className='size-4' aria-hidden='true' />}
          label={t('Total expense')}
          value={formatUSD(summary?.total_expense_usd ?? '0')}
          description={t('Purchases, customer testing, and other expenses')}
        />
        <FinancialCard
          icon={<Landmark className='size-4' aria-hidden='true' />}
          label={t('Net profit')}
          value={formatUSD(summary?.net_profit_usd ?? '0')}
          description={t('Income minus expense')}
          positive={Number(summary?.net_profit_usd ?? 0) >= 0}
        />
      </div>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]'>
        <Card>
          <CardHeader>
            <CardTitle>{t('Expense breakdown')}</CardTitle>
            <CardDescription>
              {t(
                'Manual costs are kept separately from automatic customer recharge income.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3 sm:grid-cols-3'>
            <FinancialBreakdown
              label={t('Upstream purchase')}
              value={formatUSD(summary?.upstream_purchase_usd ?? '0')}
            />
            <FinancialBreakdown
              label={t('Customer testing')}
              value={formatUSD(summary?.customer_test_usd ?? '0')}
            />
            <FinancialBreakdown
              label={t('Other expense')}
              value={formatUSD(summary?.other_expense_usd ?? '0')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('CNY exchange rate')}</CardTitle>
            <CardDescription>
              {t(
                'Used for future CNY entries only. Existing records keep their original rate.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex gap-2'>
            <Input
              aria-label={t('CNY per USD')}
              inputMode='decimal'
              value={cnyPerUSD}
              onChange={(event) => setCnyPerUSD(event.target.value)}
            />
            <Button
              onClick={saveExchangeRate}
              disabled={exchangeRateMutation.isPending}
            >
              {t('Save')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Add manual entry')}</CardTitle>
          <CardDescription>
            {t(
              'Record upstream purchases, customer testing costs, or one-off income and expenses.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2 xl:grid-cols-6'>
          <div className='grid gap-1.5'>
            <Label>{t('Direction')}</Label>
            <Select
              value={entry.direction}
              onValueChange={(value) =>
                changeDirection(value as FinancialDirection)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='income'>{t('Income')}</SelectItem>
                <SelectItem value='expense'>{t('Expense')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-1.5'>
            <Label>{t('Category')}</Label>
            <Select
              value={entry.category}
              onValueChange={(value) =>
                setEntry((current) => ({
                  ...current,
                  category: value as FinancialCategory,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entry.direction === 'income' ? (
                  <SelectItem value='other_income'>
                    {t('Other income')}
                  </SelectItem>
                ) : (
                  expenseCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {categoryLabel(category)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-1.5'>
            <Label>{t('Currency')}</Label>
            <Select
              value={entry.currency}
              onValueChange={(value) =>
                setEntry((current) => ({
                  ...current,
                  currency: value as CreateFinancialEntryInput['currency'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='USD'>USD</SelectItem>
                <SelectItem value='USDT'>USDT</SelectItem>
                <SelectItem value='CNY'>CNY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='finance-amount'>{t('Amount')}</Label>
            <Input
              id='finance-amount'
              inputMode='decimal'
              placeholder='0.00'
              value={entry.amount}
              onChange={(event) =>
                setEntry((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='finance-occurred-on'>{t('Date')}</Label>
            <Input
              id='finance-occurred-on'
              type='date'
              value={entry.occurred_on}
              onChange={(event) =>
                setEntry((current) => ({
                  ...current,
                  occurred_on: event.target.value,
                }))
              }
            />
          </div>
          <div className='flex items-end'>
            <Button
              className='w-full'
              onClick={submitEntry}
              disabled={createMutation.isPending}
            >
              <Plus className='size-4' aria-hidden='true' />
              {t('Add entry')}
            </Button>
          </div>
          <div className='grid gap-1.5 md:col-span-2 xl:col-span-6'>
            <Label htmlFor='finance-note'>{t('Note')}</Label>
            <Input
              id='finance-note'
              maxLength={1000}
              placeholder={t('Optional note, supplier, or receipt reference')}
              value={entry.note}
              onChange={(event) =>
                setEntry((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Manual entries')}</CardTitle>
          <CardDescription>
            {t('All manual records within the selected Beijing-time period.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>{t('Type')}</TableHead>
                <TableHead>{t('Amount')}</TableHead>
                <TableHead>{t('USD value')}</TableHead>
                <TableHead>{t('Note')}</TableHead>
                <TableHead className='w-20 text-right'>{t('Action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary?.entries.length ? (
                summary.entries.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatBeijingDate(item.occurred_at)}</TableCell>
                    <TableCell>
                      <div className='font-medium'>
                        {categoryLabel(item.category)}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {item.direction === 'income'
                          ? t('Income')
                          : t('Expense')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.amount} {item.currency}
                    </TableCell>
                    <TableCell>{formatUSD(item.usd_value)}</TableCell>
                    <TableCell className='max-w-80 truncate'>
                      {item.note || '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label={t('Delete entry')}
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            window.confirm(t('Delete this financial entry?'))
                          ) {
                            deleteMutation.mutate(item.id)
                          }
                        }}
                      >
                        <Trash2 className='size-4' aria-hidden='true' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground h-24 text-center'
                  >
                    {reportQuery.isLoading
                      ? t('Loading financial report...')
                      : t('No manual entries in this period')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SettingsSection>
  )
}

function FinancialCard(props: {
  icon: ReactNode
  label: string
  value: string
  description: string
  positive?: boolean
}) {
  let valueClassName = 'text-2xl font-semibold'
  if (props.positive === true) {
    valueClassName = 'text-success text-2xl font-semibold'
  } else if (props.positive === false) {
    valueClassName = 'text-destructive text-2xl font-semibold'
  }

  return (
    <Card size='sm'>
      <CardContent className='space-y-2'>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          {props.icon}
          {props.label}
        </div>
        <div className={valueClassName}>{props.value}</div>
        <p className='text-muted-foreground text-xs'>{props.description}</p>
      </CardContent>
    </Card>
  )
}

function FinancialBreakdown(props: { label: string; value: string }) {
  return (
    <div className='bg-muted/40 rounded-lg p-3'>
      <div className='text-muted-foreground text-sm'>{props.label}</div>
      <div className='mt-1 text-lg font-semibold'>{props.value}</div>
    </div>
  )
}
