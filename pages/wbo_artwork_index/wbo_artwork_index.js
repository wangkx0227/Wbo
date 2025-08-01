import { Toast } from 'tdesign-miniprogram'; // 轻提示
const app = getApp();

Page({
  data: {
    // 悬浮胶囊标签栏变量
    tabBarValue: 'primary',
    tabBarShow: false,
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
        },
        {
          value: 'D51',
          label: 'TG-D51',
        },
        {
          value: 'D240',
          label: 'TG-D240',
        },

        {
          value: 'D234',
          label: 'TG-D240',
        },
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
        stage: "初步评审",
        program: "The Outfitters",
        Year: 2025,
        create_time: "2025-07-21",
      },
      {
        id: 2,
        to_confirmed: 20,
        client_name: "TG D240",
        stage: "初步评审",
        program: "Outfitters_001",
        Year: 2025,
        create_time: "2025-07-25",
      },
      {
        id: 3,
        to_confirmed: 5,
        client_name: "TG D51",
        stage: "初步评审",
        program: "Outfitters_002",
        Year: 2025,
        create_time: "2025-08-25",
      },
      {
        id: 4,
        to_confirmed: 5,
        client_name: "HL",
        stage: "初步评审",
        program: "Outfitters_003",
        Year: 2025,
        create_time: "2025-09-25",
      },
      {
        id: 5,
        to_confirmed: 9,
        client_name: "DG",
        stage: "初步评审",
        program: "Outfitters_004",
        Year: 2025,
        create_time: "2025-10-15",
      },
      {
        id: 6,
        to_confirmed: 2,
        client_name: "FM",
        stage: "初步评审",
        program: "Outfitters_005",
        Year: 2025,
        create_time: "2025-11-15",
      },
    ]
  },
  // 生命周期函数--监听页面加载 
  onLoad() {
    const userRole = wx.getStorageSync('userRole');
    console.log(userRole);
    wx.showLoading({ title: '正在加载...', });
    // 判断显示标签栏
    if (userRole === "kyle") {
      this.setData({ tabBarShow: true });
    }
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
    console.log(groupId, "准备跳转");
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    if (userRole === "kyle") {
      const tabBarValue = that.data.tabBarValue;
      if (tabBarValue === "primary") { // kyle 初筛和终评
        wx.navigateTo({
          url: `/pages/kyle/kyle_artowrk_primary_details/kyle_artowrk_primary_details?groupId=${groupId}`
        });
      } else {
        wx.navigateTo({
          url: `/pages/kyle/kyle_artowrk_ultimate_details/kyle_artowrk_ultimate_details?groupId=${groupId}`
        });
      }
    } else if (userRole === "shelley") { // shelley可行性
      wx.navigateTo({
        url: `/pages/shelley/shelley_artwork_detail/shelley_artwork_detail?groupId=${groupId}`
      });
    } else if (userRole === "fmr") { // fmr可行性
      wx.navigateTo({
        url: `/pages/fmr/fmr_artwork_detail/fmr_artwork_detail?groupId=${groupId}`,
      });
    } else if (userRole === "ms") { // 选稿阶段
      wx.navigateTo({
        url: `/pages/guest_selection/guest_selection_r1/guest_selection_r1?groupId=${groupId}`,
      });
    } else if (userRole === "d") { // 设计师对上传工厂稿R1
      wx.navigateTo({
        url: `/pages/designer/designer_artwork_detail/designer_artwork_detail?groupId=${groupId}`,
      });
    } else if (userRole === "fma") { // fmr主管分配fmr图稿
      wx.navigateTo({
        url: `/pages/fmr/fmr_manager_assignment/fmr_manager_assignment?groupId=${groupId}`,
      });
    }
  },
  // 用户点击右上角分享
  onShareAppMessage() {
    return {
      title: 'WBO',
      path: 'pages/wbo_artwork_index/wbo_artwork_index',  // 分享后打开的页面路径
      imageUrl: '/assets/images/log.jpg'     // 自定义分享封面
    };
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
    const newList = [
      {
        id: 7,
        to_confirmed: 8,
        client_name: "新增数据-01",
        stage: "初步评审",
        program: "The Outfitters",
        Year: 2025,
        create_time: "2025-07-21",
      },
      {
        id: 8,
        to_confirmed: 18,
        client_name: "新增数据-02",
        stage: "初步评审",
        program: "The Outfitters",
        Year: 2025,
        create_time: "2025-07-21",
      },
      {
        id: 9,
        to_confirmed: 28,
        client_name: "新增数据-03",
        stage: "初步评审",
        program: "The Outfitters",
        Year: 2025,
        create_time: "2025-07-21",
      },
    ]
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
      this.setData({
        dataAllList: oldList.concat(newList),
        isLoadingReachMore: false, // 修改状态
      });
    }, 1500);
  },
  // 回到顶部
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
  // 胶囊悬浮框切换函数
  onTabBarChange(e) {
    let data = [];
    const that = this;
    console.log("点击胶囊按钮");
    // 对 胶囊悬浮框 进行复制，开启骨架
    wx.showLoading({ title: '正在加载...' });
    that.setData({
      tabBarValue: e.detail.value,
      skeletonLoading: true,
    });
    const randomNum = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < randomNum; i++) {
      data.push({
        id: i,
        to_confirmed: i + 5,
        client_name: `TG D51-${i}`,
        stage: "初步评审",
        program: `Outfitters_${i}`,
        Year: 2025,
        create_time: `2025-08-2${i}`,
      });
    }
    const tabBarValue = that.data.tabBarValue;
    if (tabBarValue === "primary") {
      data.forEach((item) => {
        item["stage"] = "初步评审"
      })
    } else {
      data.forEach((item) => {
        item["stage"] = "最终评审"
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
