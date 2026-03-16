'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')
const promises = require('./index')

function testPromise(Promise, done) {
  if (!Promise) return done()
  const p = new Promise((resolve) => resolve(1))
  p.then((x) => {
    assert.strictEqual(x, 1)
    done()
  }).catch(done)
}

describe('getPromiseConstructor', () => {
  it('should return Promise constructor for "q"', (_, done) => {
    const Promise = promises.getPromiseConstructor('q')
    testPromise(Promise, done)
  })
})

describe('default', () => {
  it('should return default Promise implementation', (_, done) => {
    const Promise = promises.default
    testPromise(Promise, done)
  })
})

describe('list', () => {
  it('should list all registered implementations', (_, done) => {
    const list = promises.list
    assert(Array.isArray(list), 'list should be an array')
    assert(list.length > 0, 'list should not be empty')

    let pending = list.length
    list.forEach((impl, index) => {
      assert(impl.name, `impl[${index}] should have name`)
      assert(Array.isArray(impl.aliases), `impl[${index}].aliases should be array`)

      if (impl.Promise) {
        impl.Promise.resolve(1).then((x) => {
          assert.strictEqual(x, 1)
          if (--pending === 0) done()
        }).catch(done)
      } else {
        assert(impl.error, `impl[${index}] without Promise should have error`)
        if (--pending === 0) done()
      }
    })
    if (pending === 0) done()
  })
})

describe('has/get/register/unregister', () => {
  it('should correctly manage implementation lifecycle', () => {
    assert.strictEqual(promises.has('es6-promise-polyfill'), false)

    promises.register('es6-promise-polyfill')
    assert.strictEqual(promises.has('es6-promise-polyfill'), true)

    const impl = promises.get('es6-promise-polyfill')
    assert.strictEqual(impl.name, 'es6-promise-polyfill')
    assert.strictEqual(impl.version, require('es6-promise-polyfill/package.json').version)
    assert.deepStrictEqual(impl.aliases, [])
    assert.strictEqual(impl.Promise, null)
    assert(impl.error instanceof Error, 'impl should have error when Promise fails to load')

    assert.strictEqual(promises.unregister('es6-promise-polyfill'), true)
    assert.strictEqual(promises.has('es6-promise-polyfill'), false)

    assert.strictEqual(promises.unregister('es6-promise-polyfill'), false)
  })
})
