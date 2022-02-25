'use strict'
// 变量名采用下划线分割命名，统一命名
const dayjs = require('dayjs')
const Controller = require('egg').Controller

class BillController extends Controller {
  async add() {
    const { ctx, app } = this
    // 获取请求中携带的参数
    const {
      amount,
      category_id,
      category_name,
      datetime = dayjs().format('YYYY-MM-DD HH:mm:ss'),
      type,
      remark = ''
    } = ctx.request.body

    // 判空处理
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
        datetime,
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
  // 获取账单列表
  async list() {
    const { ctx, app } = this
    const {
      month: selected_month,
      page = 1,
      page_size = 5,
      category_id = 'all'
    } = ctx.query

    try {
      let user_id
      // 通过 token 解析，拿到 user_id
      const token = ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      user_id = decode.id
      // 获取当前用户的总账单列表
      const total_bill = await ctx.service.bill.list(user_id)
      // 过滤出月份和收支种类所对应的账单
      const filtered_bill = total_bill.filter((item) => {
        if (category_id !== 'all') {
          return (
            dayjs(item.datetime).format('YYYY-MM') === selected_month &&
            category_id === item.category_id
          )
        }
        return dayjs(item.datetime).format('YYYY-MM') === selected_month
      })
      console.log('filtered_bill', filtered_bill)
      // 格式化数据
      let list_map = filtered_bill
        .reduce((curr, item) => {
          // 把第一个账单项的时间格式化为 YYYY-MM-DD
          const date = dayjs(item.datetime).format('YYYY-MM-DD')
          // 如果能在累加的数组中找到当前项日期 date ，那么在数组中的加入当前项到 daily_bill 数组。当天账单
          if (curr?.findIndex((item) => item.datetime == date) > -1) {
            const index = curr.findIndex((item) => item.datetime === date)
            curr[index].daily_bill.push(item)
          }
          // 如果在累加的数组中找不到当前项日期的，那么再新建一项。
          if (curr?.findIndex((item) => item.datetime == date) === -1) {
            curr.push({
              date,
              daily_bill: [item]
            })
          }
          // 如果 curr 为空数组，则默认添加第一个账单项 item ，格式化为下列模式
          if (!curr.length) {
            curr.push({
              date,
              daily_bill: [item]
            })
          }
          return curr
        }, [])
        .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()) // 时间倒序，最近的时间在第一项

      // 分页处理，listMap 格式化后的全部数据，还未分页
      const filter_list_map = list_map.slice(
        (page - 1) * page_size,
        page * page_size
      )

      // 计算当月总收入和支出
      // 获取当月账单列表
      let monthly_bill = total_bill.filter(
        (item) => dayjs(item.datetime).format('YYYY-MM') === selected_month
      )
      // 累加计算支出
      let total_expense = monthly_bill.reduce((curr, item) => {
        if (item.type === 1) {
          curr += Number(item.amount)
          return curr
        }
        return curr
      }, 0)
      // 累加计算收入
      let total_income = monthly_bill.reduce((curr, item) => {
        if (item.type === 2) {
          curr += Number(item.amount)
          return curr
        }
        return curr
      }, 0)

      // 返回数据
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          total_expense: total_expense,
          total_income: total_income,
          total_page: Math.ceil(list_map.length / page_size),
          total_bill: filter_list_map || [] // 格式化后，并且经过分页处理的数据
        }
      }
    } catch {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null
      }
    }
  }
  // 获取账单详情
  async detail() {
    const { ctx, app } = this
    const { id = '' } = ctx.query
    // 获取用户 user_id
    let user_id
    const token = ctx.request.header.authorization
    const decode = await app.jwt.verify(token, app.config.jwt.secret)
    if (!decode) return
    user_id = decode.id
    // 判断是否传入账单 id
    if (!id) {
      ctx.body = {
        code: 500,
        msg: '订单id不能为空',
        data: null
      }
      return
    }

    try {
      const detail = await ctx.service.bill.detail(id, user_id)
      ctx.body = {
        code: 200,
        msg: '获取账单详情成功',
        data: detail
      }
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null
      }
    }
  }
  // 更新账单详情
  async update() {
    const { ctx, app } = this
    // 账单的相关参数，这里注意要把账单的 id 也传进来
    const {
      id,
      amount,
      category_id,
      category_name,
      datetime,
      type,
      remark = ''
    } = ctx.request.body
    // 判空处理
    if (!amount || !category_id || !category_name || !datetime || !type) {
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
      // 根据账单 id 和 user_id，修改账单数据
      const result = await ctx.service.bill.update({
        id, // 账单 id
        amount, // 金额
        category_id, // 消费种类 id
        category_name, // 消费种类名称
        datetime, // 日期
        type, // 收支类型
        remark, // 备注
        user_id // 用户 id
      })
      ctx.body = {
        code: 200,
        msg: '修改账单详情成功',
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
  // 删除账单
  async delete() {
    const { ctx, app } = this
    const { id } = ctx.request.body
    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null
      }
    }
    try {
      const token = await ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      let user_id = decode.id
      const result = await ctx.service.bill.delete(id, user_id)
      ctx.body = {
        code: 200,
        msg: '删除账单成功',
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

module.exports = BillController
