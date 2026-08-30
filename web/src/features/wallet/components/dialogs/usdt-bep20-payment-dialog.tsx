import { CheckCircle2, Copy, Loader2 } from 'lucide-react'
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
            current?.status === next.status && current?.cdk === next.cdk ? current : next
          )
          window.sessionStorage.setItem('usdt-bep20-order', JSON.stringify(next))
          if (next.cdk) toast.success(t('Payment received. Your redemption code is ready.'))
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
  }, [order?.cdk, order?.expires_at, order?.order_id, order?.status, t])

  const close = () => {
    setOrder(null)
    window.location.hash = ''
    window.sessionStorage.removeItem('usdt-bep20-order')
  }
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(t('Copied'))
  }
  const value = order
    ? `ethereum:0x55d398326f99059ff775485246999027b3197955@56/transfer?address=${order.address}&uint256=${order.amount.replace('.', '').padEnd(18, '0')}`
    : ''
  const expired = !!order && order.expires_at * 1000 <= Date.now() && !order.cdk

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>USDT (BEP-20)</DialogTitle>
          <DialogDescription>
            {order?.cdk
              ? t('Payment received. Your redemption code is ready.')
              : t('Complete the transfer using the exact amount below.')}
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className='space-y-4'>
            {order.cdk ? (
              <div className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4'>
                <div className='mb-2 flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400'>
                  <CheckCircle2 className='size-4' />
                  {t('Redemption Code')}
                </div>
                <Button variant='outline' className='w-full break-all font-mono' onClick={() => copy(order.cdk!)}>
                  {order.cdk}
                  <Copy className='ml-2 size-4 shrink-0' />
                </Button>
              </div>
            ) : (
              <>
                <div className='flex justify-center'>
                  <QRCodeSVG value={value} size={180} />
                </div>
                <Button variant='outline' className='w-full break-all' onClick={() => copy(order.address)}>
                  {order.address}
                  <Copy className='ml-2 size-4 shrink-0' />
                </Button>
                <Button variant='outline' className='w-full font-mono' onClick={() => copy(order.amount)}>
                  {order.amount} USDT
                  <Copy className='ml-2 size-4 shrink-0' />
                </Button>
                <p className='text-muted-foreground text-center text-sm'>
                  {expired ? t('This payment order has expired.') : t('Payment is checked automatically after 12 BSC confirmations.')}
                </p>
                {!expired && checking && <Loader2 className='text-muted-foreground mx-auto size-4 animate-spin' />}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
