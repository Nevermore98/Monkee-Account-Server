'use strict'

const Service = require('egg').Service

class BillService extends Service {
  async add(params) {
    const { ctx, app } = this
    try {
      const result = await app.mysql.insert('bill', params)
      return result
    } catch (error) {
      console.log(error)
      return null
    }
  }
}

module.exports = BillService
