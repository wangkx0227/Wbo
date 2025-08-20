const app = getApp();
const url = app.globalData.url;
const utils = require('../../../utils/util')
Page({
  data: {
    userRole: null,
    userRole: null,
    factory_list: ['全部'],
    factory_index: 0,
    selectedItem: [],
    pageSize: 6, // 每页显示数量
    currentPage: 1, // 当前页码
    isLoading: false, // 是否正在加载
    hasMore: false, // 是否还有更多数据
    allItem: [], // 所有数据
    popupVisible: false, // 弹窗控制变量
    factoryOptions: [],
    factoryCheckAllValues: [],
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
      requestData["filter_data"]["fmr"] = userName;
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
            return {
              fmr: fmr,
              id: item.id,
              code: item.code,
              factory: factory || "请点击后选择工厂",
              material: material,
              image_status: image_path ? true : false,
              imgSrc: montageUrl + '/' + image_path,
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
            factory_list: that.data.factory_list,
            selectedItem: that.data.selectedItem,
            allItem: that.data.allItem,
            isLoading: false,
            hasMore: tasks.length === that.data.pageSize,
          })
          // 工厂
          const factoryOptions = factory_list.map(item => {
            return { "label": item, "value": item }
          });
          that.setData({
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
  // 多选操作
  onOpnePopup(e) {
    const that = this;
    const projectId = e.currentTarget.dataset.id;
    const factory = e.currentTarget.dataset.factory;
    let factoryCheckAllValues = [];
    if (factory) {
      factoryCheckAllValues = factory.split(",").filter(Boolean);
    }
    that.setData({
      projectId: projectId,
      factoryCheckAllValues: factoryCheckAllValues // 后设置数据
    }, () => {
      that.setData({
        popupVisible: true // 先显示弹窗
      });
    });
  },
  onClosePopup(e) {
    this.setData({
      popupVisible: false,
    });
  },
  onClosePopupChange(e) {
    this.setData({
      popupVisible: e.detail.visible,
    });
  },
  // 多选-选中
  onCheckAllChange(event) {
    this.setData({
      factoryCheckAllValues: event.detail.value,
    });
  },
  // 提交工厂
  onSubmitFactory(e) {
    const that = this;
    const userName = that.data.userName;
    const task_id = that.data.projectId;
    const selectedItem = that.data.selectedItem;
    const factoryCheckAllValues = that.data.factoryCheckAllValues;
    if (factoryCheckAllValues.length === 0) {
      wx.showToast({ title: '请选择在提交', icon: 'error' });
      return;
    }
    let data = {
      "task_id": task_id,
      "username": userName,
      "type": "updateProofingTask",
      "factory": factoryCheckAllValues,
    }
    wx.request({
      url: url,
      method: "POST",
      data: data,
      success(res) {
        if (res.data.code === 200) {
          const updataData = selectedItem.map(item => {
            if (item.id === task_id) {
              item["factory"] = factoryCheckAllValues.join(",");
            }
            return item;
          })
          that.setData({
            popupVisible: false,
            selectedItem: updataData,
          });
          wx.showToast({ title: '提交工厂成功' });
          setTimeout(() => {
            that.setData({
              factoryCheckAllValues: [],
            })
          }, 500)
        } else {
          wx.showToast({ title: '提交工厂失败', icon: 'error' });
        }
      }
    })
  }
})