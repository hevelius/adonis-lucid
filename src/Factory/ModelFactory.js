'use strict'

/**
 * adonis-lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const cf = require('co-functional')
const _ = require('lodash')
const Ioc = require('adonis-fold').Ioc
const fake = require('./fake')

class ModelFactory {

  constructor (binding, callback) {
    this.binding = Ioc.use(binding)
    this.callback = callback
    this.instances = []
  }

  /**
   * makes instance of a given model
   *
   * @param  {Object}      values
   * @return {Object}
   *
   * @private
   */
  _makeInstance (values) {
    const Model = this.binding
    return new Model(values)
  }

  /**
   * calls blueprint and passed fake instance
   * to it.
   *
   * @return {Object}
   *
   * @private
   */
  _callBlueprint () {
    return this.callback(fake)
  }

  /**
   * returns a model instace by calling the blueprint
   * and setting values on model instance
   *
   * @param  {Number} [count=1] - Number of instances to return
   * @return {Object}
   *
   * @public
   */
  make (count) {
    if (!count || count === 1) {
      return this._makeInstance(this._callBlueprint())
    }

    return _(count)
    .range()
    .map(() => {
      return this._makeInstance(this._callBlueprint())
    })
    .value()
  }

  /**
   * creates rows inside the database by calling create
   * method on the given model
   *
   * @method create
   *
   * @param  {Number} rows
   * @return {Object}      reference to this
   *
   * @public
   */
  * create (rows) {
    rows = rows || 1
    const self = this
    const range = _.range(rows)
    this.instances = yield cf.mapSerial(function * () {
      return yield self.binding.create(self._callBlueprint())
    }, range)
    return this
  }

  /**
   * loops through all the created instances and
   * executes a callback with support for
   * calling generators
   *
   * @method each
   *
   * @param  {Function} callback
   *
   * @public
   */
  each (callback) {
    return cf.forEach(function * (instance) {
      yield callback(instance)
    }, this.instances)
  }

  /**
   * will reset the given model by calling
   * truncate method on it.
   *
   * @return {Number}
   *
   * @public
   */
  reset () {
    return this.binding.query().truncate()
  }

}

module.exports = ModelFactory