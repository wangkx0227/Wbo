const app = getApp();
const utils = require('../../../utils/util')
Page({
  data: {
    // 悬浮胶囊标签栏变量
    tabBarValue: 'todo',
    // 骨架控制变量
    skeletonLoading: true,
    // 筛选框变量-1
    dropdownTemplate: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部',
        },
        {
          value: 'HL',
          label: 'HL',
        }
      ],
    },
    // 筛选框变量-2
    dropdownSorter: {
      value: 'default',
      options: [
        {
          value: 'default',
          label: '默认排序',
        },
        {
          value: 'time',
          label: '时间从高到低',
        },
      ],
    },
    // 搜索变量
    searchValue: '',
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    // 回到顶部变量
    scrollTop: 0,
    // 假数据
    dataAllList: [
      {
        id: 1,
        to_confirmed: 15,
        client_name: "TG D84",
        stage: "待处理",
        program: "The Outfitters",
        Year: 2025,
        create_time: "2025-07-21",
      },
      {
        id: 2,
        to_confirmed: 20,
        client_name: "TG D240",
        stage: "待处理",
        program: "Outfitters_001",
        Year: 2025,
        create_time: "2025-07-25",
      },
      {
        id: 3,
        to_confirmed: 5,
        client_name: "TG D51",
        stage: "待处理",
        program: "Outfitters_002",
        Year: 2025,
        create_time: "2025-08-25",
      },
    ]
  },
  // 滚动-回到顶部
  onToTop(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },
  //  实时监听滚动距离，把这个值传给回到顶部的按钮，让它知道是否应该出现
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop
    });
  },
  // 用户点击右上角分享
  onShareAppMessage() {
    return {
      title: 'WBO',
      path: 'pages/wbo_pending_processing/wbo_pending_processing',  // 分享后打开的页面路径
      imageUrl: '/assets/images/log.jpg'     // 自定义分享封面
    };
  },
  // 生命周期函数--监听页面加载 
  onLoad() {
    const that = this;
    const userRole = wx.getStorageSync('userRole');
    if (!userRole) {
      const theme = 'error'
      const message = "当前未登录状态"
      utils.showToast(that, message, theme);
      const pages = getCurrentPages(); // 获取当前页面栈
      const currentPage = pages[pages.length - 1]; // 当前页面对象
      const route = currentPage.route; // 页面路径，例如 "pages/index/index"
      const options = currentPage.options; // 页面参数对象，例如 { id: '123' }
      let query = Object.keys(options).map(key => `${key}=${options[key]}`).join('&');
      let fullPath = route + (query ? '?' + query : ''); // 完整的路径
      // 跳转到登录界面
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/wbo_login/wbo_login?redirect=${encodeURIComponent(fullPath)}`,
        });
      }, 500)
      return
    }
    wx.showLoading({ title: '正在加载...', });
    this.setData({ userRole: userRole });
    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        skeletonLoading: false,
      })
    }, 2000)
  },
  // 下拉菜单-模板
  onTemplateChange(e) {
    this.setData({
      'dropdownTemplate.value': e.detail.value,
    });
  },
  // 下拉菜单-排序
  onSorterChange(e) {
    this.setData({
      'dropdownSorter.value': e.detail.value,
    });
  },
  // 搜索
  onSearchConfirm() {
    const keyword = e.detail.value;
    console.log("用户点击搜索，输入内容为：", keyword);
    console.log(this.data.searchValue);
  },
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const that = this;
    const groupId = e.currentTarget.dataset.groupId;
    const userRole = that.data.userRole;
    const tabBarValue = that.data.tabBarValue;
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    if (tabBarValue === "todo") {
      if (userRole === "kyle") {
        wx.navigateTo({ url: `/pages/kyle/kyle_artowrk_ultimate_details/kyle_artowrk_ultimate_details?groupId=${groupId}` });
      } else if (userRole === "shelley") {
        wx.navigateTo({ url: `/pages/shelley/shelley_artwork_detail/shelley_artwork_detail?groupId=${groupId}` });
      } else if (userRole === "fmr") {
        wx.navigateTo({ url: `/pages/fmr/fmr_artwork_detail/fmr_artwork_detail?groupId=${groupId}`, });
      }
    }else{
      wx.navigateTo({ url: `/pages/todo/todo_detail/todo_detail?groupId=${groupId}`, });
    }

  },
  // 页面下拉刷新 - 用于页面重置
  onPullDownRefresh() {
    console.log("下拉刷新触发");
    // 如果正在加载更多，则禁止下拉刷新
    if (this.data.isLoadingReachMore) return;
    this.setData({ isDownRefreshing: true });
    // 模拟数据加载
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
      this.setData({
        isDownRefreshing: false, // 修改状态
      });
    }, 1500);
  },
  // 页面上拉触底事件的处理函数-用于加载更多数据
  onReachBottom() {
    // 如果在下拉刷新，禁止滚动加载
    console.log("上拉触底触发");
    if (this.data.isDownRefreshing || this.data.noMoreData) return;
    this.setData({ isLoadingReachMore: true });
    const oldList = this.data.dataAllList;
    // 假数据
    const newList = []
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
      this.setData({
        dataAllList: oldList.concat(newList),
        isLoadingReachMore: false, // 修改状态
      });
    }, 1500);
  },
  // 胶囊悬浮框切换函数
  onTabBarChange(e) {
    let data = [];
    const that = this;
    // 对 胶囊悬浮框 进行复制，开启骨架
    wx.showLoading({ title: '正在加载...' });
    const tabBarValue = e.detail.value;
    that.setData({
      tabBarValue: e.detail.value,
      skeletonLoading: true,
    });
    const randomNum = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < randomNum; i++) {
      data.push({
        id: i,
        to_confirmed: i + 5,
        client_name: `TG D51-${i}`,
        stage: "待处理",
        program: `Outfitters_${i}`,
        Year: 2025,
        create_time: `2025-08-2${i}`,
      });
    }
    if (tabBarValue === "pending_processing") {
      data.forEach((item) => {
        item["stage"] = "待处理"
      })
    } else {
      data.forEach((item) => {
        item["stage"] = "最新"
      })
    }

    setTimeout(() => {
      wx.hideLoading();
      that.setData({
        skeletonLoading: false,
        dataAllList: data,
      })
    }, 2000)
  }
})
