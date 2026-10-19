export type Phase = 'read' | 'plan' | 'route' | 'fix' | 'verify' | 'ship' | 'report' | 'waiting' | 'done'
export type ItemStatus = 'todo' | 'doing' | 'done' | 'blocked' | 'handoff' | 'deferred'

export type Item = {
  id: string
  title: string
  priority?: string
  tag?: string
  status: ItemStatus
  where?: string
  cause?: string
  proof?: string
}

export type Handoff = { to: string; item: string; status?: string }
export type BoardLink = { label: string; url: string }

export type Board = {
  isActive: boolean
  startedAt: number
  updatedAt: number
  skill: string
  doctor?: string
  project?: string
  chat?: string
  branch?: string
  tracker?: string
  phase: Phase
  phaseNote?: string
  budget?: string
  items: Item[]
  handoffs: Handoff[]
  links: BoardLink[]
  needsYou: string[]
  verified: string[]
  notVerified: string[]
}

export type Activity = { tool: string; detail: string; at: number; calls: number; isIdle: boolean }
export type LogEntry = { at: number; text: string }

declare module 'claude-code' {
  interface PluginState {
    'studio-board': { board: Board; activity: Activity; log: LogEntry[] }
  }
}
