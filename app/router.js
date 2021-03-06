'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
  const { router, controller, middleware } = app
  const _jwt = middleware.jwtErr(app.config.jwt.secret) // 传入加密字符串
  // 注册
  router.post('/api/user/register', controller.user.register)
  // 登录
  router.post('/api/user/login', controller.user.login)
  // 获取用户信息
  router.get('/api/user/info', _jwt, controller.user.get_user_info)
  // 修改用户信息（目前仅能修改签名）
  router.put('/api/user/info', _jwt, controller.user.edit_user_info)
  // 修改用户密码
  router.put(
    '/api/user/password',
    _jwt,
    controller.user.modify_password
  )
  // 获取消费种类列表
  router.get('/api/category/list', _jwt, controller.category.list)
  // 上传头像
  router.post('/api/avatar', controller.upload.upload_avatar)
  // 添加账单
  router.post('/api/bill/add', _jwt, controller.bill.add)
  // 获取账单列表
  router.get('/api/bill/list', _jwt, controller.bill.list)
  // 获取账单详情
  router.get('/api/bill/detail', _jwt, controller.bill.detail)
  // 更新账单详情
  router.put('/api/bill/detail', _jwt, controller.bill.update)
  // 删除账单详情
  router.delete('/api/bill/detail', _jwt, controller.bill.delete)
  // 获取（月度）统计数据
  router.get('/api/bill/statistics', _jwt, controller.bill.monthly_statistics)
  // 测试
  router.get('/api/user/test', _jwt, controller.user.test) // 放入第二个参数，作为中间件过滤项
}
