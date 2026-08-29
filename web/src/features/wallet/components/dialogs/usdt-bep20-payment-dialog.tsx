import { Copy, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { confirmUSDTBEP20Payment } from '../../api'

type Order = { address: string; amount: string; order_id: string }

export function USDTBEP20PaymentDialog() {
  const { t } = useTranslation()
  const [order, setOrder] = useState<Order | null>(null)
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => { if (window.location.hash === '#usdt-bep20-payment') { const raw = window.sessionStorage.getItem('usdt-bep20-order'); if (raw) setOrder(JSON.parse(raw) as Order) } }, [])
  const close = () => { setOrder(null); window.location.hash = ''; window.sessionStorage.removeItem('usdt-bep20-order') }
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success(t('Copied')) }
  const confirm = async () => { if (!order || !hash) return; setLoading(true); try { const result = await confirmUSDTBEP20Payment(order.order_id, hash); if (result.message === 'success') { toast.success(t('Payment confirmed')); close() } else toast.info(t('Payment is still being confirmed')) } finally { setLoading(false) } }
  const value = order ? `ethereum:${order.address}?value=${order.amount}` : ''
  return <Dialog open={!!order} onOpenChange={(open) => !open && close()}><DialogContent><DialogHeader><DialogTitle>USDT (BEP-20)</DialogTitle><DialogDescription>{t('Complete the transfer using the exact amount below.')}</DialogDescription></DialogHeader>{order && <div className='space-y-4'><div className='flex justify-center'><QRCodeSVG value={value} size={180} /></div><Button variant='outline' className='w-full break-all' onClick={() => copy(order.address)}>{order.address}<Copy className='ml-2 size-4 shrink-0' /></Button><Button variant='outline' className='w-full' onClick={() => copy(order.amount)}>{order.amount} USDT<Copy className='ml-2 size-4' /></Button><Input value={hash} onChange={(e) => setHash(e.target.value)} placeholder={t('Transaction Hash')} /><Button className='w-full' disabled={!hash || loading} onClick={confirm}>{loading && <Loader2 className='mr-2 size-4 animate-spin' />}{t('Confirm Payment')}</Button></div>}</DialogContent></Dialog>
}
