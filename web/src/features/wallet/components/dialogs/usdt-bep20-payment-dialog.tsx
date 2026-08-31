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

import { getUSDTBEP20PaymentOrder } from '../../api'
import { USDT_BEP20_ORDER_CREATED_EVENT } from '../../lib'

type Order = {
  address: string
  amount: string
  order_id: string
  expires_at: number
  status?: string
  cdk?: string
}

export function USDTBEP20PaymentDialog() {
  const { t } = useTranslation()
  const [order, setOrder] = useState<Order | null>(null)
  const [checking, setChecking] = useState(false)

  const loadPaymentOrder = useCallback(() => {
    if (window.location.hash !== '#usdt-bep20-payment') return
    const raw = window.sessionStorage.getItem('usdt-bep20-order')
    if (!raw) return

    try {
      setOrder(JSON.parse(raw) as Order)
    } catch {
      window.sessionStorage.removeItem('usdt-bep20-order')
    }
  }, [])

  useEffect(() => {
    loadPaymentOrder()
    window.addEventListener('hashchange', loadPaymentOrder)
    window.addEventListener(USDT_BEP20_ORDER_CREATED_EVENT, loadPaymentOrder)
    return () => {
      window.removeEventListener('hashchange', loadPaymentOrder)
      window.removeEventListener(
        USDT_BEP20_ORDER_CREATED_EVENT,
        loadPaymentOrder
      )
    }
  }, [loadPaymentOrder])

  useEffect(() => {
    if (!order || order.cdk || order.expires_at * 1000 <= Date.now()) return
    let cancelled = false
    const check = async () => {
      setChecking(true)
      try {
        const result = await getUSDTBEP20PaymentOrder(order.order_id)
        const next = result.data as Order | undefined
        if (!cancelled && next) {
          setOrder((current) =>
            current?.status === next.status && current?.cdk === next.cdk
              ? current
              : next
          )
          window.sessionStorage.setItem(
            'usdt-bep20-order',
            JSON.stringify(next)
          )
          if (next.cdk) {
            toast.success(t('Payment received. Your redemption code is ready.'))
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
  }, [order, t])

  const close = () => {
    setOrder(null)
    window.location.hash = ''
    window.sessionStorage.removeItem('usdt-bep20-order')
  }
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(t('Copied'))
  }
  const expired = !!order && order.expires_at * 1000 <= Date.now() && !order.cdk
  const redemptionCode = order?.cdk

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && close()}>
      <DialogContent className='box-border'>
        <DialogHeader>
          <DialogTitle>USDT (BEP-20)</DialogTitle>
          <DialogDescription>
            {order?.cdk
              ? t('Payment received. Your redemption code is ready.')
              : t('Complete the transfer using the exact amount below.')}
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className='flex min-w-0 flex-col gap-4'>
            {redemptionCode ? (
              <div className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4'>
                <div className='mb-2 flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400'>
                  <CheckCircle2 className='size-4' />
                  {t('Redemption Code')}
                </div>
                <Button
                  variant='outline'
                  className='w-full font-mono break-all'
                  onClick={() => copy(redemptionCode)}
                >
                  {redemptionCode}
                  <Copy className='ml-2 size-4 shrink-0' />
                </Button>
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
                  {expired
                    ? t('This payment order has expired.')
                    : t(
                        'Payment is checked automatically after 12 BSC confirmations.'
                      )}
                </p>
                {!expired && checking && (
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
