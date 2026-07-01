import { cn } from '@/lib/utils'

export type MaterialIconName =
  | 'add'
  | 'admin_panel_settings'
  | 'analytics'
  | 'apps'
  | 'archive'
  | 'arrow_back'
  | 'arrow_forward'
  | 'article'
  | 'assignment_late'
  | 'block'
  | 'calendar_today'
  | 'cancel'
  | 'check'
  | 'check_circle'
  | 'chevron_left'
  | 'chevron_right'
  | 'cloud_off'
  | 'cloud_download'
  | 'cloud_queue'
  | 'cloud_upload'
  | 'contact_support'
  | 'dashboard'
  | 'delete'
  | 'description'
  | 'devices'
  | 'download'
  | 'drag_indicator'
  | 'draw'
  | 'edit'
  | 'edit_document'
  | 'edit_square'
  | 'encrypted'
  | 'error'
  | 'expand_more'
  | 'file_download'
  | 'filter_list'
  | 'fingerprint'
  | 'folder_zip'
  | 'gavel'
  | 'gesture'
  | 'grid_view'
  | 'group'
  | 'groups'
  | 'help'
  | 'help_outline'
  | 'history'
  | 'history_edu'
  | 'home'
  | 'inbox'
  | 'info'
  | 'inventory_2'
  | 'laptop_mac'
  | 'layers'
  | 'language'
  | 'light_mode'
  | 'lightbulb'
  | 'lock'
  | 'lock_reset'
  | 'logout'
  | 'mail'
  | 'mail_lock'
  | 'merge'
  | 'more_horiz'
  | 'more_vert'
  | 'notifications'
  | 'notifications_active'
  | 'pending'
  | 'pending_actions'
  | 'person'
  | 'person_add'
  | 'person_off'
  | 'photo_camera'
  | 'picture_as_pdf'
  | 'progress_activity'
  | 'remove'
  | 'refresh'
  | 'schedule'
  | 'search'
  | 'security'
  | 'send'
  | 'settings'
  | 'shield'
  | 'smartphone'
  | 'style'
  | 'sync'
  | 'tablet'
  | 'table_rows'
  | 'task_alt'
  | 'timeline'
  | 'upload'
  | 'upload_file'
  | 'verified'
  | 'verified_user'
  | 'visibility'
  | 'visibility_off'
  | 'warning'
  | 'close'
  | 'comment'
  | 'cloud_done'
  | 'menu'
  | 'dark_mode'

interface MaterialIconProps {
  name: MaterialIconName | string
  fill?: boolean
  className?: string
  size?: number
  'aria-hidden'?: boolean
  'aria-label'?: string
}

export function MaterialIcon({
  name,
  fill = false,
  className,
  size = 24,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: MaterialIconProps) {
  return (
    <span
      className={cn('material-symbols-outlined', className)}
      style={{
        fontFamily: "'Material Symbols Outlined Variable', 'Material Symbols Outlined'",
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: size,
        width: size,
        height: size,
        lineHeight: 1,
      }}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    >
      {name}
    </span>
  )
}
