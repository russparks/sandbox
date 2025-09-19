import type { ProjectStatus } from './types'

export const STATUS_ICON: Record<ProjectStatus, string> = {
  precon: './images/precon.png',
  construction: './images/construction.png',
  permanent: './images/permanent.png',
}

export const STATUS_TEXT: Record<ProjectStatus, { color: string; label: string }> = {
  construction: { color: '#059669', label: 'construction' },
  precon: { color: '#b45309', label: 'precon' },
  permanent: { color: '#111111', label: 'permanent' },
}

export const LEAD_ICON = './images/person-icon.png'
