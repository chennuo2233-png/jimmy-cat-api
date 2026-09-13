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
import { AlertTriangle, CheckCircle2, Copy, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Order = {
  address: string
  amount: string
  order_id: string
  expires_at: number
  status?: string
}

type PaymentOrderResponse = {
  data?: unknown
}

type USDTNetworkPaymentDialogProps = {
  createdEvent: string
  getOrder: (orderId: string) => Promise<PaymentOrderResponse>
  paymentHash: string
  storageKey: string
  title: string
  network: 'BEP-20' | 'TRC-20'
}

export function USDTNetworkPaymentDialog(props: USDTNetworkPaymentDialogProps) {
  const { t } = useTranslation()
  const createdEvent = props.createdEvent
  const getOrder = props.getOrder
  const paymentHash = props.paymentHash
  const storageKey = props.storageKey
  const [order, setOrder] = useState<Order | null>(null)
  const [checking, setChecking] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const paymentReceived = order?.status === 'success'

  const close = useCallback(() => {
    setOrder(null)
    window.location.hash = ''
    window.sessionStorage.removeItem(storageKey)
  }, [storageKey])

  const loadPaymentOrder = useCallback(() => {
    if (window.location.hash !== `#${paymentHash}`) return
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return

    try {
      setOrder(JSON.parse(raw) as Order)
    } catch {
      window.sessionStorage.removeItem(storageKey)
    }
  }, [paymentHash, storageKey])

  useEffect(() => {
    loadPaymentOrder()
    window.addEventListener('hashchange', loadPaymentOrder)
    window.addEventListener(createdEvent, loadPaymentOrder)
    return () => {
      window.removeEventListener('hashchange', loadPaymentOrder)
      window.removeEventListener(createdEvent, loadPaymentOrder)
    }
  }, [createdEvent, loadPaymentOrder])

  useEffect(() => {
    if (!order || paymentReceived) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [order, paymentReceived])

  useEffect(() => {
    if (!order || paymentReceived || now < order.expires_at * 1000) return
    toast.error(t('This payment order has expired.'))
    close()
  }, [close, now, order, paymentReceived, t])

  useEffect(() => {
    if (
      !order ||
      order.status !== 'pending' ||
      order.expires_at * 1000 <= Date.now()
    ) {
      return
    }
    let cancelled = false
    const check = async () => {
      setChecking(true)
      try {
        const result = await getOrder(order.order_id)
        const next = result.data as Order | undefined
        if (!cancelled && next) {
          setOrder((current) =>
            current?.status === next.status ? current : next
          )
          window.sessionStorage.setItem(storageKey, JSON.stringify(next))
          if (next.status === 'success') {
            toast.success(
              t(
                'Payment received. Your balance has been credited automatically.'
              )
            )
          }
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    void check()
    const timer = window.setInterval(() => void check(), 10_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [getOrder, order, storageKey, t])

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(t('Copied'))
  }
  const remainingSeconds = order
    ? Math.max(0, Math.ceil((order.expires_at * 1000 - now) / 1_000))
    : 0
  const countdown = `${Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')}`

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && close()}>
      <DialogContent className='box-border'>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>
            {paymentReceived
              ? t(
                  'Payment received. Your balance has been credited automatically.'
                )
              : t('Complete the transfer using the exact amount below.')}
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className='flex min-w-0 flex-col gap-4'>
            {paymentReceived ? (
              <div className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4'>
                <div className='flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400'>
                  <CheckCircle2 className='size-4' />
                  {t(
                    'Payment received. Your balance has been credited automatically.'
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className='rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-amber-950 dark:text-amber-100'>
                  <div className='flex items-center gap-2 text-sm font-semibold'>
                    <AlertTriangle className='size-4 shrink-0' />
                    {t('Important payment information')}
                  </div>
                  <p className='mt-2 text-sm leading-5'>
                    {t(
                      'Wallet or payment service fees may apply. Send enough USDT so our address receives the exact amount shown below.'
                    )}
                  </p>
                  <details className='mt-2 text-sm'>
                    <summary className='cursor-pointer font-semibold underline underline-offset-2'>
                      {t('Transfer issue or refund?')}
                    </summary>
                    <p className='mt-2 leading-5'>
                      {t(
                        'If you make a transfer error, keep your payment proof and contact us—we will help resolve it. Unused balance does not expire and may be refunded.'
                      )}
                    </p>
                    <a
                      className='mt-2 inline-block font-semibold underline underline-offset-2'
                      href='https://t.me/Jmm_JimmyCat'
                      rel='noreferrer'
                      target='_blank'
                    >
                      {t('Contact us on Telegram:')} @Jmm_JimmyCat
                    </a>
                  </details>
                </div>
                <div className='flex justify-center'>
                  <QRCodeSVG
                    value={order.address}
                    size={192}
                    level='M'
                    includeMargin
                  />
                </div>
                <Button
                  variant='outline'
                  className='h-auto w-full items-start justify-between gap-3 px-3 py-2.5 text-left'
                  onClick={() => copy(order.address)}
                >
                  <span className='min-w-0 flex-1 font-mono text-xs leading-5 break-all sm:text-sm'>
                    {order.address}
                  </span>
                  <Copy className='mt-0.5 size-4 shrink-0' />
                </Button>
                <Button
                  variant='outline'
                  className='h-auto w-full justify-between gap-3 px-3 py-2.5 font-mono'
                  onClick={() => copy(order.amount)}
                >
                  <span className='min-w-0 break-all'>{order.amount} USDT</span>
                  <Copy className='size-4 shrink-0' />
                </Button>
                <p className='text-muted-foreground text-center text-sm'>
                  {t('Order expires in {{time}}', { time: countdown })}
                </p>
                <p className='text-muted-foreground text-center text-sm'>
                  {props.network === 'BEP-20'
                    ? t(
                        'Payment is checked automatically after 12 BSC confirmations.'
                      )
                    : t(
                        'Payment is checked automatically after TRON finalization.'
                      )}
                </p>
                {checking && (
                  <Loader2 className='text-muted-foreground mx-auto size-4 animate-spin' />
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
