import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WorkItem, Assignee, Priority, WorkStatus, UserRole, UserAffiliation } from '@/types/work'

type WorkState = {
  workItems: WorkItem[]
  teamDirectory: Assignee[]
  searchQuery: string
  priorityFilter: Priority | 'all'
  statusFilter: WorkStatus | 'all'
  roleFilter: UserRole | 'all'
  affiliationFilter: UserAffiliation | 'all'
}

const STORAGE_KEY = 'work-assignment-state'

const loadFromStorage = (): Partial<WorkState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Corrupt or inaccessible localStorage
  }
  return {}
}

const initialStoredState = loadFromStorage()

const initialState: WorkState = {
  workItems: Array.isArray(initialStoredState.workItems) ? initialStoredState.workItems : [],
  teamDirectory: Array.isArray(initialStoredState.teamDirectory) ? initialStoredState.teamDirectory : [],
  searchQuery: '',
  priorityFilter: 'all',
  statusFilter: 'all',
  roleFilter: 'all',
  affiliationFilter: 'all',
}

const workSlice = createSlice({
  name: 'work',
  initialState,
  reducers: {
    setWorkItems: (state, action: PayloadAction<WorkItem[]>) => {
      state.workItems = action.payload
    },
    setTeamDirectory: (state, action: PayloadAction<Assignee[]>) => {
      state.teamDirectory = action.payload
    },
    addWorkItem: (state, action: PayloadAction<WorkItem>) => {
      state.workItems.push(action.payload)
    },
    updateWorkItem: (state, action: PayloadAction<{ id: string; updates: Partial<WorkItem> }>) => {
      const index = state.workItems.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.workItems[index] = { ...state.workItems[index], ...action.payload.updates }
      }
    },
    deleteWorkItem: (state, action: PayloadAction<string>) => {
      state.workItems = state.workItems.filter(item => item.id !== action.payload)
    },
    moveWorkItem: (state, action: PayloadAction<{ id: string; status?: WorkStatus; priority?: Priority }>) => {
      const index = state.workItems.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        if (action.payload.status) {
          state.workItems[index].status = action.payload.status
        }
        if (action.payload.priority) {
          state.workItems[index].priority = action.payload.priority
        }
      }
    },
    updateMilestoneProgress: (
      state,
      action: PayloadAction<{ id: string; completed: number; total?: number }>
    ) => {
      const index = state.workItems.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.workItems[index].milestone = {
          completed: action.payload.completed,
          total:
            action.payload.total !== undefined
              ? action.payload.total
              : state.workItems[index].milestone.total,
        }
      }
    },
    addTeamMember: (state, action: PayloadAction<Assignee>) => {
      state.teamDirectory.push(action.payload)
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setPriorityFilter: (state, action: PayloadAction<Priority | 'all'>) => {
      state.priorityFilter = action.payload
    },
    setStatusFilter: (state, action: PayloadAction<WorkStatus | 'all'>) => {
      state.statusFilter = action.payload
    },
    setRoleFilter: (state, action: PayloadAction<UserRole | 'all'>) => {
      state.roleFilter = action.payload
    },
    setAffiliationFilter: (state, action: PayloadAction<UserAffiliation | 'all'>) => {
      state.affiliationFilter = action.payload
    },
  },
})

export const {
  setWorkItems,
  setTeamDirectory,
  addWorkItem,
  updateWorkItem,
  deleteWorkItem,
  moveWorkItem,
  updateMilestoneProgress,
  addTeamMember,
  setSearchQuery,
  setPriorityFilter,
  setStatusFilter,
  setRoleFilter,
  setAffiliationFilter,
} = workSlice.actions

export default workSlice.reducer
