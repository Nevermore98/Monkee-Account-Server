'use strict'

const Controller = require('egg').Controller

class HomeController extends Controller {
  async index() {
    const { ctx } = this
    // ctx.render 默认会去 view 文件夹寻找 index.html，这是 Egg 约定好的。
    await ctx.render('index.html', {
      title: 'never' // 将 title 传入 index.html
    })
  }
  async user() {
    const { ctx } = this
    const { id } = ctx.params // 通过 params 获取申明参数
    ctx.body = id
  }
  async add() {
    const { ctx } = this
    const { title } = ctx.request.body
    ctx.body = {
      title
    }
  }
  async user() {
    const { ctx } = this
    const result = await ctx.service.home.user()
    ctx.body = result
  }
}

module.exports = HomeController
