// Work Assignment Types

export type Priority = 'high' | 'medium' | 'low'

export type WorkStatus = 'new' | 'todo' | 'clarifications' | 'under_analysis' | 'approval'

export type UserRole = 'Developer' | 'Marketing' | 'Design' | 'Product' | 'QA' | 'Operations'

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

export type WorkItem = {
  id: string
  title: string
  description: string
  priority: Priority
  status: WorkStatus
  dueDate: string
  assignees: Assignee[]
  milestone: Milestone
  attachmentsCount: number
  commentsCount: number
  createdAt: string
}
