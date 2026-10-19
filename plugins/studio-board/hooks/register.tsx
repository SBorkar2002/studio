import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Activity, Board, Item, LogEntry, Phase } from '../types'

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

const BOARD = { plugin: 'studio-board', key: 'board' } as const
const board = atom(BOARD, EMPTY)
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

const GLYPH: Record<Item['status'], string> = {
  todo: '○',
  doing: '●',
  done: '✓',
  blocked: '✕',
  handoff: '↗',
  deferred: '⏸',
}

const COLOR: Record<Item['status'], string> = {
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
  'Send only what changed; items merge by id.',
  '</studio-board>',
].join('\n')

const SCHEMA = {
  type: 'object',
  properties: {
    reset: { type: 'boolean', description: 'Start a fresh board (new /studio run).' },
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

// A studio skill started: the router starts a fresh board, a doctor joins the
// running one (or starts its own when nothing runs).
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
    await update($, log, () => [{ at: now, text: `/${skill} started` }])
    await update($, activity, () => ({ ...IDLE, at: now, isIdle: false }))
  } else if (name !== 'studio') {
    await update($, board, b => ({ ...b, doctor: name, updatedAt: now }))
    await update($, log, l => [...l, { at: now, text: `${name} called in` }].slice(-40))
  }
  await $.ui.open({ id: PANE, title: 'Studio' })
}

const FIELDS = [
  'reset', 'project', 'chat', 'doctor', 'branch', 'tracker', 'phase', 'phaseNote', 'budget',
  'items', 'handoffs', 'links', 'needsYou', 'verified', 'notVerified', 'note',
] as const

