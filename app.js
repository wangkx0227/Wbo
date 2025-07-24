// app.js
App({
  // onLaunch() {
  //   // 展示本地存储能力
  //   console.log("小程序启动");
  //   const logs = wx.getStorageSync('logs') || []
  //   logs.unshift(Date.now())
  //   wx.setStorageSync('logs', logs)

  //   // 登录
  //   wx.login({
  //     success: res => {
  //       // 发送 res.code 到后台换取 openId, sessionKey, unionId
  //     }
  //   })
  // },
  globalData: {
    userInfo: null,   // 当前登录用户信息
    userRole: '',     // 用户角色，比如 'kyle' | 'shelley' | 'fmr' | 或者其他
    token: ''         // 其他全局信息
  }
})
