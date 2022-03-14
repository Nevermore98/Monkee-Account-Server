'use strict'
// 变量名采用下划线分割命名，统一命名
const dayjs = require('dayjs')
const BaseController = require('./BaseController')

class BillController extends BaseController {
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
    if (!amount || !category_id || !category_name || !datetime || !type) {
      this.paramsError('部分请求参数为空')
      return
    }

    try {
      // 通过 token 解析，拿到 user_id
      const token = ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      const user_id = decode.id
      const result = await ctx.service.bill.add({
        amount,
        category_id,
        category_name,
        datetime,
        type,
        remark,
        user_id
      })
      this.success(null, '添加账单成功')
    } catch (error) {
      this.serviceError()
    }
  }
  // 获取账单列表
  async list() {
    const { ctx, app } = this
    const {
      // 对 month 取别名，month 就无法访问到了
      month: selected_month,
      page = 1,
      page_size = 5,
      category_id = 'all'
    } = ctx.query

    if (!selected_month) {
      this.paramsError('month 不能为空')
      return
    }

    try {
      const token = ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      const user_id = decode.id
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

      // 格式化数据
      let list_map = filtered_bill
        .reduce((curr, item) => {
          // 把第一个账单项的时间格式化为 YYYY-MM-DD
          const date = dayjs(item.datetime).format('YYYY-MM-DD')
          // const date = item.datetime.split(' ')[0]
          // 如果能在累加的数组中找到当前项日期 date ，那么在数组中的加入当前项到 daily_bill 数组。当天账单
          if (
            curr?.findIndex(
              (item) => dayjs(item.datetime).format('YYYY-MM-DD') === date
            ) > -1
          ) {
            // console.log(item.datetime.split(' ')[0])
            // console.log(item.datetime.split(' ')[0] === date)
            // const index2 = curr.findIndex(
            //   (item) => item.datetime.split(' ')[0] === date
            // )
            // console.log('index2', index2)
            const index = curr.findIndex(
              (item) => dayjs(item.datetime).format('YYYY-MM-DD') === date
            )
            curr[index].daily_bill.push(item)
          }
          // 如果在累加的数组中找不到当前项日期的，那么再新建一项。
          if (
            curr?.findIndex(
              (item) => dayjs(item.datetime).format('YYYY-MM-DD') === date
            ) === -1
          ) {
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
        }, []) // curr 默认初始值是一个空数组 []
        .sort((a, b) => dayjs(b.datetime).unix() - dayjs(a.datetime).unix()) // 时间倒序，最近的时间在第一项

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

      const data = {
        total_expense: total_expense,
        total_income: total_income,
        total_page: Math.ceil(list_map.length / page_size),
        total_bill: filter_list_map || [] // 格式化后，并且经过分页处理的数据
      }
      this.success(data, '获取账单列表成功')
    } catch (e) {
      this.serviceError()
    }
  }
  // 获取账单详情
  async detail() {
    const { ctx, app } = this
    const { id = '' } = ctx.query
    const token = ctx.request.header.authorization
    const decode = await app.jwt.verify(token, app.config.jwt.secret)
    if (!decode) return
    const user_id = decode.id
    // 判断是否传入账单 id
    if (!id) {
      this.paramsError('账单 id 不能为空')
      return
    }

    try {
      const detail = await ctx.service.bill.detail(id, user_id)
      this.success(data, '获取账单详情成功')
    } catch (error) {
      this.serviceError()
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
      this.paramsError('部分请求参数为空')
      return
    }

    try {
      const token = ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      const user_id = decode.id
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
      this.success(null, '修改账单详情成功')
    } catch (error) {
      this.serviceError()
    }
  }
  // 删除账单
  async delete() {
    const { ctx, app } = this
    const { id } = ctx.request.body
    if (!id) {
      this.paramsError('账单 id 不能为空')
      return
    }
    try {
      const token = await ctx.request.header.authorization
      const decode = await app.jwt.verify(token, app.config.jwt.secret)
      if (!decode) return
      const user_id = decode.id
      const result = await ctx.service.bill.delete(id, user_id)
      this.success(null, '删除账单成功')
    } catch (error) {
      this.paramsError()
    }
  }
  // 获取月度统计数据
  async monthly_statistics() {
    const { ctx, app } = this
    const { datetime = '' } = ctx.query
    const token = ctx.request.header.authorization
    const decode = await app.jwt.verify(token, app.config.jwt.secret)
    if (!decode) return
    const user_id = decode.id

    if (!datetime) {
      this.paramsError('datetime 不能为空')
      return
    }
    try {
      const result = await ctx.service.bill.list(user_id)
      // 所选月份的月初时间的秒时间戳
      const start = dayjs(datetime).startOf('month').unix()
      // 所选月份的月末时间的秒时间戳
      const end = dayjs(datetime).endOf('month').unix()
      const monthly_bill = result.filter((item) => {
        const timestamp = dayjs(item.datetime).unix()
        /**
         * 这里是闭区间，本月的 1 号 00:00:00，本月的月末 23:59:59。
         * 添加往日收支记录，时间就记为 23:59:59，避免记入下月账单 */
        if (timestamp >= start && timestamp <= end) {
          return item
        }
      })

      // 月度总支出
      const total_expense = monthly_bill.reduce((arr, cur) => {
        if (cur.type === 1) {
          arr += Number(cur.amount)
        }
        return arr
      }, 0)

      // 月度总收入
      const total_income = monthly_bill.reduce((arr, cur) => {
        if (cur.type === 2) {
          arr += Number(cur.amount)
        }
        return arr
      }, 0)

      /** 收支种类统计，用于饼图统计
       *  category_statistics 初始值为 []
       *  通过 findIndex，查找 arr 内，有无和 cur 相同种类的账单
       */
      let category_statistics = monthly_bill.reduce((arr, cur) => {
        const index = arr.findIndex(
          (item) => item.category_id === cur.category_id
        )
        if (index === -1) {
          arr.push({
            category_id: cur.category_id,
            category_name: cur.category_name,
            type: cur.type,
            total_category_amount: Number(cur.amount)
          })
        }
        if (index > -1) {
          arr[index].total_category_amount += Number(cur.amount)
        }
        return arr
      }, [])
      // 每项精度保留 2 位小数，并按 total_category_amount 降序
      category_statistics = category_statistics
        .map((item) => {
          item.total_category_amount = Number(
            Number(item.total_category_amount).toFixed(2)
          )
          return item
        })
        .sort((a, b) => b.total_category_amount - a.total_category_amount)

      const data = {
        total_expense: Number(total_expense).toFixed(2),
        total_income: Number(total_income).toFixed(2),
        category_statistics: category_statistics || []
      }
      this.success(data, '获取月度统计数据成功')
    } catch (error) {
      this.serviceError()
    }
  }
}

module.exports = BillController
