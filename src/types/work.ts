// Work Assignment Types

export type Priority = 'high' | 'medium' | 'low'

export type WorkStatus = 'new' | 'todo' | 'clarifications' | 'under_analysis' | 'approval'

export type UserRole = string

export type UserAffiliation = 'internal' | 'external'

export type Assignee = {
  id: string
  name: string
  avatar?: string
  role: UserRole
  affiliation: UserAffiliation
  email?: string
}

export type Milestone = {
  completed: number
  total: number
}

export type WorkAttachment = {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export type WorkItem = {
  id: string
  title: string
  description: string
  priority: Priority
  status: WorkStatus
  dueDate?: string
  assignees: Assignee[]
  milestone: Milestone
  attachmentsCount: number
  attachments?: WorkAttachment[]
  commentsCount: number
  createdAt: string
  updatedAt?: string
  publicId?: string
  createdByPublicId?: string
}
