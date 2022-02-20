'use strict'

const defaultAvatar =
  'http://s.yezgea02.com/1615973940679/WeChat77d6d2ac093e247c361f0b8a7aeb6c2a.png'

const Controller = require('egg').Controller
// TODO 可封装一层 controller

class UserController extends Controller {
  async register() {
    const { ctx } = this
    const { username, password } = ctx.request.body

    if (!username || !password) {
      ctx.body = {
        code: 500,
        msg: '账号密码不能为空',
        data: null
      }
      return
    }
    // 验证数据库内是否已经有该账户名
    const userInfo = await ctx.service.user.getUserByName(username)
    // 判断是否已经存在
    if (userInfo && userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账户名已被注册，请重新输入',
        data: null
      }
      console.log(ctx.request.body)
      return
    }
    // 调用 service，将数据写入数据库。
    const result = await ctx.service.user.register({
      username,
      password,
      signature: '世界和平。',
      avatar: defaultAvatar,
      create_time: new Date()
    })

    if (result) {
      ctx.body = {
        code: 200,
        msg: '注册成功',
        data: null
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '注册失败',
        data: null
      }
    }
  }
  // 登录
  async login() {
    const { ctx, app } = this
    const { username, password } = ctx.request.body
    const userInfo = await ctx.service.user.getUserByName(username)
    console.log(userInfo)
    // 用户不存在
    if (!userInfo || !userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账号不存在',
        data: null
      }
      return
    }
    // 用户存在，比对输入密码与数据库中用户密码。
    if (userInfo && password !== userInfo.password) {
      ctx.body = {
        code: 500,
        msg: '账号密码错误',
        data: null
      }
      return
    }
    // 生成 token
    // app.jwt.sign 方法接受两个参数，第一个为加密内容的对象，第二个是加密字符串（通过 app.config.jwt.secret 获取）
    const token = app.jwt.sign(
      {
        id: userInfo.id,
        username: userInfo.username,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // token 有效期为 24 小时
      },
      app.config.jwt.secret
    )
    ctx.body = {
      code: 200,
      message: '登录成功',
      data: {
        token
      }
    }
  }
  // 验证方法
  async test() {
    const { ctx, app } = this
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization // 请求头获取 authorization 属性，值为 token
    // 通过 app.jwt.verify + 加密字符串 解析出 token 的值
    const decode = await app.jwt.verify(token, app.config.jwt.secret)
    // 响应接口
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: {
        ...decode
      }
    }
  }
}

module.exports = UserController