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
  async addUser() {
    const { ctx } = this
    const { name } = ctx.request.body
    try {
      const result = await ctx.service.home.addUser(name)
      ctx.body = {
        coder: 200,
        msg: '添加成功',
        data: null
      }
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '添加失败',
        data: null
      }
    }
  }
  async editUser() {
    const { ctx } = this
    const { id, name } = ctx.request.body
    try {
      const result = await ctx.service.home.editUser(id, name)
      ctx.body = {
        code: 200,
        msg: '修改成功',
        data: null
      }
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '修改失败',
        data: null
      }
    }
  }
  async deleteUser() {
    const { ctx } = this
    const { id } = ctx.request.body
    try {
      const result = await ctx.service.home.deleteUser(id)
      ctx.body = {
        code: 200,
        msg: '删除成功',
        data: null
      }
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '删除失败',
        data: null
      }
    }
  }
}

module.exports = HomeController
