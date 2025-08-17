const app = getApp();
const url = app.globalData.url;
const montageUrl = app.globalData.montageUrl;
Page({
  data: {
    username: '管理员',
    task_id: 0,
    code: '暂无',
    images_0: [],
    images_1: [],
    reviewList: ['待审核', '接受', '拒绝'],
    status: ['pending', 'accepted', 'rejected'],
    blank_images: [],
    drawings_images: [],
    id: null,
    factory: '暂无',
    material: '暂无',
    fmr: '暂无',
    userRole: null,
    montageUrl: montageUrl // 拼接路径
  },
  // 初始化
  onLoad(options) {
    // if (!util.checkLogin()) return;
    // const userName = wx.getStorageSync('userName')
    // const userRole = wx.getStorageSync('userRole')
    const userName = '刘开波'
    const userRole = 'fmr'
    // 正常流程
    // 从缓存中获取数据
    // const userInfo = wx.getStorageSync('userInfo')
    // userInfo.name = userInfo.fmr.name ? userInfo.fmr.name : userInfo.factory.name
    // this.setData({ userInfo,userRole:userRole })

    if (options.scene) {
      const scene = this.urlParams(options.scene)
      this.setData({ project_id: scene.project_id })
    } else {
      this.setData({ project_id: options.project_id })
    }
    this.setData({ app, userName: userName, userRole: userRole })
    this.getTlData()
  },
  // 获取数据
  getTlData() {
    const that = this
    const userName = that.data.userName;
    wx.request({
      url: url,
      method: "POST",
      data: {
        "type": "getProofingTaskById",
        "task_id": that.data.project_id,
        "username": userName
      },
      success: (res) => {
        if (res.data.code === 200) {
          const data = res.data.data.tasks[0]
          if (data.blank_images) {
            data.blank_images = that.sortByCreateTimeDesc(data.blank_images)
          }
          if (data.drawings_images) {
            data.drawings_images = that.sortByCreateTimeDesc(data.drawings_images)
          }
          let fmr = '';
          let factory = '';
          let material = '';
          data.material.forEach(item => {
            material += `${item.name},`
          });
          data.factory.forEach(item => {
            factory += `${item.name},`
          });
          data.fmr.forEach(item => {
            fmr += `${item.name},`
          });
          data['fmr'] = fmr;
          data['factory'] = factory;
          data['material'] = material;
          that.setData(data)
        } else {
          console.log('加载数据请求失败!', res)
        }
      },
      fail(err) {
        console.log('加载数据请求失败!', err)
      }
    })
  },
  updateImageList(list, target, newImage) {
    const index = list.findIndex(item => item.id === target.id);
    const userName = this.data.userName;
    if (index !== -1) {
      // ✅ 已存在：添加到 images 数组
      list[index].images.push(newImage);
    } else {
      // ❌ 不存在：新建一项并加入 list
      const newItem = {
        id: target.id,
        images: [newImage],
        state: 0, // 你可以自定义默认 state
        state2: 0,
        note: '',
        create_time: target.create_time, // 你可替换为实际时间
        update_time: '',
        // created_by: this.data.userInfo.name
        created_by: userName
      };
      list = [newItem, ...list];
    }
    return list
  },
  // 胚体拍照与完成样拍照
  onChooseImage(e) {
    const that = this;
    // if (!that.data.userInfo.name) {
    //   return
    // }
    var type = e.currentTarget.dataset.type;
    const type_id = e.currentTarget.dataset.tp;
    const userName = that.data.userName;
    wx.chooseMedia({
      count: 9,
      success: (resp) => {
        wx.request({
          url: url,
          method: "POST",
          data: {
            "type": "createProofingTimeline",
            "task_id": that.data.id,
            "tl_type": type_id,
            "created_by": userName,
            "username": userName
          },
          success(res) {
            if (res.data.code === 200) {
              const tl_data = res.data.tl_data
              resp.tempFiles.forEach((file, idx) => {
                const path = file.tempFilePath;
                wx.uploadFile({
                  url: montageUrl + '/wbo/upload-project-proofing-timeline-image/',
                  filePath: path,
                  name: 'image',
                  method: 'POST',
                  formData: {
                    timeline: tl_data.id
                  },
                  success: uploadRes => {
                    const data = JSON.parse(uploadRes.data);

                    if (data.code === 200) {
                      const newImg = {
                        id: data.data.id,
                        image: data.data.image
                      };
                      const updatedImages = that.updateImageList(that.data[type], tl_data, newImg)
                      that.setData({
                        [`${type}`]: updatedImages
                      });
                    } else {
                      wx.showToast({ title: '上传失败', icon: 'error' });
                    }
                  },
                  fail: err => {
                    wx.showToast({ title: '上传失败', icon: 'none' });
                  }
                });
              });
            } else {
              wx.showToast({ title: '生成timeline失败', icon: 'error' });
            }
          },
          /**
           * 生成timeline失败回调函数
           * @param {Object} err - 错误对象，包含失败详情
           */
          fail(err) {
            wx.showToast({ title: '生成timeline失败', icon: 'error' });
          }
        })
      }
    });
  },
  // 图片放大预览
  onPreviewImage(e) {
    const type = e.currentTarget.dataset.type
    const index = e.currentTarget.dataset.index;
    const bar = parseInt(e.currentTarget.dataset.bar);
    const imageList = !isNaN(bar) ? this.data[type][bar].images : this.data[type];
    const urls = imageList.map(item => this.data.app.globalData.reqUrl + item.image);
    wx.previewImage({
      current: urls[index], // 当前显示图片的链接
      urls: urls // 图片数组
    });
  },
  // 将url中的参数转成对象{key:value}的形式
  urlParams(scene) {
    // scene 需要使用 decodeURIComponent 才能获取到生成二维码时传入的 scene
    const str = decodeURIComponent(scene).replace('?', '&')
    let strArr = str.split('&')
    strArr = strArr.filter(item => item)
    const result = {}
    strArr.filter(item => {
      const key = item.split('=')
      result[key[0]] = key[1]
    })
    return result
  },
  // 降序排序（最新时间排最前）
  sortByCreateTimeDesc(arr) {
    return [...arr].sort((a, b) =>
      new Date(b.create_time) - new Date(a.create_time)
    );
  },
  UpdateStatus() {
    const that = this
    const url = app.globalData.url;
    // if (!that.data.userInfo.name) {
    //   return
    // }
    if (!that.data.proofing) {
      wx.showModal({
        title: '开始打样',
        content: '确定开始打样吗',
        complete: (res) => {
          if (res.cancel) {
          }
          if (res.confirm) {
            wx.request({
              url: url,
              method: "POST",
              data: {
                "type": "updateProofingTask",
                "task_id": that.data.id,
                "username": "admin",
                "proofing": 1
              },
              success(res) {
                if (res.data.code = 200) {
                  that.setData({ proofing: 1 })
                }
              },
              fail(err) {
                console.log('err', err)
              }
            })
          }
        }
      })

    } else {
      wx.showToast({
        title: '打样已开始',
      })
    }

  },
  // fmr标记
  onStatusTap(e) {
    const that = this
    const { index, type, id, state } = e.currentTarget.dataset;
    const userRole = that.data.userRole; // 可能需要修改-新增
    const userName = that.data.userName; // 可能需要修改-新增
    // if (!that.data.userInfo.name) {
    //   return
    // }
    if (userRole === "designer") { // 可能需要修改-新增
      wx.showToast({ title: '只能FMR点击', icon: 'error' });
      return
    }
    wx.request({
      url: "http://10.8.0.69:8000/wbo/api/",
      method: "POST",
      data: {
        "type": "updateProofingTimeline",
        "tl_id": id,
        "state": state,
        // "state_updated_by": that.data.userInfo.name,
        "state_updated_by": userName,
        "username": userName
      },
      success(res) {
        if (res.data.code === 200) {
          const tasks = that.sortByCreateTimeDesc(res.data.task_data[type])
          that.setData({ [`${type}`]: tasks })
        }
      }
    })
  },
  // 设计师标记
  onDesignerStatusTap(e) {
    const that = this
    const { index, type, id, state } = e.currentTarget.dataset;
    // const username = that.data.userInfo.name;
    // if (!username) {
    //   return
    // }
    const userRole = that.data.userRole; // 可能需要修改-新增
    const userName = that.data.userName;
    if (userRole === "fmr") { // 可能需要修改-新增
      wx.showToast({ title: '只能设计师点击', icon: 'error' });
      return
    }
    wx.request({
      url: "http://10.8.0.69:8000/wbo/api/",
      method: "POST",
      data: {
        "type": "updateProofingTimeline",
        "tl_id": id,
        "state2": state,
        "state2_updated_by": userName,
        "username": userName
      },
      success(res) {
        if (res.data.code === 200) {
          const tasks = that.sortByCreateTimeDesc(res.data.task_data[type])
          that.setData({ [`${type}`]: tasks })
          const update_drawings_images = that.data.drawings_images.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                state2: Number(state),
                state2_updated_by: userName,
                state2_update_time: "暂未获取"
              }
            }
            return item;
          })
          that.setData({
            drawings_images: update_drawings_images
          })
        }
      }
    })
  },
})