import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Activity, Board, Item, LogEntry, Mode, Phase } from '../types'

const PANE = 'studio-board'
const TOOL = 'progress'
const TOOL_ID = 'mcp__studio-board__progress'

const EMPTY: Board = {
  isActive: false,
  startedAt: 0,
  updatedAt: 0,
  skill: '',
  phase: 'read',
  items: [],
  handoffs: [],
  links: [],
  needsYou: [],
  verified: [],
  notVerified: [],
}
const IDLE: Activity = { tool: '', detail: '', at: 0, calls: 0, isIdle: true }
const OFF: Mode = { isOn: false, skill: '', since: 0, messages: 0 }

const BOARD = { plugin: 'studio-board', key: 'board' } as const
const MODE = { plugin: 'studio-board', key: 'mode' } as const
const board = atom(BOARD, EMPTY)
const mode = atom(MODE, OFF)
const activity = atom({ plugin: 'studio-board', key: 'activity' } as const, IDLE)
const log = atom({ plugin: 'studio-board', key: 'log' } as const, [] as LogEntry[])

const PHASES: { id: Phase; label: string }[] = [
  { id: 'read', label: 'Read' },
  { id: 'plan', label: 'Plan' },
  { id: 'route', label: 'Route' },
  { id: 'fix', label: 'Fix' },
  { id: 'verify', label: 'Verify' },
  { id: 'ship', label: 'Ship' },
  { id: 'report', label: 'Report' },
]

// Mid-tone colours that read on both light and dark app themes; text stays native.
const C = {
  accent: '#03A6CF',
  done: '#2EA043',
  warn: '#D29922',
  error: '#E5534B',
  handoff: '#8957E5',
  muted: '#8B8B8B',
}

const STATUS_LABEL: Record<Item['status'], string> = {
  todo: 'To do',
  doing: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
  handoff: 'Handed off',
  deferred: 'Deferred',
}

const GLYPH: Record<Item['status'], string> = {
  todo: '○',
  doing: '●',
  done: '✓',
  blocked: '✕',
  handoff: '↗',
  deferred: '⏸',
}

const TERMINAL_COLOR: Record<Item['status'], string> = {
  todo: 'inactive',
  doing: 'claude',
  done: 'success',
  blocked: 'error',
  handoff: 'suggestion',
  deferred: 'subtle',
}

const GUIDE = [
  '',
  '<studio-board>',
  `A side panel shows Sejal this run. Keep it current with the ${TOOL_ID} tool (it costs almost nothing):`,
  '- right after reading the room: project, chat, doctor, branch, tracker, phase "read"',
  '- once the checklist exists: every item with id, priority, tag, title, status "todo", phase "plan"',
  '- each time an item starts, finishes, gets blocked or handed off: send just that item by id with its new status, and where/cause/proof when known',
  '- each phase change (route, fix, verify, ship, report, waiting, done) with a short phaseNote',
  '- needsYou for anything waiting on her, links for previews or Figma nodes, verified / notVerified at the end',
  'Send only what changed; items merge by id. For a new request in the same chat, send reset: true first.',
  '</studio-board>',
].join('\n')

function sticky(skill: string) {
  return [
    '<studio-mode>',
    `Studio mode is on in this chat (started with /studio:${skill}). Sejal does not retype the command: treat this message as the next /studio:${skill} request.`,
    `Follow that skill's steps. If its instructions are no longer in your context, load studio:${skill} again with the Skill tool before acting.`,
    `Start a fresh studio board for a new request (${TOOL_ID} with reset: true), keep it current, verify with proof, and report in the studio format.`,
    'If the message is only a quick question or small talk, answer it directly and skip the workflow.',
    'She turns this off with /studio-off.',
    '</studio-mode>',
  ].join('\n')
}

