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
import { Check, Languages } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
  toIntlLocale,
} from '@/i18n/languages'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

type LanguageSwitcherProps = {
  showLabel?: boolean
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function LanguageSwitcher(props: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const currentLanguage = normalizeInterfaceLanguage(i18n.language)
  const currentOption = INTERFACE_LANGUAGE_OPTIONS.find(
    (language) => language.code === currentLanguage
  )

  useEffect(() => {
    document.documentElement.lang = toIntlLocale(currentLanguage) ?? 'ru'
  }, [currentLanguage])

  const handleChangeLanguage = useCallback(
    async (code: string) => {
      await i18n.changeLanguage(code)
      if (user) {
        try {
          await api.put('/api/user/self', { language: code })
        } catch {
          // Best-effort persistence; don't block the UI on failure
        }
      }
    },
    [i18n, user]
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant={props.showLabel ? 'outline' : 'ghost'}
            size={props.showLabel ? 'default' : 'icon'}
            className={cn(
              props.showLabel
                ? 'h-9 min-w-36 justify-between gap-2'
                : 'h-9 w-9',
              props.className
            )}
          />
        }
      >
        {props.showLabel ? (
          <>
            <span aria-hidden='true'>{currentOption?.flag}</span>
            <span className='flex-1 text-start'>{currentOption?.label}</span>
            <Languages className='size-4' aria-hidden='true' />
          </>
        ) : (
          <>
            <Languages className='size-[1.2rem]' aria-hidden='true' />
            <span className='sr-only'>{t('Change language')}</span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={props.align ?? 'end'} className='min-w-48'>
        {INTERFACE_LANGUAGE_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChangeLanguage(lang.code)}
          >
            <span className='text-base' aria-hidden='true'>
              {lang.flag}
            </span>
            <span className='flex-1'>{lang.label}</span>
            <Check
              size={14}
              className={cn(
                'ms-auto',
                currentLanguage !== lang.code && 'hidden'
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
