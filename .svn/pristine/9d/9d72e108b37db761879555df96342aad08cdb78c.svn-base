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
      {
        value: 'desc_upload',
        label: '图稿描述信息',
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
    wx.removeStorageSync('userRole') // 每次重置，清除登录信息
    wx.removeStorageSync('userName') // 每次重置，清除登录信息
    wx.removeStorageSync('apiUserName') // 每次重置，清除登录信息
    wx.removeStorageSync('position_list') // 每次重置，清除登录信息
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
        if(!that.data.nickName){
          wx.showToast({ title: '请输入用户名', icon: 'error' });
          return;
        }
        if (res.code) {
          wx.request({
            url: that.data.app.globalData.montageUrl + '/wbo/wx_login/',
            method: 'POST',
            data: {
              code: res.code,
              nickName: that.data.nickName
            },
            success(resp) {
              const data = resp.data;
              if (data.code === 200) {
                // 正式版
                let role = '';  // 角色设置 shelley kyle fmr  designer(设计师) chosen_draft（选稿）
                that.data.userInfo.fmr = data.userinfo
                const roleDict = app.globalData.roleDict; // 角色信息 死
                const name = data.userinfo.name;
                const username = data.userinfo.username;
                const position_list = data.userinfo.position;
                // 只取角色的第一个
                if (position_list.length !== 0) {
                  for (let i = 0; position_list.length > i; i++) {
                    const position = position_list[i];
                    role = roleDict[position];
                    if (i === 0) {
                      break
                    };
                  }
                }
                // 在次确定
                if (!role) {
                  role = roleDict[name.toLowerCase()];
                }
                // 如果没有，就提示不进行登录
                if (!role) {
                  wx.showToast({ title: "没有角色信息", icon: 'error' });
                  return;
                }
                if(that.data.nickName !== name){
                  wx.showToast({ title: "登录信息不匹配", icon: 'error' });
                  return;
                }
                wx.setStorageSync('userRole', role); // 存储的角色
                wx.setStorageSync('userName', name); // 存储名字
                wx.setStorageSync('apiUserName', username); // 访问接口携带名字
                wx.setStorageSync('position_list', position_list); // 存储名字
                wx.setStorageSync('userInfo', that.data.userInfo); // 全部存储信息
                wx.showToast({ title: '登录成功', icon: 'success' }); // 提示
                const redirect = that.data.redirect;  // 跳转，如果有参数进行携带
                // if (redirect && (role === "shelley" || role === "kyle")) { // 需要再这里加上指定的人，shelley和kyle
                if (redirect) {
                  const decodedPath = decodeURIComponent(redirect); // 解码后的路径
                  setTimeout(() => {
                    wx.reLaunch({
                      url: '/' + decodedPath // 注意要加斜杠开头
                    });
                    that.setData({
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
                wx.showToast({ title: "登录失败", icon: 'error' });
              }
            },
            fail(err) {
              wx.showToast({ title: "网络错误", icon: 'error' });
            }
          });
        } else {
          wx.showToast({ title: '登录失败：没有 code', icon: 'error' });
        }
      }
    });
  },
  // 工厂登录
  onAccountLogin(e) {
    const that = this
    wx.request({
      url: that.data.app.globalData.montageUrl + '/wbo/wpb-api/',
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
      if (productValue === "kyle") {
        wx.setStorageSync('userName', "kyle"); // 第一轮初选与第五轮终选
        wx.setStorageSync('apiUserName', "kyle"); // 访问接口携带名字
        wx.setStorageSync('position_list', ["AIT"]); // 访问接口携带名字
      } else if (productValue === "shelley") {
        wx.setStorageSync('userName', "shelley"); // 第三轮可行性
        wx.setStorageSync('apiUserName', "shelley"); // 访问接口携带名字
        wx.setStorageSync('position_list', ["AIT"]); // 访问接口携带名字
      } else if (productValue === "fmr") {
        wx.setStorageSync('userName', "刘开波"); // 样品照片拍照上传 fmr 测试 （fmr系列测试）fmr可行性分析
        wx.setStorageSync('apiUserName', "lkb"); // 访问接口携带名字
        wx.setStorageSync('position_list', ["FMR"]); // 访问接口携带名字
      } else if (productValue === "designer") {
        wx.setStorageSync('userName', "黄思杰"); // 样品照片拍照审核  设计师 测试 上传ait稿与工厂稿和照片审核
        wx.setStorageSync('apiUserName', "hsj"); // 访问接口携带名字
        wx.setStorageSync('position_list', ["AIT"]); // 访问接口携带名字
      } else if (productValue === "chosen_draft") { // 第7轮与第9轮
        wx.setStorageSync('userName', "Vivi");
        wx.setStorageSync('apiUserName', "Vivi"); // 访问接口携带名字
        wx.setStorageSync('position_list', ["OMR"]); // 访问接口携带名字
      } else if (productValue === "desc_upload") {
        wx.setStorageSync('userName', "kyle");
        wx.setStorageSync('apiUserName', "kyle"); // 访问接口携带名字
      }
      wx.setStorageSync('userRole', productValue);
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