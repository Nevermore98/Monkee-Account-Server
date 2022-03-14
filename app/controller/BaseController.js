const Controller = require('egg').Controller
class BillController extends Controller {
  success(data = null, msg = '请求成功', code = 200) {
    this.ctx.body = {
      msg,
      code,
      data
    }
  }
  paramsError(msg = '参数错误', code = 400) {
    this.ctx.body = {
      msg,
      code
    }
  }
  serviceError(msg = '服务器内部错误', code = 500) {
    this.ctx.body = {
      msg,
      code
    }
  }
}
module.exports = BillController