// tool.call carries the tool's arguments beside tool and tool_use_id: keep only the board's.
function pick(e: Record<string, unknown>): ProgressInput {
  const out: Record<string, unknown> = {}
  for (const k of FIELDS) if (e[k] !== undefined) out[k] = e[k]
  return out as ProgressInput
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
  if (input.phase) lines.push(`phase: ${input.phase}${input.phaseNote ? ` · ${input.phaseNote}` : ''}`)
  for (const patch of input.items ?? []) if (patch.status) lines.push(`${patch.id} ${patch.status}`)
  if (input.note) lines.push(input.note)
  if (lines.length) await update($, log, l => [...l, ...lines.map(text => ({ at: now, text }))].slice(-40))
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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'studio-board', description: 'Show the studio progress panel' })
    await $.command.register({ name: 'studio-board-reset', description: 'Clear the studio progress panel' })
    await $.tool.register({
      name: TOOL,
      description:
        'Update the studio board, the side panel that shows Sejal the current /studio run: phase, checklist, live work, hand-offs, proof and what waits on her. Send only what changed; items merge by id.',
      inputSchema: SCHEMA,
      isDeferred: false,
    })
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
    const m = /^\s*\/(studio:[a-z-]+)/.exec(e.text)
    if (m) await begin($, m[1] ?? 'studio:studio').catch(() => undefined)
    return next(e)
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
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const b = await read($, board)
    const act = await read($, activity)
    const entries = await read($, log)
    const now = await $.clock.now()
    const cols = Math.max(24, e.props.bodyColumns ?? e.viewport?.columns ?? 48)

    if (!b.startedAt) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold>Studio</Text>
          <Text dimColor>No run yet. Type /studio:studio with your change list.</Text>
        </Box>
      )
    }

    const done = b.items.filter(i => i.status === 'done').length
    const phaseAt = PHASES.findIndex(p => p.id === b.phase)
    const isPast = (i: number) => b.phase === 'done' || (phaseAt >= 0 && i < phaseAt)
    const head = [b.project, b.chat, b.doctor].filter(Boolean).join(' · ')
    const where = [b.branch && `branch ${b.branch}`, b.tracker && `tracker ${b.tracker.split('/').pop()}`]
      .filter(Boolean)
      .join(' · ')

    return (
      <Box flexDirection="column" paddingX={1} gap={1}>
        <Box flexDirection="column">
          <Box justifyContent="space-between">
            <Text bold wrap="truncate-end">
              {head || `/${b.skill}`}
            </Text>
            <Text dimColor>{ago(now - b.startedAt)}</Text>
          </Box>
          {where !== '' && (
            <Text dimColor wrap="truncate-end">
              {where}
            </Text>
          )}
          {b.budget && <Text color="warning">{`budget: ${b.budget}`}</Text>}
        </Box>

        <Box flexDirection="column">
          <Box flexWrap="wrap" columnGap={1}>
            {PHASES.map((p, i) => (
              <Text
                key={p.id}
                bold={p.id === b.phase}
                color={p.id === b.phase ? 'claude' : isPast(i) ? 'success' : 'inactive'}
              >
                {`${isPast(i) ? '✓' : p.id === b.phase ? '▸' : '·'} ${p.label}`}
              </Text>
            ))}
          </Box>
          {b.phase === 'waiting' && <Text color="warning">Waiting for you</Text>}
          {b.phase === 'done' && <Text color="success">Run complete</Text>}
          {b.phaseNote && <Text dimColor>{b.phaseNote}</Text>}
        </Box>

        <Box flexDirection="column">
          <Text color={act.isIdle ? 'inactive' : 'claude'} wrap="truncate-end">
            {act.isIdle
              ? `Idle · ${ago(now - act.at)} ago`
              : `Now: ${act.tool || 'thinking'}${act.detail ? ` · ${act.detail}` : ''}`}
          </Text>
          <Text dimColor>{`${act.calls} tool calls this run`}</Text>
        </Box>

        {b.items.length > 0 && (
          <Box flexDirection="column">
            <Box justifyContent="space-between">
              <Text bold>Checklist</Text>
              <Text dimColor>{`${done}/${b.items.length} done`}</Text>
            </Box>
            <Text color="success">{bar(done, b.items.length, Math.min(30, cols - 4))}</Text>
            {b.items.map(item => (
              <Box key={item.id} flexDirection="column">
                <Text color={COLOR[item.status]} bold={item.status === 'doing'} strikethrough={item.status === 'deferred'}>
                  {`${GLYPH[item.status]} ${item.priority ? `${item.priority} ` : ''}${item.tag ? `[${item.tag}] ` : ''}${item.title}`}
                </Text>
                {item.status === 'doing' && item.where && <Text dimColor>{`   where: ${item.where}`}</Text>}
                {(item.status === 'doing' || item.status === 'blocked') && item.cause && (
                  <Text dimColor>{`   why: ${item.cause}`}</Text>
                )}
                {item.status === 'done' && item.proof && <Text dimColor>{`   proof: ${item.proof}`}</Text>}
              </Box>
            ))}
          </Box>
        )}

        {b.needsYou.length > 0 && (
          <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={1}>
            <Text bold color="warning">
              Needs you
            </Text>
            {b.needsYou.map((n, i) => (
              <Text key={`n${i}`}>{`• ${n}`}</Text>
            ))}
          </Box>
        )}

        {b.handoffs.length > 0 && (
          <Box flexDirection="column">
            <Text bold>Hand-offs</Text>
            {b.handoffs.map((h, i) => (
              <Text key={`h${i}`} color="suggestion">
                {`↗ ${h.to}: ${h.item}${h.status ? ` (${h.status})` : ''}`}
              </Text>
            ))}
          </Box>
        )}

        {b.links.length > 0 && (
          <Box flexDirection="column">
            <Text bold>Links</Text>
            {b.links.map((l, i) => (
              <Link key={`l${i}`} href={l.url} label={l.label} />
            ))}
          </Box>
        )}

        {(b.verified.length > 0 || b.notVerified.length > 0) && (
          <Box flexDirection="column">
            <Text bold>Proof</Text>
            {b.verified.map((v, i) => (
              <Text key={`v${i}`} color="success">
                {`✓ ${v}`}
              </Text>
            ))}
            {b.notVerified.map((v, i) => (
              <Text key={`x${i}`} color="warning">
                {`? ${v}`}
              </Text>
            ))}
          </Box>
        )}

        {entries.length > 0 && (
          <Box flexDirection="column">
            <Text bold>Log</Text>
            {entries.slice(-8).map((l, i) => (
              <Text key={`g${i}`} dimColor wrap="truncate-end">
                {`${ago(now - l.at)} ago · ${l.text}`}
              </Text>
            ))}
          </Box>
        )}

        <Box>
          <Button label="Clear board" onPress={() => void clear($)} />
        </Box>
      </Box>
    )
  })
}
