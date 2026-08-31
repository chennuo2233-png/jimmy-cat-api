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
import { cleanup, render, screen } from '@testing-library/react'
import { createInstance } from 'i18next'
import { initReactI18next, I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getUSDTBEP20PaymentOrder } from '../../../api'
import { USDTBEP20PaymentDialog } from '../usdt-bep20-payment-dialog'

vi.mock('../../../api', () => ({
  getUSDTBEP20PaymentOrder: vi.fn(),
}))

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'ru',
  resources: {
    ru: {
      translation: {
        'Complete the transfer using the exact amount below.':
          'Переведите точную сумму, указанную ниже.',
        'Contact us on Telegram:': 'Свяжитесь с нами в Telegram:',
        Copied: 'Скопировано',
        'Important payment information': 'Важная информация об оплате',
        'Payment is checked automatically after 12 BSC confirmations.':
          'Платёж будет проверен автоматически после 12 подтверждений в сети BSC.',
        'Payment received. Your redemption code is ready.':
          'Платёж получен. Ваш код пополнения готов.',
        'Redemption Code': 'Код пополнения',
        'This payment order has expired.':
          'Срок действия этого платёжного заказа истёк.',
        'Wallet or payment service fees may apply. Make sure the exact USDT amount shown below reaches our address. If you make a transfer error, keep your payment proof and contact us—we will help resolve it. Unused balance does not expire and may be refunded.':
          'Кошелёк или платёжный сервис может удержать комиссию. Убедитесь, что на наш адрес поступит ровно указанная ниже сумма USDT. Если вы ошиблись при переводе, сохраните подтверждение оплаты и свяжитесь с нами — мы поможем разобраться. Неиспользованный баланс не имеет срока действия; для возврата также свяжитесь с нами.',
      },
    },
  },
})

afterEach(() => {
  cleanup()
  window.location.hash = ''
  window.sessionStorage.clear()
  vi.clearAllMocks()
})

beforeEach(() => {
  vi.spyOn(window, 'setInterval').mockReturnValue(
    0 as unknown as ReturnType<typeof window.setInterval>
  )
})

describe('USDT BEP-20 payment dialog', () => {
  test('shows the localized fee, support, and refund notice for a pending payment', async () => {
    vi.mocked(getUSDTBEP20PaymentOrder).mockResolvedValue({
      data: {
        address: '0x1234567890123456789012345678901234567890',
        amount: '10.001000',
        expires_at: Date.now() / 1000 + 60,
        order_id: 'USDT_BEP20-test',
        status: 'pending',
      },
    })
    window.location.hash = '#usdt-bep20-payment'
    window.sessionStorage.setItem(
      'usdt-bep20-order',
      JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        amount: '10.001000',
        expires_at: Date.now() / 1000 + 60,
        order_id: 'USDT_BEP20-test',
        status: 'pending',
      })
    )

    render(
      <I18nextProvider i18n={i18n}>
        <USDTBEP20PaymentDialog />
      </I18nextProvider>
    )

    expect(
      await screen.findByText('Важная информация об оплате')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Кошелёк или платёжный сервис может удержать комиссию/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'Свяжитесь с нами в Telegram: @Jmm_JimmyCat',
      })
    ).toHaveAttribute('href', 'https://t.me/Jmm_JimmyCat')
  })
})
