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
import { getUSDTTRC20PaymentOrder } from '../../api'
import { USDT_TRC20_ORDER_CREATED_EVENT } from '../../lib'
import { USDTNetworkPaymentDialog } from './usdt-payment-dialog'

export function USDTTRC20PaymentDialog() {
  return (
    <USDTNetworkPaymentDialog
      createdEvent={USDT_TRC20_ORDER_CREATED_EVENT}
      getOrder={getUSDTTRC20PaymentOrder}
      network='TRC-20'
      paymentHash='usdt-trc20-payment'
      storageKey='usdt-trc20-order'
      title='USDT (TRC-20)'
    />
  )
}
