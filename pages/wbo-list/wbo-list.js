const util = require('../../utils/util.js');
// pages/wbo-list/wbo-list.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
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
    if (!util.checkLogin()) return;

    // 正常流程
    const userInfo = wx.getStorageSync('userInfo')
    const app = getApp()
    this.setData({
      app
    })

    const fmr = userInfo.fmr.position.includes("FMR") ? userInfo.fmr.name : null

    const factory = userInfo.factory.name
    this.setData({
      fmr,
      factory,
      userInfo
    })
    // console.log('fmr',this.data.fmr, userInfo.fmr.position)
    this.get_wbpData()
  },

  get_wbpData() {
    const that = this
    wx.request({
      url: that.data.app.globalData.reqUrl + '/wbo/wpb-api/',
      method: "POST",
      data: {
        "type": "get_wpb_data",
        "page": that.data.currentPage,
        "per_page": that.data.pageSize,
        "fmr": that.data.fmr,
        "factory": that.data.factory,
        "username": "admin"
      },
      success: (res) => {
        if (res.data.code === 200) {
          const data = res.data.data
          const all_factory = data.factory_list.map(item => item.name)
          const factory_list = data.fmr_factories.length > 0 ? data.fmr_factories : all_factory
          that.data.factory_list = ['全部', ...factory_list]
          var tasks = data.tasks
          tasks = tasks.map(item => {
            return {
              code: item.code,
              imgSrc: that.data.app.globalData.reqUrl + item.images_0[0].image,
              material: item.material,
              factory: item.factory,
              fmr: item.fmr
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
          console.log('加载数据请求成功!', res.data)
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
    wx.navigateTo({
      url: `/pages/wbo-detail/wbo-detail?project_id=${projectId}`
    });
  }
})