const SCHEMA = {
  type: 'object',
  properties: {
    reset: { type: 'boolean', description: 'Start a fresh board (a new request in this chat).' },
    project: { type: 'string' },
    chat: { type: 'string', description: 'code, figma, automation, mixed or unknown' },
    doctor: { type: 'string', description: 'Doctor in charge now, e.g. code-doctor' },
    branch: { type: 'string' },
    tracker: { type: 'string', description: 'Path of the tracker file' },
    phase: { type: 'string', enum: ['read', 'plan', 'route', 'fix', 'verify', 'ship', 'report', 'waiting', 'done'] },
    phaseNote: { type: 'string', description: 'One short line on what is happening now' },
    budget: { type: 'string', description: 'Token budget note, e.g. "conserve: S/M items only"' },
    items: {
      type: 'array',
      description: 'Checklist items; merged by id, so send only changed ones.',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          priority: { type: 'string', description: 'P0, P1, ...' },
          tag: { type: 'string', description: 'code, figma, copy, taste, cat, automation' },
          status: { type: 'string', enum: ['todo', 'doing', 'done', 'blocked', 'handoff', 'deferred'] },
          where: { type: 'string', description: 'file:line, Figma node or script step' },
          cause: { type: 'string', description: 'Why it breaks, one line' },
          proof: { type: 'string', description: 'What proves it is fixed' },
        },
        required: ['id'],
      },
    },
    handoffs: {
      type: 'array',
      description: 'Replaces the hand-off list.',
      items: {
        type: 'object',
        properties: { to: { type: 'string' }, item: { type: 'string' }, status: { type: 'string' } },
        required: ['to', 'item'],
      },
    },
    links: {
      type: 'array',
      description: 'Replaces the links list (previews, Figma nodes, PRs).',
      items: {
        type: 'object',
        properties: { label: { type: 'string' }, url: { type: 'string' } },
        required: ['label', 'url'],
      },
    },
    needsYou: { type: 'array', items: { type: 'string' }, description: 'Replaces: what waits on Sejal.' },
    verified: { type: 'array', items: { type: 'string' }, description: 'Replaces: what was proven.' },
    notVerified: { type: 'array', items: { type: 'string' }, description: 'Replaces: what could not be proven, and why.' },
    note: { type: 'string', description: 'A line for the board log.' },
  },
}

type ProgressInput = Partial<Omit<Board, 'items' | 'isActive' | 'startedAt' | 'updatedAt' | 'skill'>> & {
  reset?: boolean
  items?: (Partial<Item> & { id: string })[]
  note?: string
}

const FIELDS = [
  'reset', 'project', 'chat', 'doctor', 'branch', 'tracker', 'phase', 'phaseNote', 'budget',
  'items', 'handoffs', 'links', 'needsYou', 'verified', 'notVerified', 'note',
] as const

// ---------- small helpers ----------

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function bar(done: number, total: number, width: number) {
  if (total === 0) return ''
  const filled = Math.round((done / total) * width)
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled))
}

function describe(tool: string, input: Record<string, unknown>) {
  const s = (v: unknown) => (typeof v === 'string' ? v : '')
  const base = (p: string) => p.split('/').pop() ?? p
  if (tool === 'Bash') return s(input.description) || s(input.command).slice(0, 80)
  if (tool === 'Read' || tool === 'Edit' || tool === 'Write') return base(s(input.file_path))
  if (tool === 'Skill') return s(input.skill)
  if (tool === 'Agent') return s(input.description)
  if (tool === 'Grep' || tool === 'Glob') return s(input.pattern)
  return ''
}

function shortTool(tool: string) {
  if (!tool.startsWith('mcp__')) return tool
  const parts = tool.split('__')
  return parts[parts.length - 1] ?? tool
}

// tool.call carries the tool's arguments beside tool and tool_use_id: keep only the board's.
function pick(e: Record<string, unknown>): ProgressInput {
  const out: Record<string, unknown> = {}
  for (const k of FIELDS) if (e[k] !== undefined) out[k] = e[k]
  return out as ProgressInput
}

