App({
  globalData: { // 全局变量
    token: null,       // token
    userRole: null,     // 用户角色，比如 'kyle'
    userInfo: null,   // 当前登录用户信息
    url: 'http://10.8.0.69:8000/wbo/api/', // 后端接口路径
    reqUrl: 'https://xcx.1bizmail.com:8153', // 后端接口路径
    pictureUrl: 'http://10.8.0.69:8000/wbo/upload_task_image/', // 上传工厂稿
    fileUrl: 'http://10.8.10.110:5000/send_wechat_file', // 下载附件发送的地址
  },
  onLaunch(options) {
    wx.removeStorageSync('userRole') // 每次重置，清除登录信息
    // 小程序初始化（只执行一次）
    if (!wx.getStorageSync('firstLaunchTime')) {
      wx.setStorageSync('firstLaunchTime', Date.now())
    }
  },
})
