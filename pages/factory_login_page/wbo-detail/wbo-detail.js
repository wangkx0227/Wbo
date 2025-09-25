const app = getApp();
const url = app.globalData.url;
const utils = require('../../../utils/util')
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
    montageUrl: montageUrl, // 拼接路径
    dialogValue: "",
    dialogVisible: false,
    textValue: "",
    textareaVisible: false,
    refuse_type: null,
    refuse_id: null,
    refuse_state: null,
    currentOpenId: null, //当前打开多行文本框的item id
    table: [{ //所有单选按钮值
      colorMatch: false, // 颜色匹配（喷漆或印刷）检查结果
      surfaceQuality: false, // 表面处理质量检查结果
      graphicPosition: false, // 图案与图像位置检查结果
      contourConsistency: false, // 整体轮廓一致性检查结果
      sizeCheck: false, // 尺寸检查（目测或卷尺）结果
      symmetryBalance: false, // 对称性与平衡感检查结果
      textureRealism: false, // 表面纹理真实感检查结果
      buildDetails: false, // 结构与细节检查结果
      edgeFinish: false, // 边缘与角部处理检查结果
      decorativeElements: false, // 装饰性元素（如铆钉、饰条、镂嵌）检查结果
      weightStability: false // 重量与稳定性检查结果
    }]
  },
  // 初始化
  onLoad(options) {
    const that = this;
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    // if (!util.checkLogin()) return;
    // 正常流程
    // 从缓存中获取数据
    // const userInfo = wx.getStorageSync('userInfo')
    // userInfo.name = userInfo.fmr.name ? userInfo.fmr.name : userInfo.factory.name
    // this.setData({ userInfo,userRole:userRole })
    const userName = wx.getStorageSync('userName');
    const userRole = wx.getStorageSync('userRole');
    if (options.scene) {
      const scene = this.urlParams(options.scene)
      this.setData({
        project_id: scene.project_id
      })
    } else {
      this.setData({
        project_id: options.project_id
      })
    }
    this.setData({
      app,
      userName: userName,
      userRole: userRole
    })
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
                      wx.showToast({
                        title: '上传失败',
                        icon: 'error'
                      });
                    }
                  },
                  fail: err => {
                    wx.showToast({
                      title: '上传失败',
                      icon: 'none'
                    });
                  }
                });
              });
            } else {
              wx.showToast({
                title: '生成timeline失败',
                icon: 'error'
              });
            }
          },
          /**
           * 生成timeline失败回调函数
           * @param {Object} err - 错误对象，包含失败详情
           */
          fail(err) {
            wx.showToast({
              title: '生成timeline失败',
              icon: 'error'
            });
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
    const urls = imageList.map(item => this.data.app.globalData.montageUrl + item.image);
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
    const userName = that.data.userName;
    // if (!that.data.userInfo.name) {
    //   return
    // }
    if (!that.data.proofing) {
      wx.showModal({
        title: '开始打样',
        content: '确定开始打样吗',
        complete: (res) => {
          if (res.cancel) {}
          if (res.confirm) {
            wx.request({
              url: url,
              method: "POST",
              data: {
                "type": "updateProofingTask",
                "task_id": that.data.id,
                "username": userName,
                "proofing": 1
              },
              success(res) {
                if (res.data.code = 200) {
                  that.setData({
                    proofing: 1
                  })
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
    // if (!that.data.userInfo.name) {
    //   return
    // }
    const {
      index,
      type,
      id,
      state
    } = e.currentTarget.dataset;
    const userRole = that.data.userRole; // 可能需要修改-新增
    const userName = that.data.userName; // 可能需要修改-新增
    if (!userName) {
      return
    }
    if (userRole === "designer") { // 可能需要修改-新增
      wx.showToast({
        title: '只能FMR点击',
        icon: 'error'
      });
      return
    }
    wx.request({
      url: url,
      method: "POST",
      data: {
        "type": "updateProofingTimeline",
        "tl_id": id,
        "state": state,
        "state_updated_by": userName,
        "username": userName
      },
      success(res) {
        if (res.data.code === 200) {
          const tasks = that.sortByCreateTimeDesc(res.data.task_data[type])
          that.setData({
            [`${type}`]: tasks
          })
        }
      }
    })
  },
  // 拒绝带评论的原因 
  onDesignerStatusRefuse() {
    const that = this;
    const {
      refuse_type,
      refuse_id,
      refuse_state,
      dialogValue,
      userName
    } = that.data;
    const data = {
      "type": "updateProofingTimeline",
      "tl_id": refuse_id,
      "state2": refuse_state,
      "state2_updated_by": userName,
      "username": userName,
      "note": dialogValue,
    }
    wx.request({
      url: url,
      method: "POST",
      data: data,
      success(res) {
        if (res.data.code === 200) {
          const tasks = that.sortByCreateTimeDesc(res.data.task_data[refuse_type])
          that.setData({
            [`${refuse_type}`]: tasks
          })
        }
      }
    })
  },


  // 设计师拒绝弹窗-old
  onOpenDialog(e) {
    const {
      type,
      id,
      state
    } = e.currentTarget.dataset;
    this.setData({
      dialogVisible: true,
      refuse_type: type,
      refuse_id: id,
      refuse_state: state
    });
  },

  // 弹窗-评论-双向绑定
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 弹窗-评论-关闭（包含提交功能）
  onCloseDialog(e) {
    const that = this;
    const {
      dialogValue
    } = that.data; // 输入的评论的数据
    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      if (!dialogValue) {
        utils.showToast(that, "无提交建议", "warning");
        return;
      }
      that.onDesignerStatusRefuse();
    } else if (action === 'cancel') {
      utils.showToast(that, "评审提交取消", "warning");
    }
    this.setData({
      dialogVisible: false,
      refuse_type: null,
      refuse_id: null,
      refuse_state: null,
    });
    setTimeout(() => {
      this.setData({
        dialogValue: "",
      })
    }, 500)
  },
  // 设计师标记
  onDesignerStatusTap(e) {
    const that = this
    const {
      index,
      type,
      id,
      state
    } = e.currentTarget.dataset;
    // const username = that.data.userInfo.name;
    // if (!username) {
    //   return
    // }
    const userRole = that.data.userRole; // 可能需要修改-新增
    const userName = that.data.userName;
    if (!userName) {
      return
    }
    const data = {
      "type": "updateProofingTimeline",
      "tl_id": id,
      "state2": state,
      "state2_updated_by": userName,
      "username": userName,
      "note": "",
    }
    if (userRole === "fmr") { // 可能需要修改-新增
      wx.showToast({
        title: '只能设计师点击',
        icon: 'error'
      });
      return
    }
    wx.request({
      url: url,
      method: "POST",
      data: data,
      success(res) {
        if (res.data.code === 200) {
          const tasks = that.sortByCreateTimeDesc(res.data.task_data[type])
          that.setData({
            [`${type}`]: tasks
          })
        }
      }
    })
  },
  // new 
  //表格-单选按钮-动态变量名称 (需扩充改变提交)
  chooseRadio(e) {
    const {
      booleanParam,
      radioName
    } = e.currentTarget.dataset;
    let that = this;
    that.setData({
      [`table[0].${radioName}`]: booleanParam
    })
  },
  // 设计师拒绝弹窗-new
  onOpenTextArea(e) {
    const {
      type,
      id,
      state
    } = e.currentTarget.dataset;
    this.setData({
      textareaVisible: "true",
      refuse_type: type,
      refuse_id: id,
      refuse_state: state,
      state2: state,
    });
    this.onDesignerStatusRefuse();
    this.onOpenTextarea(id);
  },
  //拒绝说明 文字提交
  sumbitNote() {
    let that = this;
    const {
      refuse_type,
      refuse_id,
      refuse_state,
      textValue,
      userName
    } = that.data;
    const data = {
      "type": "updateProofingTimeline",
      "tl_id": refuse_id,
      "state2": refuse_state,
      "state2_updated_by": userName,
      "username": userName,
      "note": textValue,
    }
    wx.request({
      url: url,
      method: "POST",
      data: data,
      success(res) {
        if (res.data.code === 200) {
          const tasks = that.sortByCreateTimeDesc(res.data.task_data[refuse_type])
          that.setData({
            [`${refuse_type}`]: tasks
          })
        }
      }
    });
    setTimeout(() => {
      that.setData({
        textareaVisible: "false",
        textValue: "" //初始值
      });
    }, 500)
  },
  // 失焦时触发 拒绝说明 文字提交
  handleTextareaBlur(e) {
    const value = e.detail.value; // 获取文本框的值
    this.sumbitNote();// 调用提交方法
  },
  // 拒绝说明多行文本框-评论-双向绑定
  onTextareaInput(e) {
    this.setData({
      textValue: e.detail.value
    });
  },
  // 通过item id 单独 打开拒绝多行文本框
  onOpenTextarea(id) {
    this.setData({
      currentOpenId: id
    });
  },
  // 设计师标记 接受按钮
  onDesignerStatusTapNew(e) {
    const that = this
    const {
      index,
      type,
      id,
      state
    } = e.currentTarget.dataset;
    // const username = that.data.userInfo.name;
    // if (!username) {
    //   return
    // }
    const userRole = that.data.userRole; // 可能需要修改-新增
    const userName = that.data.userName;
    if (!userName) {
      return
    }
    const data = {
      "type": "updateProofingTimeline",
      "tl_id": id,
      "state2": state,
      "state2_updated_by": userName,
      "username": userName,
      "note": this.data.note || "",
    }
    if (userRole === "fmr") { // 可能需要修改-新增
      wx.showToast({
        title: '只能设计师点击',
        icon: 'error'
      });
      return
    }
    that.setData({
      textareaVisible: false,
      note: this.data.note
    })
    wx.request({
      url: url,
      method: "POST",
      data: data,
      success(res) {
        if (res.data.code === 200) {
          const tasks = that.sortByCreateTimeDesc(res.data.task_data[type])
          that.setData({
            [`${type}`]: tasks
          })
        }
      }
    })
  },
  // 新增结束
})