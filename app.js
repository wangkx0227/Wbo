App({
  globalData: { // 全局变量
    token: null,       // token
    userRole: null,     // 用户角色，比如 'kyle'
    userInfo: null,   // 当前登录用户信息
    // url: 'http://10.8.0.69:8000/wbo/api/', // 测试接口
    // montageUrl: 'http://10.8.0.69:8000', // 测试拼接路径（上传工厂稿与修改过的图稿，其他附件拼接使用）
    url: 'https://xcx.1bizmail.com:8153/wbo/api/', // 真实接口 8000
    montageUrl: 'https://xcx.1bizmail.com:8153', // 真实接口 8000
    imagesUrl: 'https://xcx.1bizmail.com:8154', //  图片路径 8080
    // fileUrl: 'http://10.8.0.68:5000/send_wechat_file', //  导出附件地址
    roleDict: { // 特定角色
      "kyle": "kyle",
      "shelley": "shelley",
      "FMR": "fmr",
      "AIE": "designer",
      "设计经理": "designer",
      "OMR": "chosen_draft",
      "desc_upload": "desc_upload", // 上传图片表格描述
      "管理员角色": "kyle", // 管理员角色
    }
  },
  onLaunch(options) {
    // 小程序初始化（只执行一次）
    wx.removeStorageSync('userRole') // 每次重置，清除登录信息
    wx.removeStorageSync('userName') // 每次重置，清除登录信息
    if (!wx.getStorageSync('firstLaunchTime')) {
      wx.setStorageSync('firstLaunchTime', Date.now())
    }
  },
})
