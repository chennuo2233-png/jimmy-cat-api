/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  createGroupBusinessRecord,
  deleteGroupBusinessLedger,
  getGroupBusinessOverview,
  getGroupBusinessSnapshotDetails,
} from './api'
import type {
  GroupBusinessLedgerType,
  GroupBusinessProduct,
  GroupBusinessSnapshot,
} from './types'

function beijingDate(timestamp?: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp ? timestamp * 1000 : Date.now()))
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )
  return `${values.year}-${values.month}-${values.day}`
}

function cny(value: string | undefined): string {
  const amount = Number(value ?? 0)
  return `${Number.isFinite(amount) ? amount.toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '0'} 元`
}

const ledgerLabels: Record<GroupBusinessLedgerType, string> = {
  payment: '顾客收款与已充值额度',
  trial_credit: '发放测试额度',
  upstream_purchase: '上游采购付款',
  upstream_balance: '上游余额盘点',
  refund: '顾客退款',
  other_income: '其他收入',
  other_expense: '其他支出',
}

const customerLedgerTypes = new Set<GroupBusinessLedgerType>([
  'payment',
  'trial_credit',
  'refund',
])

export function GroupBusinessSection() {
  const queryClient = useQueryClient()
  const today = useMemo(() => beijingDate(), [])
  const previousDay = useMemo(() => {
    const [year, month, day] = today.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day - 1))
    return date.toISOString().slice(0, 10)
  }, [today])
  const [productId, setProductId] = useState<number>()
  const [startDate, setStartDate] = useState(() => `${today.slice(0, 8)}01`)
  const [endDate, setEndDate] = useState(today)
  const [snapshotDate, setSnapshotDate] = useState(previousDay)
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<GroupBusinessSnapshot>()
  const [product, setProduct] = useState({
    name: '',
    group_name: '',
    settlement_rate_cny: '2.45',
    upstream_cost_cny: '2.4',
    sales_share_rate: '0.2',
    partner_share_rate: '0.4',
    owner_share_rate: '0.4',
    started_on: today,
    active: true,
  })
  const [salesName, setSalesName] = useState('')
  const [customer, setCustomer] = useState({
    user_id: '',
    salesperson_id: '',
    chat_name: '',
    effective_on: today,
    note: '',
  })
  const [ledger, setLedger] = useState({
    type: 'payment' as GroupBusinessLedgerType,
    customer_id: '',
    cash_amount_cny: '',
    credit_amount_cny: '',
    upstream_balance_cny: '',
    occurred_on: today,
    note: '',
  })

  const overviewQuery = useQuery({
    queryKey: ['group-business', productId, startDate, endDate],
    queryFn: () => getGroupBusinessOverview({ productId, startDate, endDate }),
  })
  const detailsQuery = useQuery({
    queryKey: ['group-business-snapshot-details', selectedSnapshot?.id],
    queryFn: () => getGroupBusinessSnapshotDetails(selectedSnapshot?.id ?? 0),
    enabled: Boolean(selectedSnapshot?.id),
  })
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['group-business'] })
  const mutate = useMutation({
    mutationFn: ({ path, payload }: { path: string; payload: unknown }) =>
      createGroupBusinessRecord(path, payload),
    onSuccess: () => {
      toast.success('已保存')
      void refresh()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteGroupBusinessLedger,
    onSuccess: () => {
      toast.success('已删除')
      void refresh()
    },
  })
  const data = overviewQuery.data
  const selectedProduct = data?.products.find((item) => item.id === productId)

  // A product is the entry point for this page. Keeping the first product
  // selected makes the sales, customer and ledger forms available immediately
  // after an administrator creates the first product or opens this page again.
  useEffect(() => {
    if (productId !== undefined || !data?.products.length) {
      return
    }
    setProductId(data.products[0].id)
  }, [data?.products, productId])

  const requiresCustomer = customerLedgerTypes.has(ledger.type)
  const isPaymentOrRefund =
    ledger.type === 'payment' || ledger.type === 'refund'
  const isTrialCredit = ledger.type === 'trial_credit'
  const isUpstreamBalance = ledger.type === 'upstream_balance'
  let cashAmountPlaceholder = '其他支出 CNY'
  if (ledger.type === 'upstream_purchase') {
    cashAmountPlaceholder = '上游采购付款 CNY'
  } else if (ledger.type === 'other_income') {
    cashAmountPlaceholder = '其他收入 CNY'
  }

  const createProduct = () => {
    if (!product.name || !product.group_name) {
      toast.error('请填写产品名称和平台分组')
      return
    }
    mutate.mutate(
      { path: 'products', payload: product },
      {
        onSuccess: (response) => {
          const createdProduct = response.data as
            | GroupBusinessProduct
            | undefined
          if (createdProduct?.id) {
            setProductId(createdProduct.id)
          }
          setProduct({ ...product, name: '', group_name: '' })
          void refresh()
        },
      }
    )
  }
  const createSalesperson = () => {
    if (!salesName.trim()) {
      toast.error('请填写销售人员名称')
      return
    }
    mutate.mutate(
      { path: 'salespeople', payload: { name: salesName, active: true } },
      {
        onSuccess: () => {
          setSalesName('')
          void refresh()
        },
      }
    )
  }
  const createCustomer = () => {
    if (!productId || !customer.user_id || !customer.salesperson_id) {
      toast.error('请选择网站账号和销售人员')
      return
    }
    mutate.mutate(
      {
        path: `products/${productId}/customers`,
        payload: {
          ...customer,
          user_id: Number(customer.user_id),
          salesperson_id: Number(customer.salesperson_id),
          active: true,
        },
      },
      {
        onSuccess: () => {
          setCustomer({
            user_id: '',
            salesperson_id: '',
            chat_name: '',
            effective_on: today,
            note: '',
          })
          void refresh()
        },
      }
    )
  }
  const createLedger = () => {
    if (!productId) {
      toast.error('请先选择产品')
      return
    }
    if (requiresCustomer && !ledger.customer_id) {
      toast.error('此账目必须选择顾客')
      return
    }
    mutate.mutate(
      {
        path: `products/${productId}/ledger`,
        payload: {
          ...ledger,
          customer_id: ledger.customer_id ? Number(ledger.customer_id) : 0,
        },
      },
      {
        onSuccess: () => {
          setLedger({
            type: 'payment',
            customer_id: '',
            cash_amount_cny: '',
            credit_amount_cny: '',
            upstream_balance_cny: '',
            occurred_on: today,
            note: '',
          })
          void refresh()
        },
      }
    )
  }
  const generateSnapshot = () => {
    if (!productId) {
      toast.error('请先选择产品')
      return
    }
    mutate.mutate(
      {
        path: `products/${productId}/snapshots?date=${snapshotDate}`,
        payload: {},
      },
      { onSuccess: () => void refresh() }
    )
  }

  return (
    <SettingsSection title='分组业务财务'>
      <p className='text-muted-foreground text-sm'>
        只统计已录入客户且属于所选平台分组的使用数据。所有日期按北京时间；日报在每天
        00:05 自动封存，已封存日报不会被退款或后续修改追溯改写。
      </p>
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'>
        <Card>
          <CardHeader>
            <CardTitle>新建业务产品</CardTitle>
            <CardDescription>
              绑定一个现有平台分组。结算价与上游成本均为每 1 元顾客额度对应的
              结算与采购单价，默认 2.45 / 2.40，毛利差额为 0.05。
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <Input
              placeholder='产品名称，例如 AWSB 渠道 A'
              value={product.name}
              onChange={(event) =>
                setProduct({ ...product, name: event.target.value })
              }
            />
            <Input
              placeholder='平台分组，例如 1.AWSB'
              value={product.group_name}
              onChange={(event) =>
                setProduct({ ...product, group_name: event.target.value })
              }
            />
            <div className='grid grid-cols-2 gap-2'>
              <Input
                aria-label='结算价'
                inputMode='decimal'
                placeholder='结算价'
                value={product.settlement_rate_cny}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    settlement_rate_cny: event.target.value,
                  })
                }
              />
              <Input
                aria-label='上游成本'
                inputMode='decimal'
                placeholder='上游成本'
                value={product.upstream_cost_cny}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    upstream_cost_cny: event.target.value,
                  })
                }
              />
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <Input
                aria-label='销售分成'
                inputMode='decimal'
                placeholder='销售 0.2'
                value={product.sales_share_rate}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    sales_share_rate: event.target.value,
                  })
                }
              />
              <Input
                aria-label='合伙人分成'
                inputMode='decimal'
                placeholder='合伙人 0.4'
                value={product.partner_share_rate}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    partner_share_rate: event.target.value,
                  })
                }
              />
              <Input
                aria-label='本人分成'
                inputMode='decimal'
                placeholder='本人 0.4'
                value={product.owner_share_rate}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    owner_share_rate: event.target.value,
                  })
                }
              />
            </div>
            <Input
              type='date'
              value={product.started_on}
              onChange={(event) =>
                setProduct({ ...product, started_on: event.target.value })
              }
            />
            <Button onClick={createProduct} disabled={mutate.isPending}>
              <Plus className='size-4' />
              新建产品
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>选择产品与统计区间</CardTitle>
            <CardDescription>
              产品与平台分组一一对应；更换产品时，客户、账目与日报会完全隔离。
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3 md:grid-cols-4'>
            <Select
              value={productId?.toString()}
              onValueChange={(value) => {
                const nextProductId = Number(value)
                if (
                  !Number.isSafeInteger(nextProductId) ||
                  nextProductId <= 0
                ) {
                  return
                }
                setProductId(nextProductId)
                setSelectedSnapshot(undefined)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='选择业务产品' />
              </SelectTrigger>
              <SelectContent>
                {data?.products.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} · {item.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type='date'
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              type='date'
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <Button variant='outline' onClick={() => void refresh()}>
              <RefreshCw className='size-4' />
              刷新
            </Button>
            {selectedProduct && (
              <div className='text-muted-foreground rounded-md border p-3 text-sm md:col-span-4'>
                当前：
                <strong className='text-foreground'>
                  {selectedProduct.name}
                </strong>{' '}
                · 分组{' '}
                <strong className='text-foreground'>
                  {selectedProduct.group_name}
                </strong>{' '}
                · 结算 {selectedProduct.settlement_rate_cny} CNY / 上游{' '}
                {selectedProduct.upstream_cost_cny} CNY · 毛利差额{' '}
                {Number(selectedProduct.settlement_rate_cny) -
                  Number(selectedProduct.upstream_cost_cny)}{' '}
                CNY
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedProduct && (
        <div className='grid gap-4 xl:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>销售人员与客户归属</CardTitle>
              <CardDescription>
                客户归属用于按客户已付费消耗计算销售 20%
                分成；测试消耗只计成本，不参与分成。
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3'>
              <div className='flex gap-2'>
                <Input
                  placeholder='销售人员名称'
                  value={salesName}
                  onChange={(event) => setSalesName(event.target.value)}
                />
                <Button variant='outline' onClick={createSalesperson}>
                  添加销售
                </Button>
              </div>
              <div className='grid gap-2 md:grid-cols-2'>
                <Select
                  value={customer.user_id}
                  onValueChange={(value) =>
                    setCustomer({ ...customer, user_id: value ?? '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='选择此分组内的网站账号' />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.eligible_users?.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.username}（#{item.id}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={customer.salesperson_id}
                  onValueChange={(value) =>
                    setCustomer({ ...customer, salesperson_id: value ?? '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='选择销售' />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.salespeople
                      .filter((item) => item.active)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2 md:grid-cols-2'>
                <Input
                  placeholder='客户群聊名称（可选）'
                  value={customer.chat_name}
                  onChange={(event) =>
                    setCustomer({ ...customer, chat_name: event.target.value })
                  }
                />
                <Input
                  type='date'
                  value={customer.effective_on}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      effective_on: event.target.value,
                    })
                  }
                />
              </div>
              <Input
                placeholder='备注（可选）'
                value={customer.note}
                onChange={(event) =>
                  setCustomer({ ...customer, note: event.target.value })
                }
              />
              <Button onClick={createCustomer} disabled={mutate.isPending}>
                保存客户归属
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>手动账目</CardTitle>
              <CardDescription>
                不改动网站用户余额。顾客付款与已充值额度分开录入；测试额度默认填
                10 CNY。
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3'>
              <Select
                value={ledger.type}
                onValueChange={(value) => {
                  const type = value as GroupBusinessLedgerType
                  setLedger({
                    ...ledger,
                    type,
                    customer_id: customerLedgerTypes.has(type)
                      ? ledger.customer_id
                      : '',
                    cash_amount_cny: '',
                    credit_amount_cny: type === 'trial_credit' ? '10' : '',
                    upstream_balance_cny: '',
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ledgerLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requiresCustomer && (
                <Select
                  value={ledger.customer_id}
                  onValueChange={(value) =>
                    setLedger({ ...ledger, customer_id: value ?? '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='选择客户' />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.customers
                      ?.filter((item) => item.active)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.username} · {item.chat_name || '未填写群聊'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              {isPaymentOrRefund && (
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    aria-label='实收或退款 CNY'
                    inputMode='decimal'
                    placeholder={
                      ledger.type === 'payment'
                        ? '实收金额 CNY'
                        : '退款现金 CNY'
                    }
                    value={ledger.cash_amount_cny}
                    onChange={(event) =>
                      setLedger({
                        ...ledger,
                        cash_amount_cny: event.target.value,
                      })
                    }
                  />
                  <Input
                    aria-label='充值或退回额度 CNY'
                    inputMode='decimal'
                    placeholder={
                      ledger.type === 'payment'
                        ? '已充值额度 CNY'
                        : '退回额度 CNY'
                    }
                    value={ledger.credit_amount_cny}
                    onChange={(event) =>
                      setLedger({
                        ...ledger,
                        credit_amount_cny: event.target.value,
                      })
                    }
                  />
                </div>
              )}
              {isTrialCredit && (
                <Input
                  aria-label='发放测试额度 CNY'
                  inputMode='decimal'
                  placeholder='发放测试额度 CNY，默认 10'
                  value={ledger.credit_amount_cny}
                  onChange={(event) =>
                    setLedger({
                      ...ledger,
                      credit_amount_cny: event.target.value,
                    })
                  }
                />
              )}
              {isUpstreamBalance && (
                <Input
                  aria-label='上游余额 CNY'
                  inputMode='decimal'
                  placeholder='本次盘点的上游余额 CNY，可为 0'
                  value={ledger.upstream_balance_cny}
                  onChange={(event) =>
                    setLedger({
                      ...ledger,
                      upstream_balance_cny: event.target.value,
                    })
                  }
                />
              )}
              {!isPaymentOrRefund && !isTrialCredit && !isUpstreamBalance && (
                <Input
                  aria-label='金额 CNY'
                  inputMode='decimal'
                  placeholder={cashAmountPlaceholder}
                  value={ledger.cash_amount_cny}
                  onChange={(event) =>
                    setLedger({
                      ...ledger,
                      cash_amount_cny: event.target.value,
                    })
                  }
                />
              )}
              <Input
                type='date'
                value={ledger.occurred_on}
                onChange={(event) =>
                  setLedger({ ...ledger, occurred_on: event.target.value })
                }
              />
              <Input
                placeholder='备注（付款方式、流水号等）'
                value={ledger.note}
                onChange={(event) =>
                  setLedger({ ...ledger, note: event.target.value })
                }
              />
              <Button onClick={createLedger} disabled={mutate.isPending}>
                记入账目
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>每日封存与利润结算</CardTitle>
            <CardDescription>
              日报以“测试额度优先消耗”拆分。可手动生成首次上线后的任意遗漏日期；已经存在的日报只读。
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <div className='flex flex-wrap gap-2'>
              <Input
                className='w-44'
                type='date'
                value={snapshotDate}
                onChange={(event) => setSnapshotDate(event.target.value)}
              />
              <Button onClick={generateSnapshot} disabled={mutate.isPending}>
                生成该日封存日报
              </Button>
            </div>
            <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
              {data?.snapshots?.slice(0, 4).map((item) => (
                <Card
                  key={item.id}
                  className='cursor-pointer'
                  onClick={() => setSelectedSnapshot(item)}
                >
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>{item.date}</CardTitle>
                    <CardDescription>
                      客户 {item.customer_count} 位
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='grid gap-1 text-sm'>
                    <span>已付费消耗：{cny(item.paid_consumption_cny)}</span>
                    <span>测试消耗：{cny(item.trial_consumption_cny)}</span>
                    <strong>
                      可分配利润：{cny(item.distributable_margin_cny)}
                    </strong>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedSnapshot && (
              <div className='grid gap-3 rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <strong>{selectedSnapshot.date} 日报明细</strong>
                  <span className='text-muted-foreground text-sm'>
                    销售 {cny(selectedSnapshot.sales_commission_cny)} · 合伙人{' '}
                    {cny(selectedSnapshot.partner_share_cny)} · 本人{' '}
                    {cny(selectedSnapshot.owner_share_cny)} · 上游余额{' '}
                    {cny(selectedSnapshot.latest_upstream_balance_cny)}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>客户</TableHead>
                      <TableHead>销售</TableHead>
                      <TableHead>已付费消耗</TableHead>
                      <TableHead>测试消耗</TableHead>
                      <TableHead>上游成本</TableHead>
                      <TableHead>销售分成</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsQuery.data?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.username}</TableCell>
                        <TableCell>{item.salesperson_name}</TableCell>
                        <TableCell>{cny(item.paid_consumption_cny)}</TableCell>
                        <TableCell>{cny(item.trial_consumption_cny)}</TableCell>
                        <TableCell>{cny(item.upstream_cost_cny)}</TableCell>
                        <TableCell>{cny(item.sales_commission_cny)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>当前筛选区间的手工账目</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>现金</TableHead>
                  <TableHead>额度</TableHead>
                  <TableHead>上游余额</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.ledger?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{beijingDate(item.occurred_at)}</TableCell>
                    <TableCell>{ledgerLabels[item.type]}</TableCell>
                    <TableCell>
                      {data?.customers?.find(
                        (customerItem) => customerItem.id === item.customer_id
                      )?.username || '-'}
                    </TableCell>
                    <TableCell>{cny(item.cash_amount_cny)}</TableCell>
                    <TableCell>{cny(item.credit_amount_cny)}</TableCell>
                    <TableCell>{cny(item.upstream_balance_cny)}</TableCell>
                    <TableCell>{item.note || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label='删除账目'
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </SettingsSection>
  )
}
