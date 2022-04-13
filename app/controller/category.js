'use strict'

const BaseController = require('./BaseController')

class CategoryController extends BaseController {
  async list() {
    const { ctx, app } = this
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization
    const decode = await app.jwt.verify(token, app.config.jwt.secret)
    if (!decode) return
    let user_id = decode.id
    const data = await ctx.service.category.list(user_id)
    this.success(data, '获取收支种类列表成功')
  }
}

module.exports = CategoryController
