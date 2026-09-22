import type { AppPagePermission } from '@/types'

export type PageCategory = 'Core' | 'Work' | 'Financial' | 'Admin'

export type PageDefinition = {
  key: AppPagePermission
  title: string
  path: string
  category: PageCategory
  description: string
}

export const ALL_PAGES: PageDefinition[] = [
  {
    key: 'dashboard',
    title: 'Financial Dashboard',
    path: '/',
    category: 'Core',
    description: 'Executive financial metrics, spend breakdown, and income summaries',
  },
  {
    key: 'status-board',
    title: 'Status Board',
    path: '/work/status-board',
    category: 'Work',
    description: 'Kanban board tracking work assessments through workflow stages',
  },
  {
    key: 'impact-board',
    title: 'Impact Board',
    path: '/work/impact-board',
    category: 'Work',
    description: 'Priority calibration matrix for tasks and critical deliverables',
  },
  {
    key: 'create-assessment',
    title: 'Create Assessment',
    path: '/work/create',
    category: 'Work',
    description: 'Initiate and assign new work items and assessments',
  },
  {
    key: 'clients',
    title: 'Clients',
    path: '/clients',
    category: 'Financial',
    description: 'Client directory, active contracts, and company profiles',
  },
  {
    key: 'invoices',
    title: 'Invoices',
    path: '/invoices',
    category: 'Financial',
    description: 'Billing records, client invoicing, and payment receipts',
  },
  {
    key: 'fixed-costs',
    title: 'Fixed Costs',
    path: '/add-fixed-cost',
    category: 'Financial',
    description: 'Recurring company expenses and infrastructure costs',
  },
  {
    key: 'operational-costs',
    title: 'Operational Costs',
    path: '/add-operational-cost',
    category: 'Financial',
    description: 'Day-to-day team expenditures and operational outlays',
  },
  {
    key: 'contact-messages',
    title: 'Contact Messages',
    path: '/admin/contacts',
    category: 'Core',
    description: 'Inbound inquiries and stakeholder submissions',
  },
  {
    key: 'image-converter',
    title: 'Image Converter',
    path: '/image-converter',
    category: 'Core',
    description: 'Image format conversion and asset processing utility',
  },
  {
    key: 'user-management',
    title: 'User Management & Roles',
    path: '/admin/users',
    category: 'Admin',
    description: 'System access control, manager delegation, and team hierarchy',
  },
  {
    key: 'site-management',
    title: 'Site Credentials',
    path: '/admin/sites',
    category: 'Admin',
    description: 'Secure credential vault for external platform sites',
  },
]

export type PagePermissionLevel = 'none' | 'view' | 'edit'

export const isUserAdmin = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN')
}

export const isUserManager = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'MANAGER')
}

export const isInternalUser = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'INTERNAL_USER')
}

export const isExternalUser = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'EXTERNAL_USER')
}

/**
 * Parse an accessiblePages raw array/object into a map of pageKey -> PagePermissionLevel
 */
export function parseAccessiblePages(raw: unknown): Record<string, PagePermissionLevel> {
  const map: Record<string, PagePermissionLevel> = {}
  if (!raw) return map

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== 'string') continue
      if (item === '*') {
        for (const p of ALL_PAGES) {
          map[p.key] = 'edit'
        }
        continue
      }
      if (item.includes(':')) {
        const [k, level] = item.split(':')
        if (level === 'view' || level === 'edit' || level === 'none') {
          map[k] = level as PagePermissionLevel
        }
      } else {
        // Legacy entry without colon -> default to 'edit'
        map[item] = 'edit'
      }
    }
  } else if (typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v === 'view' || v === 'edit' || v === 'none') {
        map[k] = v as PagePermissionLevel
      }
    }
  }

  return map
}

/**
 * Serialize a map of pageKey -> PagePermissionLevel into a string array ['pageKey:view', ...]
 */
export function serializeAccessiblePages(map: Record<string, PagePermissionLevel>): string[] {
  const result: string[] = []
  for (const [pageKey, level] of Object.entries(map)) {
    if (level === 'view' || level === 'edit') {
      result.push(`${pageKey}:${level}`)
    }
  }
  return result
}

/**
 * Get the exact permission level ('none' | 'view' | 'edit') for a user on a given page
 */
export const getPagePermissionLevel = (
  user: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey: AppPagePermission
): PagePermissionLevel => {
  if (!user) return 'none'
  if (isUserAdmin(user)) return 'edit'

  const map = parseAccessiblePages(user.accessiblePages)
  if (map[pageKey]) {
    return map[pageKey]
  }

  // Fallback defaults if accessiblePages is not explicitly set on the user record
  if (user.accessiblePages === null || user.accessiblePages === undefined) {
    if (isUserManager(user)) {
      const defaultManagerPages: AppPagePermission[] = [
        'dashboard',
        'status-board',
        'impact-board',
        'create-assessment',
        'clients',
        'invoices',
        'fixed-costs',
        'operational-costs',
        'image-converter',
      ]
      return defaultManagerPages.includes(pageKey) ? 'edit' : 'none'
    }

    if (isInternalUser(user) || isExternalUser(user)) {
      const defaultUserPages: AppPagePermission[] = [
        'status-board',
        'impact-board',
        'create-assessment',
        'image-converter',
      ]
      return defaultUserPages.includes(pageKey) ? 'edit' : 'none'
    }
  }

  return 'none'
}

/**
 * Check if the user has access to a specific page (either view or edit)
 */
export const hasUserPageAccess = (
  user: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey?: AppPagePermission
): boolean => {
  if (!user) return false
  if (!pageKey) return true
  if (isUserAdmin(user)) return true
  return getPagePermissionLevel(user, pageKey) !== 'none'
}

/**
 * Check if the user has edit access to a specific page
 */
export const canUserEditPage = (
  user: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey?: AppPagePermission
): boolean => {
  if (!user) return false
  if (!pageKey) return true
  if (isUserAdmin(user)) return true
  return getPagePermissionLevel(user, pageKey) === 'edit'
}

/**
 * Compute the maximum permission level allowed for a subordinate based on their manager's access
 */
export const getManagerAllowedPermissionLevel = (
  manager: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey: AppPagePermission
): PagePermissionLevel => {
  if (!manager) return 'none'
  if (isUserAdmin(manager)) return 'edit'
  return getPagePermissionLevel(manager, pageKey)
}

