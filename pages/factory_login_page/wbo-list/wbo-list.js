const app = getApp();
const util = require('../../../utils/util.js');
// pages/wbo-list/wbo-list.js
Page({

  /**
   * 页面的初始数据
   */
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
    allItem: [] // 所有数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // if (!util.checkLogin()) return;
    // 正常流程
    const userInfo = wx.getStorageSync('userInfo')
    const userName = wx.getStorageSync('userName')
    const userRole = wx.getStorageSync('userRole')
    const app = getApp()
    this.setData({
      app, userName: userName, userRole: userRole
    })
    //   const fmr = userInfo.fmr.position.includes("FMR") ? userInfo.fmr.name : null
    //   const factory = userInfo.factory.name
    //   this.setData({
    //     fmr,
    //     factory,
    //     userInfo
    //   })
    this.get_wbpData()
  },

  get_wbpData() {
    const that = this
    const url = app.globalData.url;
    const image_url = app.globalData.image_url;
    const userName = that.data.userName;
    const userRole = that.data.userRole;
    let data = {
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
    data["username"] = userName;
    if (userRole === "fmr") {
      data["project_id"] = '204';
      data["filter_data"]["fmr"] = userName;
    } else if (userRole === "designer") {
      data["project_id"] = '204';
      data["filter_data"]["AIT_designer"] = userName;
    }
    wx.request({
      url: url,
      method: "POST",
      data: data,
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
            console.log(item.images_0);
            item.images_0.forEach(item => {
              image_path = item.image;
            })
            return {
              fmr: fmr,
              id: item.id,
              code: item.code,
              factory: factory,
              material: material,
              image_status: image_path ? true : false,
              imgSrc: "http://10.8.0.69:8000/" + image_path,
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
            hasMore: tasks.length === that.data.pageSize
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

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const url = e.currentTarget.dataset.url;
    const urls = this.data.selectedItem[index].imgSrc;
    wx.previewImage({
      current: url,
      urls: [urls]
    });
  },

  viewDetail(e) {
    const projectId = e.currentTarget.dataset.id;
    console.log(e.currentTarget.dataset);
    wx.navigateTo({
      url: `/pages/factory_login_page/wbo-detail/wbo-detail?project_id=${projectId}`
    });
  }
})