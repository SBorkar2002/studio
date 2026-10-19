import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

function world(on: On) {
  mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  mock.session(on)
  on('skill.prompt', async (_$, e) => ({ text: e.text }))
  on('prompt.submit', async (_$, e) => ({ text: e.text, context: e.context }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
}

const PANE = {
  plugin: 'studio-board',
  component: 'Pane',
  requestId: 'studio-board',
  props: { title: 'Studio', isFocused: false, bodyColumns: 48 },
} as const

const RUN = {
  tool: 'mcp__studio-board__progress',
  project: 'portfolio',
  chat: 'code',
  doctor: 'code-doctor',
  phase: 'fix',
  phaseNote: 'Fixing the hero',
  items: [
    { id: 'a', priority: 'P0', tag: 'code', title: 'Hero subtext in dark mode', status: 'doing', where: 'app/page.tsx:42' },
    { id: 'b', priority: 'P1', tag: 'figma', title: 'Case study spacing', status: 'handoff' },
  ],
  needsYou: ['Approve the preview'],
} as const

test('a studio skill starts the board and adds the guide', async ($, on) => {
  world(on)
  const ran = await $.skill.prompt({ skill: 'studio:studio', text: 'Studio body', pluginName: 'studio' })
  expect(ran.text).toContain('mcp__studio-board__progress')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'Studio run' })).toBeDefined()
  await ui.unmount()
})

test('a doctor called on its own also starts the board', async ($, on) => {
  world(on)
  await $.skill.prompt({ skill: 'studio:figma-doctor', text: 'Figma body', pluginName: 'studio' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /figma-doctor/ })).toBeDefined()
  await ui.unmount()
})

test('desktop draws header, step, checklist and what needs her', async ($, on) => {
  world(on)
  await $.skill.prompt({ skill: 'studio:studio', text: 'Studio body', pluginName: 'studio' })
  await $.tool.call(RUN)
  await $.tool.call({ tool: 'mcp__studio-board__progress', items: [{ id: 'a', status: 'done', proof: '1440 + 390 shots' }] })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text).join(' | ')
  for (const want of ['portfolio', 'code · code-doctor', '1/2', 'Step 4 of 7 · Fix', 'Fixing the hero', 'Approve the preview', '1440 + 390 shots', 'Case study spacing']) {
    expect(texts, `missing "${want}" in ${texts}`).toContain(want)
  }
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})

test('terminal draws the same run with text glyphs', async ($, on) => {
  world(on)
  await $.skill.prompt({ skill: 'studio:studio', text: 'Studio body', pluginName: 'studio' })
  await $.tool.call(RUN)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text).join(' | ')
  expect(texts).toContain('Checklist 0/2')
  expect(texts).toContain('Approve the preview')
  await ui.unmount()
})

test('studio mode carries later messages until turned off', async ($, on) => {
  world(on)
  await $.skill.prompt({ skill: 'studio:studio', text: 'Studio body', pluginName: 'studio' })

  const second = await $.prompt.submit({ text: 'also fix the footer spacing', wait: false })
  expect((second.context ?? []).join('\n')).toContain('Studio mode is on')

  await $.command.run({ command: 'studio-off', args: '' })
  const third = await $.prompt.submit({ text: 'what time is it', wait: false })
  expect((third.context ?? []).join('\n')).not.toContain('Studio mode is on')
})

test('the board is empty before any run', async ($, on) => {
  world(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Nothing running yet/ })).toBeDefined()
  await ui.unmount()
})
