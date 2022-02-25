'use strict'

const fs = require('fs')
const moment = require('moment')
const mkdirp = require('mkdirp')
const path = require('path')

const Controller = require('egg').Controller

class UploadController extends Controller {
  async upload_avatar() {
    const { ctx } = this
    // 获取文件数组的第一项
    let file = ctx.request.files[0]
    let uploadDir = ''
    try {
      let f = fs.readFileSync(file.filepath)
      // 获取当前日期，作为文件夹名
      let date = moment(new Date()).format('YYYYMMDD')
      // 创建图片保存的路径
      console.log(this.config.uploadDir)
      let dir = path.join(this.config.uploadDir, date)
      // 获取当前时间戳，作为文件名
      let timestamp = Date.now()
      // 创建目录
      await mkdirp(dir)
      // 图片的绝对路径
      uploadDir = path.join(dir, timestamp + path.extname(file.filename))
      // 写入文件夹
      fs.writeFileSync(uploadDir, f)
    } finally {
      // 清除临时文件
      ctx.cleanupRequestFiles()
    }
    ctx.body = {
      code: 200,
      msg: '上传头像成功',
      // 去除掉路径上的 app
      data: uploadDir.replace(/app/, '')
    }
  }
}

module.exports = UploadController