// ---------- SVG pieces (graphics only; every word is native text) ----------

const PULSE = `<animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>`

function ringSvg(done: number, total: number) {
  const r = 18
  const len = 2 * Math.PI * r
  const frac = total === 0 ? 0 : done / total
  const color = total > 0 && done === total ? C.done : C.accent
  return `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="${r}" fill="none" stroke="${C.muted}" stroke-opacity="0.25" stroke-width="4"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(len * frac).toFixed(2)} ${len.toFixed(2)}" transform="rotate(-90 22 22)"/></svg>`
}

function stepperSvg(at: number, isDone: boolean, isWaiting: boolean, width: number) {
  const n = PHASES.length
  const pad = 16
  const gap = (width - pad * 2) / (n - 1)
  let labels = ''
  const x = (i: number) => pad + i * gap
  let lines = ''
  let nodes = ''
  for (let i = 0; i < n - 1; i++) {
    const isPast = isDone || i < at
    lines += `<line x1="${x(i)}" y1="10" x2="${x(i + 1)}" y2="10" stroke="${isPast ? C.done : C.muted}" stroke-opacity="${isPast ? 1 : 0.3}" stroke-width="2"/>`
  }
  for (let i = 0; i < n; i++) {
    const cx = x(i)
    const isCurrent = !isDone && i === at
    const tone = isCurrent ? (isWaiting ? C.warn : C.accent) : C.muted
    labels += `<text x="${cx}" y="31" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif" font-size="10" font-weight="${isCurrent ? 600 : 400}" fill="${tone}">${PHASES[i]?.label ?? ''}</text>`
    if (isDone || i < at) {
      nodes += `<circle cx="${cx}" cy="9" r="6" fill="${C.done}"/><path d="M${cx - 2.6} 9.2l1.8 1.8 3.4-3.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
    } else if (isCurrent) {
      nodes += `<circle cx="${cx}" cy="9" r="9" fill="${tone}" fill-opacity="0.18">${PULSE}</circle><circle cx="${cx}" cy="9" r="5.5" fill="${tone}"/>`
    } else {
      nodes += `<circle cx="${cx}" cy="9" r="5" fill="none" stroke="${C.muted}" stroke-opacity="0.55" stroke-width="1.5"/>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="36" viewBox="0 0 ${width} 36">${lines}${nodes}${labels}</svg>`
}

function statusSvg(status: Item['status']) {
  const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">${body}</svg>`
  switch (status) {
    case 'done':
      return wrap(`<circle cx="8" cy="8" r="7" fill="${C.done}"/><path d="M4.8 8.2l2.1 2.1 4.2-4.4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`)
    case 'doing':
      return wrap(`<circle cx="8" cy="8" r="6.2" fill="none" stroke="${C.accent}" stroke-width="1.6"/><circle cx="8" cy="8" r="3" fill="${C.accent}">${PULSE}</circle>`)
    case 'blocked':
      return wrap(`<circle cx="8" cy="8" r="7" fill="${C.error}"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`)
    case 'handoff':
      return wrap(`<circle cx="8" cy="8" r="7" fill="${C.handoff}"/><path d="M6 10l4-4M6.6 6h3.4v3.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`)
    case 'deferred':
      return wrap(`<circle cx="8" cy="8" r="6.2" fill="none" stroke="${C.muted}" stroke-width="1.5"/><path d="M6.6 5.6v4.8M9.4 5.6v4.8" stroke="${C.muted}" stroke-width="1.6" stroke-linecap="round"/>`)
    default:
      return wrap(`<circle cx="8" cy="8" r="6.2" fill="none" stroke="${C.muted}" stroke-opacity="0.7" stroke-width="1.5"/>`)
  }
}

function dotSvg(isLive: boolean) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="${isLive ? C.accent : C.muted}" fill-opacity="${isLive ? 1 : 0.5}">${isLive ? PULSE : ''}</circle></svg>`
}

// ---------- state changes ----------

// Keeps studio mode across an app restart. Best effort: the mode still works for
// this run if the store or the session id is unavailable.
async function remember($: EngineInterface, value: Mode) {
  try {
    const id = await $.session.id()
    if (value.isOn) await $.store.set(`mode:${id}`, value)
    else await $.store.delete(`mode:${id}`)
  } catch {
    // Not persisted; the in-session mode still applies.
  }
}

// A studio skill started: the router (or a doctor called on its own) starts a fresh
// board and turns studio mode on; a doctor called mid-run joins the running board.
async function begin($: EngineInterface, skill: string) {
  const now = await $.clock.now()
  const name = skill.replace(/^studio:/, '')
  const current = (await $.state.get(BOARD)).value ?? EMPTY
  const isStale = !current.isActive || now - current.updatedAt > 5 * 60 * 1000
  const isJustStarted = current.isActive && now - current.startedAt < 5000
  if ((name === 'studio' || isStale) && !isJustStarted) {
    await update($, board, () => ({
      ...EMPTY,
      isActive: true,
      startedAt: now,
      updatedAt: now,
      skill: name,
      doctor: name === 'studio' ? undefined : name,
    }))
    await update($, log, () => [{ at: now, text: `/studio:${name} started` }])
    await update($, activity, () => ({ ...IDLE, at: now, isIdle: false }))
  } else if (name !== 'studio') {
    await update($, board, b => ({ ...b, doctor: name, updatedAt: now }))
    await update($, log, l => [...l, { at: now, text: `${name} called in` }].slice(-40))
  }
  const m = (await $.state.get(MODE)).value ?? OFF
  if (!m.isOn || name === 'studio') {
    const next: Mode = { isOn: true, skill: m.isOn && name !== 'studio' ? m.skill : name, since: m.isOn ? m.since : now, messages: m.messages }
    await update($, mode, () => next)
    await remember($, next)
  }
  await $.ui.open({ id: PANE, title: 'Studio' })
}

// A follow-up message while studio mode is on: wake the board so it shows the new round.
async function followUp($: EngineInterface) {
  const now = await $.clock.now()
  await update($, mode, m => ({ ...m, messages: m.messages + 1 }))
  await update($, board, b => (b.startedAt ? { ...b, isActive: true, updatedAt: now } : b))
  await update($, activity, a => ({ ...a, isIdle: false, at: now }))
  await update($, log, l => [...l, { at: now, text: 'New message in studio mode' }].slice(-40))
  await $.ui.open({ id: PANE, title: 'Studio' })
}

async function setMode($: EngineInterface, isOn: boolean) {
  const now = await $.clock.now()
  const value: Mode = isOn ? { isOn: true, skill: 'studio', since: now, messages: 0 } : OFF
  await update($, mode, () => value)
  await remember($, value)
}

async function restore($: EngineInterface) {
  const saved = (await $.store.get(`mode:${await $.session.id()}`)) as Mode | undefined
  if (saved && saved.isOn) await update($, mode, () => saved)
}

async function apply($: EngineInterface, input: ProgressInput) {
  const now = await $.clock.now()
  await update($, board, b => {
    const base: Board = input.reset ? { ...EMPTY, isActive: true, startedAt: now, skill: b.skill || 'studio' } : b
    const items = [...base.items]
    for (const patch of input.items ?? []) {
      const at = items.findIndex(one => one.id === patch.id)
      if (at === -1) items.push({ title: patch.id, status: 'todo', ...patch } as Item)
      else items[at] = { ...items[at], ...patch } as Item
    }
    const { reset: _r, items: _i, note: _n, ...rest } = input
    return {
      ...base,
      ...rest,
      items,
      isActive: (input.phase ?? base.phase) !== 'done',
      startedAt: base.startedAt || now,
      updatedAt: now,
    }
  })
  const lines: string[] = []
  if (input.reset) lines.push('New request')
  if (input.phase) lines.push(`${input.phase}${input.phaseNote ? `: ${input.phaseNote}` : ''}`)
  for (const patch of input.items ?? []) if (patch.status) lines.push(`${patch.id} ${STATUS_LABEL[patch.status].toLowerCase()}`)
  if (input.note) lines.push(input.note)
  if (lines.length) {
    await update($, log, l => [...(input.reset ? [] : l), ...lines.map(text => ({ at: now, text }))].slice(-40))
  }
  await $.ui.open({ id: PANE, title: 'Studio' })
  return { result: 'Board updated.' }
}

async function clear($: EngineInterface) {
  await update($, board, () => EMPTY)
  await update($, log, () => [])
  await update($, activity, () => IDLE)
}

async function track($: EngineInterface, tool: string, input: Record<string, unknown>) {
  if (tool === 'Skill' && typeof input.skill === 'string' && input.skill.startsWith('studio:')) {
    await begin($, input.skill)
  }
  const b = (await $.state.get(BOARD)).value ?? EMPTY
  if (!b.isActive) return
  const now = await $.clock.now()
  await update($, activity, a => ({
    tool: shortTool(tool),
    detail: describe(tool, input),
    at: now,
    calls: a.calls + 1,
    isIdle: false,
  }))
}

async function idle($: EngineInterface) {
  const b = (await $.state.get(BOARD)).value ?? EMPTY
  if (!b.isActive) return
  const now = await $.clock.now()
  await update($, activity, a => ({ ...a, isIdle: true, at: now }))
}

// ---------- register ----------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'studio-board', description: 'Show the studio progress panel' })
    await $.command.register({ name: 'studio-board-reset', description: 'Clear the studio progress panel' })
    await $.command.register({ name: 'studio-off', description: 'Turn studio mode off in this chat' })
    await $.command.register({ name: 'studio-on', description: 'Turn studio mode on in this chat' })
    await $.tool.register({
      name: TOOL,
      description:
        'Update the studio board, the side panel that shows Sejal the current /studio run: phase, checklist, live work, hand-offs, proof and what waits on her. Send only what changed; items merge by id.',
      inputSchema: SCHEMA,
      isDeferred: false,
    })
    await restore($).catch(() => undefined)
    return next(e)
  })

  on('command.run', { command: 'studio-board' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Studio' })
    return { text: 'Studio board opened.' }
  })

  on('command.run', { command: 'studio-board-reset' }, async $ => {
    await clear($)
    return { text: 'Studio board cleared.' }
  })

  on('command.run', { command: 'studio-off' }, async $ => {
    await setMode($, false)
    return { text: 'Studio mode is off in this chat. Messages are handled normally until you run a studio skill again.' }
  })

  on('command.run', { command: 'studio-on' }, async $ => {
    await setMode($, true)
    await $.ui.open({ id: PANE, title: 'Studio' })
    return { text: 'Studio mode is on: every message in this chat runs through /studio:studio.' }
  })

  // skill.prompt is the main signal that a studio skill started. prompt.submit and
  // the Skill tool cover setups where skill.prompt hooks do not run.
  on('skill.prompt', async ($, e, next) => {
    const isStudio = e.pluginName === 'studio' || e.skill.startsWith('studio:')
    if (!isStudio) return next(e)
    await begin($, e.skill.startsWith('studio:') ? e.skill : `studio:${e.skill}`).catch(() => undefined)
    const ran = await next(e)
    return { ...ran, text: ran.text + '\n' + GUIDE }
  })

  on('prompt.submit', async ($, e, next) => {
    const invoked = /^\s*\/(studio:[a-z-]+)/.exec(e.text)
    if (invoked) {
      await begin($, invoked[1] ?? 'studio:studio').catch(() => undefined)
      return next(e)
    }
    if (e.command || e.isMeta) return next(e)
    const m = (await $.state.get(MODE).catch(() => ({ value: OFF }))).value ?? OFF
    if (!m.isOn) return next(e)
    await followUp($).catch(() => undefined)
    return next({ ...e, context: [...(e.context ?? []), sticky(m.skill || 'studio')] })
  })

  on('tool.call', { tool: TOOL_ID }, async ($, e) => {
    return apply($, pick(e as unknown as Record<string, unknown>)).catch(err => ({ result: `Board not updated: ${String(err)}` }))
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === TOOL_ID) return next(e)
    await track($, e.tool, e as unknown as Record<string, unknown>).catch(() => undefined)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    await idle($).catch(() => undefined)
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const b = await read($, board)
    const act = await read($, activity)
    const entries = await read($, log)
    const m = await read($, mode)
    const now = await $.clock.now()
    const cols = Math.max(24, e.props.bodyColumns ?? e.viewport?.columns ?? 48)

    const done = b.items.filter(i => i.status === 'done').length
    const open = b.items.filter(i => i.status === 'todo' || i.status === 'doing' || i.status === 'blocked').length
    const phaseAt = PHASES.findIndex(p => p.id === b.phase)
    const isDone = b.phase === 'done'
    const head = b.project || (b.startedAt ? 'Studio run' : 'Studio')
    const sub = [b.chat, b.doctor].filter(Boolean).join(' · ')
    const meta = [b.branch && `branch ${b.branch}`, b.tracker && `tracker ${b.tracker.split('/').pop()}`]
      .filter(Boolean)
      .join(' · ')
    const nowLine = act.isIdle
      ? `Idle for ${ago(now - act.at)}`
      : `${act.tool || 'Thinking'}${act.detail ? ` · ${act.detail}` : ''}`
    const stepLabel = isDone
      ? 'All steps done'
      : b.phase === 'waiting'
        ? 'Waiting for you'
        : `Step ${phaseAt + 1} of ${PHASES.length} · ${PHASES[phaseAt]?.label ?? ''}`
    const modeLine = m.isOn ? `Studio mode on · every message runs /studio:${m.skill || 'studio'}` : 'Studio mode off'

    if (e.surface === 'terminal') {
      const { Box, Text, Button } = $.ui.resolve(e)
      if (!b.startedAt) {
        return (
          <Box flexDirection="column" paddingX={1}>
            <Text bold>Studio</Text>
            <Text dimColor>No run yet. Type /studio:studio with your change list.</Text>
            <Text dimColor>{modeLine}</Text>
          </Box>
        )
      }
      return (
        <Box flexDirection="column" paddingX={1} gap={1}>
          <Box flexDirection="column">
            <Box justifyContent="space-between">
              <Text bold wrap="truncate-end">{[head, sub].filter(Boolean).join(' · ')}</Text>
              <Text dimColor>{ago(now - b.startedAt)}</Text>
            </Box>
            {meta !== '' && <Text dimColor wrap="truncate-end">{meta}</Text>}
            <Text dimColor>{modeLine}</Text>
          </Box>
          <Box flexDirection="column">
            <Box flexWrap="wrap" columnGap={1}>
              {PHASES.map((p, i) => (
                <Text key={p.id} bold={p.id === b.phase} color={p.id === b.phase ? 'claude' : isDone || i < phaseAt ? 'success' : 'inactive'}>
                  {`${isDone || i < phaseAt ? '✓' : p.id === b.phase ? '▸' : '·'} ${p.label}`}
                </Text>
              ))}
            </Box>
            {b.phaseNote && <Text dimColor>{b.phaseNote}</Text>}
          </Box>
          <Text color={act.isIdle ? 'inactive' : 'claude'} wrap="truncate-end">{`Now: ${nowLine}`}</Text>
          {b.items.length > 0 && (
            <Box flexDirection="column">
              <Text bold>{`Checklist ${done}/${b.items.length}`}</Text>
              <Text color="success">{bar(done, b.items.length, Math.min(30, cols - 4))}</Text>
              {b.items.map(item => (
                <Text key={item.id} color={TERMINAL_COLOR[item.status]}>
                  {`${GLYPH[item.status]} ${item.priority ? `${item.priority} ` : ''}${item.title}`}
                </Text>
              ))}
            </Box>
          )}
          {b.needsYou.length > 0 && (
            <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={1}>
              <Text bold color="warning">Needs you</Text>
              {b.needsYou.map((n, i) => <Text key={`n${i}`}>{`• ${n}`}</Text>)}
            </Box>
          )}
          <Box columnGap={1}>
            <Button label="Clear" onPress={() => void clear($)} />
            <Button label={m.isOn ? 'Studio mode off' : 'Studio mode on'} onPress={() => void setMode($, !m.isOn)} />
          </Box>
        </Box>
      )
    }

    // Desktop, mobile and editor surfaces: native type with small SVG graphics.
    const { Box, Text, Button, Link, Svg } = $.ui.resolve(e)
    const stepWidth = Math.max(160, Math.min(340, cols * 7))

    if (!b.startedAt) {
      return (
        <Box flexDirection="column" paddingX={2} paddingY={2} gap={1}>
          <Text size="heading" weight="semibold">Studio</Text>
          <Text size="footnote" dimColor>Nothing running yet. Type /studio:studio with your change list and the run shows up here.</Text>
          <Text size="caption" dimColor>{modeLine}</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" paddingX={2} paddingY={2} gap={2}>
        {/* Header: progress ring, project, chat and doctor, count and time */}
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="row" alignItems="center" columnGap={2}>
            <Svg source={ringSvg(done, b.items.length)} alt={`${done} of ${b.items.length} items done`} width={44} height={44} />
            <Box flexDirection="column" flexGrow={1} flexShrink={1}>
              <Text size="heading" weight="semibold" wrap="truncate-end">{head}</Text>
              {sub !== '' && <Text size="footnote" dimColor wrap="truncate-end">{sub}</Text>}
            </Box>
            <Box flexDirection="column" alignItems="flex-end">
              <Text size="heading" weight="semibold" tabular>{b.items.length ? `${done}/${b.items.length}` : '0'}</Text>
              <Text size="caption" dimColor tabular>{ago(now - b.startedAt)}</Text>
            </Box>
          </Box>
          {meta !== '' && <Text size="caption" dimColor mono wrap="truncate-end">{meta}</Text>}
          {b.budget && <Text size="caption" color="warning">{`Budget: ${b.budget}`}</Text>}
        </Box>

        {/* Where the run is */}
        <Box flexDirection="column" gap={1}>
          <Text size="footnote" weight="semibold" color={b.phase === 'waiting' ? 'warning' : isDone ? 'success' : undefined}>{stepLabel}</Text>
          <Svg source={stepperSvg(phaseAt < 0 ? PHASES.length : phaseAt, isDone, b.phase === 'waiting', stepWidth)} alt={stepLabel} width={stepWidth} height={36} />
          {b.phaseNote && <Text size="footnote" dimColor>{b.phaseNote}</Text>}
          <Box flexDirection="row" alignItems="center" columnGap={1}>
            <Svg source={dotSvg(!act.isIdle && !isDone)} alt={act.isIdle ? 'Idle' : 'Working'} width={10} height={10} />
            <Text size="caption" mono dimColor={act.isIdle} wrap="truncate-end">{nowLine}</Text>
          </Box>
          <Text size="caption" dimColor tabular>{`${act.calls} tool calls this run`}</Text>
        </Box>

        {/* What needs her, first, because it is the only thing that blocks */}
        {b.needsYou.length > 0 && (
          <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={2} paddingY={1} gap={1}>
            <Text size="footnote" weight="semibold" color="warning">Needs you</Text>
            {b.needsYou.map((n, i) => (
              <Text key={`n${i}`} size="footnote">{n}</Text>
            ))}
          </Box>
        )}

        {/* Checklist */}
        {b.items.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <Box flexDirection="row" justifyContent="space-between">
              <Text size="footnote" weight="semibold">Checklist</Text>
              <Text size="caption" dimColor tabular>{open === 0 ? 'All done' : `${open} open`}</Text>
            </Box>
            {b.items.map(item => (
              <Box key={item.id} flexDirection="row" columnGap={1} alignItems="flex-start">
                <Svg source={statusSvg(item.status)} alt={STATUS_LABEL[item.status]} width={16} height={16} />
                <Box flexDirection="column" flexGrow={1} flexShrink={1}>
                  <Text size="footnote" weight={item.status === 'doing' ? 'semibold' : 'regular'} dimColor={item.status === 'deferred'} strikethrough={item.status === 'deferred'}>
                    {item.title}
                  </Text>
                  <Text size="caption" dimColor>
                    {[item.priority, item.tag, STATUS_LABEL[item.status]].filter(Boolean).join(' · ')}
                  </Text>
                  {item.status !== 'done' && item.where && <Text size="caption" mono dimColor wrap="truncate-middle">{item.where}</Text>}
                  {(item.status === 'doing' || item.status === 'blocked') && item.cause && (
                    <Text size="caption" color={item.status === 'blocked' ? 'error' : undefined} dimColor={item.status !== 'blocked'}>{item.cause}</Text>
                  )}
                  {item.status === 'done' && item.proof && <Text size="caption" color="success">{item.proof}</Text>}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {b.handoffs.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <Text size="footnote" weight="semibold">Handed to other chats</Text>
            {b.handoffs.map((h, i) => (
              <Box key={`h${i}`} flexDirection="row" columnGap={1} alignItems="flex-start">
                <Svg source={statusSvg('handoff')} alt="Handed off" width={16} height={16} />
                <Text size="footnote">{`${h.to}: ${h.item}${h.status ? ` (${h.status})` : ''}`}</Text>
              </Box>
            ))}
          </Box>
        )}

        {(b.verified.length > 0 || b.notVerified.length > 0) && (
          <Box flexDirection="column" gap={1}>
            <Text size="footnote" weight="semibold">Proof</Text>
            {b.verified.map((v, i) => (
              <Box key={`v${i}`} flexDirection="row" columnGap={1} alignItems="flex-start">
                <Svg source={statusSvg('done')} alt="Verified" width={16} height={16} />
                <Text size="footnote">{v}</Text>
              </Box>
            ))}
            {b.notVerified.map((v, i) => (
              <Box key={`x${i}`} flexDirection="row" columnGap={1} alignItems="flex-start">
                <Svg source={statusSvg('deferred')} alt="Not verified" width={16} height={16} />
                <Text size="footnote" color="warning">{v}</Text>
              </Box>
            ))}
          </Box>
        )}

        {b.links.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <Text size="footnote" weight="semibold">Links</Text>
            {b.links.map((l, i) => (
              <Link key={`l${i}`} href={l.url} label={l.label} />
            ))}
          </Box>
        )}

        {entries.length > 0 && (
          <Box flexDirection="column">
            <Text size="caption" weight="semibold" dimColor>Activity</Text>
            {entries.slice(-5).map((l, i) => (
              <Box key={`g${i}`} flexDirection="row" columnGap={1}>
                <Text size="caption" dimColor tabular>{ago(now - l.at).padStart(6, ' ')}</Text>
                <Text size="caption" dimColor wrap="truncate-end">{l.text}</Text>
              </Box>
            ))}
          </Box>
        )}

        <Box flexDirection="column" gap={1}>
          <Text size="caption" dimColor>{modeLine}</Text>
          <Box flexDirection="row" columnGap={1}>
            <Button label={m.isOn ? 'Turn studio mode off' : 'Turn studio mode on'} variant="secondary" onPress={() => void setMode($, !m.isOn)} />
            <Button label="Clear board" variant="secondary" onPress={() => void clear($)} />
          </Box>
        </Box>
      </Box>
    )
  })
}
