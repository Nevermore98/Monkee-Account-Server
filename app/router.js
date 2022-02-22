'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
  const { router, controller, middleware } = app
  const _jwt = middleware.jwtErr(app.config.jwt.secret) // 传入加密字符串
  router.post('/api/user/register', controller.user.register)
  router.post('/api/user/login', controller.user.login)
  router.get('/api/user/userInfo', _jwt, controller.user.getUserInfo) // 获取用户信息
  router.patch('/api/user/userInfo', _jwt, controller.user.editUserInfo) // 修改用户个性签名
  router.post('/api/uploadAvatar', controller.upload.uploadAvatar)
  router.get('/api/user/test', _jwt, controller.user.test) // 放入第二个参数，作为中间件过滤项
}
