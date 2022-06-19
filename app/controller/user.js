'use strict'

const defaultAvatar =
  'http://monkee.online:7009/public/upload/default-avatar.jpg'

const Controller = require('egg').Controller
const dayjs = require('dayjs')

class UserController extends Controller {
  // 注册
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
    // 验证数据库内是否存在该账户名
    const user_info = await ctx.service.user.getUserByName(username)
    // 判断是否存在
    if (user_info && user_info.id) {
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
      signature: '这家伙很懒，什么都没留下。',
      avatar: defaultAvatar,
      create_datetime: dayjs().format('YYYY-MM-DD HH:mm:ss')
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
    const user_info = await ctx.service.user.getUserByName(username)
    console.log(user_info)
    // 用户不存在
    if (!user_info || !user_info.id) {
      ctx.body = {
        code: 500,
        msg: '账号不存在',
        data: null
      }
      return
    }
    // 用户存在，比对输入密码与数据库中用户密码。
    if (user_info && password !== user_info.password) {
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
        id: user_info.id,
        username: user_info.username,
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
  // 获取用户信息
  async get_user_info() {
    const { ctx, app } = this
    const token = ctx.request.header.authorization
    const decode = await app.jwt.verify(token, app.config.jwt.secret)
    const user_info = await ctx.service.user.getUserByName(decode.username)
    ctx.body = {
      code: 200,
      msg: '请求成功',
      data: {
        id: user_info.id,
        username: user_info.username,
        signature: user_info.signature || '',
        avatar: user_info.avatar || defaultAvatar
      }
    }
  }

  // 修改用户信息
  async edit_user_info() {
    const { ctx, app } = this
    const { signature = '', avatar = '' } = ctx.request.body

    try {
      let user_id
      const token = ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      user_id = decode.id

      const user_info = await ctx.service.user.getUserByName(decode.username)
      const result = await ctx.service.user.edit_user_info({
        ...user_info,
        signature,
        avatar
      })

      ctx.body = {
        code: 200,
        msg: '修改用户信息成功',
        data: {
          id: user_id,
          signature,
          username: user_info.username,
          avatar
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
  // 修改用户密码
  async modify_password() {
    const { ctx, app } = this
    const { old_pass = '', new_pass = '', new_pass2 = '' } = ctx.request.body

    try {
      let user_id
      const token = ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      if (decode.username === 'admin') {
        ctx.body = {
          code: 400,
          msg: '管理员账户，不允许修改密码！',
          data: null
        }
        return
      }
      user_id = decode.id
      const user_info = await ctx.service.user.getUserByName(decode.username)

      if (old_pass !== user_info.password) {
        ctx.body = {
          code: 400,
          msg: '原密码错误',
          data: null
        }
        return
      }

      if (new_pass !== new_pass2) {
        ctx.body = {
          code: 400,
          msg: '新密码不一致',
          data: null
        }
        return
      }

      if (old_pass === new_pass || old_pass === new_pass2) {
        ctx.body = {
          code: 400,
          msg: '新密码不能与旧密码相同',
          data: null
        }
        return
      }

      const result = await ctx.service.user.edit_user_info({
        ...user_info,
        password: new_pass
      })

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null
      }
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null
      }
    }
  }
}

module.exports = UserController
