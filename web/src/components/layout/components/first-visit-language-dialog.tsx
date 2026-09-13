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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { normalizeInterfaceLanguage } from '@/i18n/languages'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const LANGUAGE_PROMPT_STORAGE_KEY = 'language_welcome_seen_v1'

const preferredLanguages = [
  { code: 'en', flag: '🇬🇧', label: 'English', detailKey: 'English interface' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский', detailKey: 'Russian interface' },
  {
    code: 'vi',
    flag: '🇻🇳',
    label: 'Tiếng Việt',
    detailKey: 'Vietnamese interface',
  },
] as const

function hasSeenLanguagePrompt(): boolean {
  try {
    return window.localStorage.getItem(LANGUAGE_PROMPT_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function rememberLanguagePrompt(): void {
  try {
    window.localStorage.setItem(LANGUAGE_PROMPT_STORAGE_KEY, 'true')
  } catch {
    // Storage can be unavailable in private browsing; dismissal still works.
  }
}

export function FirstVisitLanguageDialog() {
  const { i18n, t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const bootstrapState = useAuthStore((state) => state.auth.bootstrapState)
  const [open, setOpen] = useState(() => !hasSeenLanguagePrompt())
  const currentLanguage = normalizeInterfaceLanguage(i18n.language)

  const dismiss = () => {
    rememberLanguagePrompt()
    setOpen(false)
  }

  const selectLanguage = async (code: string) => {
    await i18n.changeLanguage(code)
    dismiss()
  }

  if (bootstrapState !== 'complete' || user) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss()
      }}
      title={t('Choose your language')}
      description={t(
        'Select your preferred interface language. You can change it later from the top menu.'
      )}
      contentClassName='overflow-hidden border-border/70 p-0 shadow-2xl sm:max-w-md sm:p-0'
      headerClassName='relative space-y-2 bg-gradient-to-br from-sky-500/10 via-background to-violet-500/10 px-6 pt-7 pb-4 pe-14 sm:ps-20'
      titleClassName='flex items-center gap-2.5 text-xl'
      descriptionClassName='max-w-sm text-sm leading-relaxed'
      bodyClassName='space-y-3 px-5 pt-2 pb-5'
      initialFocus={false}
    >
      <div className='bg-primary/10 text-primary absolute start-6 top-6 hidden size-9 items-center justify-center rounded-xl sm:flex'>
        <Languages className='size-5' aria-hidden='true' />
      </div>
      <div className='space-y-2'>
        {preferredLanguages.map((language) => {
          const selected = currentLanguage === language.code
          return (
            <Button
              key={language.code}
              type='button'
              variant='outline'
              aria-pressed={selected}
              onClick={() => void selectLanguage(language.code)}
              className={cn(
                'group h-auto w-full justify-start gap-3 rounded-2xl px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 hover:shadow-md',
                selected &&
                  'border-primary/60 bg-primary/5 ring-primary/15 ring-2'
              )}
            >
              <span
                className='bg-muted flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm'
                aria-hidden='true'
              >
                {language.flag}
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block text-base font-semibold'>
                  {language.label}
                </span>
                <span className='text-muted-foreground block text-xs font-normal'>
                  {t(language.detailKey)}
                </span>
              </span>
              <span
                className={cn(
                  'bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full transition-opacity',
                  selected ? 'opacity-100' : 'opacity-0'
                )}
                aria-hidden='true'
              >
                <Check className='size-3.5' />
              </span>
            </Button>
          )
        })}
      </div>
      <p className='text-muted-foreground px-2 text-center text-xs leading-relaxed'>
        {t('Russian is selected by default. Click outside to continue.')}
      </p>
    </Dialog>
  )
}
