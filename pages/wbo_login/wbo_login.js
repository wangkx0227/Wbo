const app = getApp();
Page({
  data: {
    isLoggingIn: false,
    buttonText: '微信一键登录',
    nickName: '',
    loginMode: 'examine', // 'wechat' or 'account'
    account: 'GS',
    password: 'aZ7gL3pN',
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
          value: 'ms',
          label: '客户选稿(r1/r2)',
        },
        {
          value: 'd',
          label: '设计师（工厂稿与样品图审查）',
        },
        {
          value: 'fma',
          label: 'FMR主管（指派图稿FMR）不需要',
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
  // 审核员登录-测试
  switchToExamine() {
    this.setData({
      loginMode: 'examine'
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

  onLogin(e) {
    const that = this;
    // if(that.data.nickName===""){
    // 	wx.showToast({ title: '请输入昵称', icon: 'error' });
    // 	return
    // }
    // const userInfo = {type:'fmr',name:that.data.nickName}
    // wx.setStorageSync('userInfo', userInfo);
    // setTimeout(() => {
    // 	wx.reLaunch({ url: `/pages/wbo-list/wbo-list` });
    //   }, 1500);
    wx.login({
      success(res) {
        //   console.log(res.code)
        // setTimeout(() => {
        // 	wx.reLaunch({ url: '/pages/wbo-list/wbo-list' });
        //   }, 1500);
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
                data.userinfo.type = "fmr"
                wx.setStorageSync('userInfo', data.userinfo);
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });

                setTimeout(() => {
                  wx.reLaunch({
                    url: '/pages/wbo-list/wbo-list'
                  });
                }, 1500);
              } else if (data.code === 400) {
                wx.showToast({
                  title: `${data.errinfo}`,
                  icon: 'error'
                });
              } else {
                console.log('err!', resp)
                wx.showToast({
                  title: "请输入正确的名字",
                  icon: 'error'
                });
              }
            },
            fail(err) {
              console.log('err!', err)
            }
          });
        } else {
          wx.showToast({
            title: '登录失败：没有 code',
            icon: 'none'
          });
        }
      }
    });
  },

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
              url: '/pages/wbo-list/wbo-list'
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

  // 审核员登录-测试使用
  onChange(e) {
    this.setData({
      'product.value': e.detail.value,
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
      console.log(productValue);
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