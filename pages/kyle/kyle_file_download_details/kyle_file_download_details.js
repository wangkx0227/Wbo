// pages/kyle/kyle_file_download_details/kyle_file_download_details.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    lineplan_id: null, // id 值
    Data: [1,2,3,4], // 存储数据
    allData: [], // 全部的值
    filteredData: [], // 筛选后的数据
    tabBar: null, // 记录切换值
    pageSize: 6, // 每次加载几条数据
    currentIndex: 0, // 当前加载到第几个ID
    skeletonLoading: false,
    noMoreData: false, // 数据是否全部加载完毕
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    userName: null, // 用户名
    userRloe: null,  // 角色名
    // 筛选框变量-1
    dropdownYear: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部',
        },
      ],
    },
    filterTemplate: 'all',
    // 筛选框变量-2
    dropdownSorter: {
      value: 'default',
      options: [
        {
          value: 'default',
          label: '默认',
        },
        {
          value: 'reverse',
          label: '从低到高排序',
        },
      ],
    },
    filterSorter: false, // 排序筛选条件
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
  },
  // 回到顶部
  onToTop(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },
  // 页面上拉刷新
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return; // 如果正在加载更多，则禁止下拉刷新
    // 重置 currentIndex 让它从头开始访问
    this.setData({
      currentIndex: 0,
      noMoreData: false,
      isLoadingReachMore: false
    })
    this.dataRequest('refresh');
  },
  // 页面上拉触底加载更多数据
  onReachBottom() {
    // 下拉刷线，读取原来的加载过的数据即可
    const that = this;
    // 如果在下拉刷新，禁止滚动加载
    if (that.data.isDownRefreshing || that.data.noMoreData) return;
    const pageData = utils.readPageStructure(that); // 分页数据
    let totalRequests = that.data.pageSize;
    if (pageData.length !== totalRequests) {
      totalRequests = pageData.length;
    }
    that.setData({
      Data: that.data.Data.concat(pageData),
      currentIndex: that.data.currentIndex + pageData.length // 记录下标索引
    });
    if (that.data.currentIndex === that.data.allData.length) {
      that.setData({
        noMoreData: true
      })
    }
  },

  //  实时监听滚动距离，把这个值传给回到顶部的按钮，让它知道是否应该出现
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop
    });
  },

  // 排序
  onYearChange() {

  },
  onStatusChange() {

  }
})