import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

function world(on: On) {
  mock.clock(on, { now: 1_000_000 })
  on('skill.prompt', async (_$, e) => ({ text: e.text }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
}

const PANE = {
  plugin: 'studio-board',
  component: 'Pane',
  requestId: 'studio-board',
  props: { title: 'Studio', isFocused: false, bodyColumns: 48 },
} as const

test('a studio skill starts the board and adds the guide', async ($, on) => {
  world(on)
  const ran = await $.skill.prompt({ skill: 'studio:studio', text: 'Studio body', pluginName: 'studio' })
  expect(ran.text).toContain('mcp__studio-board__progress')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /\/studio/ })).toBeDefined()
  await ui.unmount()
})

test('progress updates draw the phase, checklist and what needs her', async ($, on) => {
  world(on)
  await $.skill.prompt({ skill: 'studio:studio', text: 'Studio body', pluginName: 'studio' })
  await $.tool.call({
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
  })
  await $.tool.call({ tool: 'mcp__studio-board__progress', items: [{ id: 'a', status: 'done', proof: '1440 + 390 shots' }] })

  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text).join(' | ')
    expect(await ui.find({ type: 'Text', text: /portfolio · code · code-doctor/ }), `${surface}: /portfolio · code · code-doctor/ in ${texts}`).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /1\/2 done/ }), `${surface}: /1\/2 done/ in ${texts}`).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /proof: 1440 \+ 390 shots/ }), `${surface}: /proof: 1440 \+ 390 shots/ in ${texts}`).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Approve the preview/ }), `${surface}: /Approve the preview/ in ${texts}`).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Fixing the hero/ }), `${surface}: /Fixing the hero/ in ${texts}`).toBeDefined()
    await ui.unmount()
  }
})

test('the board is empty before any run', async ($, on) => {
  world(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /No run yet/ })).toBeDefined()
  await ui.unmount()
})
