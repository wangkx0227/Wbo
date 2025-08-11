App({
  globalData: { // 全局变量
    token: null,       // token
    userRole: null,     // 用户角色，比如 'kyle'
    userInfo: null,   // 当前登录用户信息
    // url: 'https://xcx.1bizmail.com:8153/api/', // 后端接口路径
    url: 'http://10.8.0.69:8000/wbo/api/', // 后端接口路径
    // url: ' http://127.0.0.1:8000/wbo/api/', // 本机后端接口路径
    fileUrl:'http://10.8.10.110:5000/send_wechat_file', // 下载附件发送的地址
  },
  onLaunch(options) {
    wx.removeStorageSync('userRole') // 每次重置，清除登录信息
    // 小程序初始化（只执行一次）
    if (!wx.getStorageSync('firstLaunchTime')) {
      wx.setStorageSync('firstLaunchTime', Date.now())
    }
  },
})
