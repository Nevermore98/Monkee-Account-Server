'use strict'

const Service = require('egg').Service

class BillService extends Service {
  // 添加账单
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
  // 获取账单列表
  async list(id) {
    const { ctx, app } = this
    const QUERY_STR = 'id, type, amount, datetime, category_id, category_name, remark'
    let sql = `select ${QUERY_STR} from bill where user_id = ${id}`
    try {
      const result = await app.mysql.query(sql)
      return result
    } catch (error) {
      console.log(error)
      return null
    }
  }
}

module.exports = BillService
