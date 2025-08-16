const app = getApp();
Page({
  data: {
    isLoggingIn: false,
    buttonText: '微信一键登录',
    nickName: '',
    loginMode: 'wechat', // 'wechat' or 'account'
    account: 'GS', // 工厂登录
    password: 'aZ7gL3pN', // 密码
    userInfo: {
      fmr: {
        name: null,
        position: []
      },
      factory: {
        name: null,
        loginState: false
      }
    },
    product: {
      value: 'all',
      options: [{
        value: 'all',
        label: '无',
      },
      {
        value: 'kyle',
        label: 'kyle（初选与终选）',
      },
      {
        value: 'shelley',
        label: 'shelley（可执行评估）',
      },
      {
        value: 'fmr',
        label: 'fmr（可执行评估和上传样品图）',
      },
      {
        value: 'chosen_draft',
        label: '客户选稿(r1/r2)',
      },
      {
        value: 'designer',
        label: '设计师（AIT改稿和工厂稿与样品图审查）',
      },
      ],
    },
    redirect: "", // 跳转参数，如果携带，那么需要在登陆后跳转指定路径

  },
  onLoad(options) {
    const app = getApp()
    this.setData({
      app
    })
    wx.removeStorageSync('userInfo')
    const redirect = options.redirect;
    if (redirect) {
      // 赋值跳转url
      this.setData({
        redirect: redirect
      })
    }

  },
  switchToWechat() {
    this.setData({
      loginMode: 'wechat'
    });
  },
  switchToAccount() {
    this.setData({
      loginMode: 'account'
    });
  },
  inputNickName(e) {
    this.setData({
      nickName: e.detail.value
    })
  },
  onAccountInput(e) {
    this.setData({
      account: e.detail.value
    });
  },
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },
  // 员工登录
  onLogin(e) {
    const that = this;
    wx.login({
      success(res) {
        console.log('前端获取的code:', res.code); // 对比后端收到的code
        if (res.code) {
          wx.request({
            url: that.data.app.globalData.reqUrl + '/wbo/wx_login/',
            method: 'POST',
            data: {
              code: res.code,
              nickName: that.data.nickName
            },
            success(resp) {
              const data = resp.data;
              if (data.code === 200) {
                // 正式版
                that.data.userInfo.fmr = data.userinfo
                // 存储角色名称 ethan
                wx.setStorageSync('userRole', 'kyle'); // 角色设置 shelley kyle fmr  designer(设计师) chosen_draft（选稿）
                wx.setStorageSync('userName', data.userinfo.name); // 存储名字
                wx.setStorageSync('userInfo', that.data.userInfo); // 全部存储信息
                wx.showToast({ title: '登录成功', icon: 'success' }); // 提示
                const redirect = that.data.redirect;  // 跳转，如果有参数进行携带
                if (redirect) { // 需要再这里加上指定的人，shelley和kyle
                  const decodedPath = decodeURIComponent(redirect); // 解码后的路径
                  setTimeout(() => {
                    wx.reLaunch({
                      url: '/' + decodedPath // 注意要加斜杠开头
                    });
                    this.setData({
                      redirect: '' // 跳转参数赋值为空，防止登录操作出现问题
                    })
                  }, 500)
                } else {
                  setTimeout(() => {
                    wx.reLaunch({
                      url: `/pages/wbo_artwork_index/wbo_artwork_index`
                    });
                  })
                }
              } else if (data.statusCode === 400) {
                wx.showToast({ title: "登录错误", icon: 'error' });
              } else {
                console.log('err!', resp.data,"1111")
                wx.showToast({ title: "登录失败", icon: 'error' });
              }
            },
            fail(err) {
              wx.showToast({ title: "网络错误", icon: 'error' });
            }
          });
        } else {
          wx.showToast({ title: '登录失败：没有 code', icon: 'none' });
        }
      }
    });
  },
  // 工厂登录
  onAccountLogin(e) {
    const that = this
    wx.request({
      url: that.data.app.globalData.reqUrl + '/wbo/wpb-api/',
      method: 'POST',
      data: {
        "type": "getFactory",
        "username": that.data.account,
        "pwd": that.data.password
      },
      success(resp) {
        const data = resp.data;
        if (data.code === 200) {
          that.data.userInfo.factory.name = data.data
          that.data.userInfo.factory.loginState = true
          // 将userInfo写入缓存中
          wx.setStorageSync('userInfo', that.data.userInfo);
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/factory_login_page/wbo-list/wbo-list'
            });
          }, 1500);
        } else {
          console.log('err!', resp)
          wx.showToast({
            title: "账号密码错误",
            icon: 'error'
          });
        }
      },
      fail(err) {
        console.log('err!', err)
      }
    });
  },
  // 审核员登录-选中
  onChange(e) {
    this.setData({
      'product.value': e.detail.value,
    });
  },
  // 审核员登录-测试
  switchToExamine() {
    this.setData({
      loginMode: 'examine'
    });
  },
  onExamineLogin(e) {
    const productValue = this.data.product.value;
    if (productValue === "all") {
      wx.showToast({
        title: '选择后在进行登录',
        icon: 'error'
      });
    } else {
      wx.setStorageSync('userRole', productValue); // 异步存储消息
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      const redirect = this.data.redirect;

      if (redirect) {
        const decodedPath = decodeURIComponent(redirect); // 解码后的路径
        setTimeout(() => {
          wx.navigateTo({
            url: '/' + decodedPath // 注意要加斜杠开头
          });
          this.setData({
            redirect: '' // 跳转参数赋值为空，防止登录操作出现问题
          })
        }, 500)
      } else {
        setTimeout(() => {
          wx.reLaunch({
            url: `/pages/wbo_artwork_index/wbo_artwork_index`
          });
        }, 500)
      }
    }
  },
  // 用户点击右上角分享
  onShareAppMessage() {
    return {
      title: 'WBO',
      path: 'pages/wbo_login/wbo_login', // 分享后打开的页面路径
      imageUrl: '/assets/images/log.jpg' // 自定义分享封面
    };
  },
});