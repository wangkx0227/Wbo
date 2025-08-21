const app = getApp();
const url = app.globalData.url;
const utils = require('../../../utils/util')
Page({
  data: {
    userRole: null,
    userRole: null,
    original_factory_list: [], // 原始工厂数据
    factory_list: ['全部'],
    factory_index: 0,
    selectedItem: [],
    pageSize: 6, // 每页显示数量
    currentPage: 1, // 当前页码
    isLoading: false, // 是否正在加载
    hasMore: false, // 是否还有更多数据
    allItem: [], // 所有数据
    popupVisible: false, // 弹窗控制变量
    options: [],
    fmrOptions: [],
    factoryOptions: [],
    checkAllValues: [],
    // 变更通知变量
    popupNotificationVisible: false,
    popupNotificationValue: "",
  },
  // 页面初始化
  onLoad(options) {
    const that = this;
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    // if (!util.checkLogin()) return;
    // 工厂登录需要-有问题
    // const userInfo = wx.getStorageSync('userInfo')
    // const fmr = userInfo.fmr.position.includes("FMR") ? userInfo.fmr.name : null
    // const factory = userInfo.factory.name
    // this.setData({
    //   fmr,
    //   factory,
    //   userInfo
    // })
    // 公司内部用户处理
    const userName = wx.getStorageSync('userName')
    const userRole = wx.getStorageSync('userRole')
    const development_id = options.development_id; // 开发案id
    this.setData({
      app,
      userName: userName,
      userRole: userRole,
      development_id: development_id,
    })
    this.get_wbpData()
  },
  // 数据获取
  get_wbpData() {
    const that = this
    const url = app.globalData.url;
    const userName = that.data.userName;
    const userRole = that.data.userRole;
    const montageUrl = app.globalData.montageUrl;
    const development_id = that.data.development_id;
    let requestData = {
      "type": "getProjectProofingTask",
      "project_id": 203,
      "current_page": 1,
      "per_page": 100,
      "filter_data": {
        "factory": "选择工厂",
        "fmr": "FMR选择",
        "material": "选择材质",
        "AIT_designer": "设计师选择",
        "proofing": -1,
        "blank": -1,
        "drawings": -1
      },
      "username": "Jasonyu"
    }
    // 如果是工厂登录
    requestData["username"] = userName;
    requestData["project_id"] = development_id;
    if (userRole === "fmr") {
      // requestData["filter_data"]["fmr"] = userName; // 只看当前用户
      requestData["filter_data"]["fmr"] = 'FMR选择';
    } else if (userRole === "designer") {
      requestData["filter_data"]["AIT_designer"] = userName;
    }
    wx.request({
      url: url,
      method: "POST",
      data: requestData,
      success: (res) => {
        if (res.data.code === 200) {
          const data = res.data.data
          const all_factory = data.factory_list.map(item => item.name)
          const factory_list = data.fmr_factories.length > 0 ? data.fmr_factories : all_factory
          that.data.factory_list = ['全部', ...factory_list]
          let tasks = data.tasks
          tasks = tasks.map(item => {
            let fmr = '';
            let factory = '';
            let material = '';
            let image_path = '';
            item.material.forEach(item => {
              material += `${item.name},`
            });
            item.factory.forEach(item => {
              factory += `${item.name},`
            });
            item.fmr.forEach(item => {
              fmr += `${item.name},`
            });
            item.images_0.forEach(item => {
              image_path = item.image;
            })
            const change_fmr = item.change_fmr_list[item.change_fmr_list.length - 1];
            return {
              fmr: fmr || "请选择FMR",
              id: item.id,
              code: item.code,
              factory: factory || "请点击后选择工厂",
              material: material,
              image_status: image_path ? true : false,
              imgSrc: montageUrl + '/' + image_path,
              change_fmr: change_fmr ? change_fmr : false,
            }
          })
          if (that.data.currentPage === 1) {
            that.data.selectedItem = tasks
            that.data.allItem = tasks
          } else {
            that.data.selectedItem = [...that.data.selectedItem, ...tasks]
            that.data.allItem = [...that.data.allItem, ...tasks]
          }
          that.setData({
            original_factory_list: data.factory_list, // 原始工厂数据
            factory_list: that.data.factory_list,
            selectedItem: that.data.selectedItem,
            allItem: that.data.allItem,
            isLoading: false,
            hasMore: tasks.length === that.data.pageSize,
          })
          // 工厂与fmr处理
          const factoryOptions = factory_list.map(item => {
            return { "label": item, "value": item }
          });
          const fmrOptions = data.fmr_list.map(item => {
            return { "label": item, "value": item }
          });
          that.setData({
            fmrOptions: fmrOptions,
            factoryOptions: factoryOptions
          })
        } else {
          console.log('加载数据请求失败!', res)
        }
      },
      fail(err) {
        console.log('加载数据请求失败!', err)
      }
    })
  },
  // 工厂查找
  filterFactory(e) {
    const factory_index = e.detail.value;
    const factory = this.data.factory_list[factory_index]
    if (factory !== '全部') {
      this.setData({
        currentPage: 1,
        factory
      })
      this.get_wbpData()
    } else {
      this.setData({
        currentPage: 1,
        factory: null
      })
      this.get_wbpData()
    }

    this.setData({
      factory_index
    })

  },
  // 懒加载方法
  loadMore() {
    if (this.data.isLoading) return;
    const nextPage = this.data.currentPage + 1;
    this.setData({
      isLoading: true,
      currentPage: nextPage
    });
    this.get_wbpData()
    this.setData({
      isLoading: false
    });
  },
  // 图片预览
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const url = e.currentTarget.dataset.url;
    const urls = this.data.selectedItem[index].imgSrc;
    wx.previewImage({
      current: url,
      urls: [urls]
    });
  },
  // 详情页跳转
  viewDetail(e) {
    const projectId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/factory_login_page/wbo-detail/wbo-detail?project_id=${projectId}`
    });
  },
  // 打开弹窗
  onOpnePopup(e) {
    const that = this;
    const projectId = e.currentTarget.dataset.id;
    const list = e.currentTarget.dataset.list;
    const type = e.currentTarget.dataset.type;
    let checkAllValues = [];
    if (list) {
      checkAllValues = list.split(",").filter(Boolean);
    }
    if (type === 'fmr') {
      that.setData({
        options: that.data.fmrOptions,
      })
    } else if (type === "factory") {
      that.setData({
        options: that.data.factoryOptions,
      })
    }
    that.setData({
      type: type,
      projectId: projectId,
      checkAllValues: checkAllValues // 后设置数据
    }, () => {
      that.setData({
        popupVisible: true // 先显示弹窗
      });
    });
  },
  // 关闭弹窗
  closePopup(e) {
    this.setData({
      type: null,
      projectId: null,
      popupVisible: false,
    });
  },
  // 关闭弹窗
  onClosePopupChange(e) {
    this.setData({
      type: null,
      projectId: null,
      popupVisible: e.detail.visible,
    });
  },
  // 多选工厂与fmr
  onCheckAllChange(event) {
    this.setData({
      checkAllValues: event.detail.value,
    });
  },
  // 提交工厂或者插入一条fmr变更记录
  onSubmit(e) {
    const that = this;
    const type = that.data.type;
    const userName = that.data.userName;
    const task_id = that.data.projectId;
    const selectedItem = that.data.selectedItem;
    const checkAllValues = that.data.checkAllValues;
    if (checkAllValues.length === 0) {
      wx.showToast({ title: '请选择在提交', icon: 'error' });
      return;
    }
    let data = {};
    let fmr_list = []; // fmr列表
    if (type === 'fmr') { // 只单纯插入一条fmr指派fmr记录 
      if (checkAllValues.length > 1) {
        wx.showToast({ title: '只能选择一个', icon: 'error' });
        return;
      } else if (checkAllValues[0] === userName) {
        wx.showToast({ title: '不能选择自己', icon: 'error' });
        return;
      }
      data = {
        "task_id": task_id,
        "username": userName,
        "type": "createProofingChangeFmr",
        "transfer_fmr": userName, // 原fmr
        "transfer_to_fmr": checkAllValues[0], // 新fmr
      }
    } else if (type === "factory") { // 直接进行修改工厂
      
      const original_factory_list = that.data.original_factory_list;
      original_factory_list.forEach(item => {
        // 如果当前项的name在checkAllValues中
        if (checkAllValues.includes(item.name)) {
          // 使用展开运算符将当前项的fmr数组合并到fmr_list中
          fmr_list = [...fmr_list, ...item.fmr];
        }
      });
      data = {
        "task_id": task_id,
        "username": userName,
        "type": "updateProofingTask",
        "factory": checkAllValues,
      }
      if (fmr_list.length !== 0) {
        data["fmr"] = fmr_list;
      }
    }
    // 提交请求
    wx.request({
      url: url,
      method: "POST",
      data: data,
      success(res) {
        if (res.data.code === 200) {
          if (type === "factory") {
            const updataData = selectedItem.map(item => {
              if (item.id === task_id) {
                item["factory"] = checkAllValues.join(",");
                if (fmr_list.length !== 0) {
                  item["fmr"] = fmr_list.join(",");
                }
              }
              return item;
            })
            that.setData({
              selectedItem: updataData,
            });
            wx.showToast({ title: '提交成功' });
          } else {
            wx.showToast({ title: '请等待对方同意' });
          }
          setTimeout(() => {
            that.setData({
              popupVisible: false,
              checkAllValues: [],
            })
          }, 500)
        } else {
          wx.showToast({ title: '提交失败', icon: 'error' });
        }
      }
    })
  },
  // 当被指派的fmr确定是，需要修改fmr，将记录状态修改 change_fmr_list字段存储变化
  onSubmitFMR(e) {
    const that = this;
    const userName = that.data.userName; // 当前用户
    const projectId = e.currentTarget.dataset.id; // 当前的task id
    // data = {
    //   "task_id": task_id,
    //   "username": userName,
    //   "type": "updateProofingTask",
    //   "fmr": checkAllValues,
    // }

  },
  // 打开弹窗
  onOpneNotificationPopup(e) {
    const that = this;
    const fmr = e.currentTarget.dataset.fmr;
    const projectId = e.currentTarget.dataset.id;
    const changeId = e.currentTarget.dataset.changeId;
    const content = e.currentTarget.dataset.content;
    that.setData({
      fmr: fmr,
      changeId: changeId,
      projectId: projectId,
      popupNotificationVisible: true, // 先显示弹窗
      popupNotificationValue: content, // 显示的内容
    });
  },
  // 关闭弹窗
  closeNotificationPopup() {
    this.setData({
      fmr: null,
      changeId: null,
      projectId: null,
      popupNotificationVisible: false,
    });
    setTimeout(() => {
      this.setData({
        popupNotificationValue: "",
      });
    }, 500)
  },
  // 提交
  onSubmitNotification() {
    // 提交转换记录，提交通知记录状态
    const that = this;
    const fmr = that.data.fmr;
    const projectId = that.data.projectId;
    const changeId = that.data.changeId;
    const userName = that.data.userName;
    const selectedItem = that.data.selectedItem;
    // 修改状态
    const changeData = {
      "type": "updateProofingChangeFmr",
      "change_id": changeId,
      "is_agree": 1,
      "username": userName
    }
    // 提交请求
    wx.request({
      url: url,
      method: "POST",
      data: changeData,
      success(res) {
        if (res.data.code === 200) {
          const fmrData = {
            "task_id": projectId,
            "username": userName,
            "type": "updateProofingTask",
            "fmr": [fmr,],
          }
          // 修改fmr
          wx.request({
            url: url,
            method: "POST",
            data: fmrData,
            success(res) {
              if (res.data.code === 200) {
                const updataData = selectedItem.map(item => {
                  if (item.id === projectId) {
                    item["fmr"] = [fmr].join(",");
                    item["change_fmr"].is_agree = 1;
                  }
                  return item;
                })
                that.setData({
                  selectedItem: updataData,
                });
                that.closeNotificationPopup();
              } else {
                wx.showToast({ title: '提交失败', icon: 'error' });
              }
            }
          })
        } else {
          wx.showToast({ title: '提交失败', icon: 'error' });
        }
      }
    })
  }
})