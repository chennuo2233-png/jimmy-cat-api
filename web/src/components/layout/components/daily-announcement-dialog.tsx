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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { RichContent } from '@/components/rich-content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { formatDateTimeObject } from '@/lib/time'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationStore } from '@/stores/notification-store'

type Announcement = {
  title?: string
  content: string
  publishDate?: string
  extra?: string
}

const utcPlusThreeOffsetMilliseconds = 3 * 60 * 60 * 1_000

export function DailyAnnouncementDialog() {
  const { t } = useTranslation()
  const { status, loading } = useStatus()
  const user = useAuthStore((state) => state.auth.user)
  const announcementPopupDate = useNotificationStore((state) =>
    user ? state.announcementPopupDates[String(user.id)] : null
  )
  const setAnnouncementPopupDate = useNotificationStore(
    (state) => state.setAnnouncementPopupDate
  )
  const [open, setOpen] = useState(false)
  const announcements = status?.announcements_enabled
    ? ((status.announcements || []) as Announcement[])
    : []
  const latestAnnouncement = announcements[0]
  const utcPlusThreeDate = new Date(Date.now() + utcPlusThreeOffsetMilliseconds)
    .toISOString()
    .slice(0, 10)

  useEffect(() => {
    if (
      loading ||
      !user ||
      !latestAnnouncement?.content ||
      announcementPopupDate === utcPlusThreeDate
    ) {
      return
    }
    setOpen(true)
  }, [
    announcementPopupDate,
    latestAnnouncement?.content,
    loading,
    utcPlusThreeDate,
    user,
  ])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (user) {
        setAnnouncementPopupDate(user.id, utcPlusThreeDate)
      }
    }
    setOpen(nextOpen)
  }

  if (!latestAnnouncement) return null

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={latestAnnouncement.title?.trim() || t('System Announcement')}
      description={
        latestAnnouncement.publishDate
          ? `${t('Published:')} ${formatDateTimeObject(new Date(latestAnnouncement.publishDate))}`
          : undefined
      }
      contentClassName='sm:max-w-lg'
      bodyClassName='space-y-4'
      showCloseButton={false}
      footer={
        <Button onClick={() => handleOpenChange(false)}>{t('Close')}</Button>
      }
    >
      <div className='space-y-4'>
        <Badge variant='secondary'>{t('Latest system update')}</Badge>
        <RichContent breaks content={latestAnnouncement.content} />
        {latestAnnouncement.extra ? (
          <div className='text-muted-foreground text-sm'>
            <RichContent breaks content={latestAnnouncement.extra} />
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}
