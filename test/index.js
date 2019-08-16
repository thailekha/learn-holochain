const path = require('path')
const tape = require('tape')

const { Diorama, tapeExecutor, backwardCompatibilityMiddleware } = require('@holochain/diorama')

process.on('unhandledRejection', error => {
  // Will print 'unhandledRejection err is not defined'
  console.error('got unhandledRejection:', error);
});

const dnaPath = path.join(__dirname, '../dist/holochain-rust-todo.dna.json')
const dna = Diorama.dna(dnaPath, 'happs')
const breaker = '\n-------->o<--------\n'

function logger(s) {
  console.log(breaker, s, breaker)
}

const diorama = new Diorama({
  instances: {
    alice: dna,
    bob: dna,
  },
  bridges: [],
  debugLog: false,
  executor: tapeExecutor(tape),
  middleware: backwardCompatibilityMiddleware,
})

diorama.registerScenario('Can create a list', async (scenario, t, { alice }) => {
  const createResult = await alice.call('lists', 'create_list', { list: { name: 'test list' } })
  logger(createResult)
  t.notEqual(createResult.Ok, undefined)
})

diorama.registerScenario('Can add some items', async (scenario, t, { alice }) => {
  const createResult = await alice.call('lists', 'create_list', { list: { name: 'test list' } })
  const listAddr = createResult.Ok

  const result1 = await alice.call('lists', 'add_item', { list_item: { text: 'Learn Rust', completed: true }, list_addr: listAddr })
  const result2 = await alice.call('lists', 'add_item', { list_item: { text: 'Master Holochain', completed: false }, list_addr: listAddr })

  logger(result1)
  logger(result2)

  t.notEqual(result1.Ok, undefined)
  t.notEqual(result2.Ok, undefined)
})

diorama.registerScenario('Can get a list with items', async (scenario, t, { alice }) => {
  const createResult = await alice.call('lists', 'create_list', { list: { name: 'test list' } })
  const listAddr = createResult.Ok

  await alice.call('lists', 'add_item', { list_item: { text: 'Learn Rust', completed: true }, list_addr: listAddr })
  await alice.call('lists', 'add_item', { list_item: { text: 'Master Holochain', completed: false }, list_addr: listAddr })

  const getResult = await alice.call('lists', 'get_list', { list_addr: listAddr })
  logger(getResult)

  t.equal(getResult.Ok.items.length, 2, 'there should be 2 items in the list')
})

diorama.run()