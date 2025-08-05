App({
  globalData: { // 全局变量
    token: null,       // token
    userRole: null,     // 用户角色，比如 'kyle'
    userInfo: null,   // 当前登录用户信息
    url: 'https://xcx.1bizmail.com:8153/', // 后端接口路径
  },
  onLaunch(options) {
    // 小程序初始化（只执行一次）
    if (!wx.getStorageSync('firstLaunchTime')) {
      wx.setStorageSync('firstLaunchTime', Date.now())
    }
  },
})
