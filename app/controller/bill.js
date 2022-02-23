'use strict'

const moment = require('moment')

const Controller = require('egg').Controller

class BillController extends Controller {
  async add() {
    const { ctx, app } = this
    // 获取请求中携带的参数
    const {
      amount,
      category_id,
      category_name,
      date,
      type,
      remark = ''
    } = ctx.request.body

    // 判空处理，这里前端也可以做，但是后端也需要做一层判断。
    if (!amount || !category_id || !category_name || !date || !type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null
      }
    }

    try {
      let user_id
      const token = ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      user_id = decode.id
      const result = await ctx.service.bill.add({
        amount,
        category_id,
        category_name,
        date,
        type,
        remark,
        user_id
      })
      ctx.body = {
        code: 200,
        msg: '添加账单成功',
        data: null
      }
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '服务器内部错误',
        data: null
      }
    }
  }
}

module.exports = BillController
