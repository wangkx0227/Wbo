const utils = require('../../../utils/util')
Page({
  data: {
    // 悬浮胶囊标签栏变量
    tabBarValue: 'todo',
    tabBarTabLabel: '最终审查',
    Data: [], // 页面展示数据
    allData: [],// 全部的数据
    pageSize: 6, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引
    userTabs: [], // 胶囊框的数据
    tabBarShow: false, // 显示胶囊标签和tab
    userRole: null, // 角色
    userName: null, // 名称
    scrollTop: 0, // 回到顶部变量

    // 筛选框变量-1
    dropdownTemplate: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部',
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
      title: 'WBO待处理',
      path: 'pages/todo/todo_index/todo_index',  // 分享后打开的页面路径
      imageUrl: '/assets/images/log.jpg'     // 自定义分享封面
    };
  },
  // 首页数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    dataList.forEach(item => {
      const development_id = item.id; // 开发案id
      const development_name = item.name; // 开发案名称
      const development_director = item.director; // 主导人
      const development_start_data = item.start_date; // 开发案开始时间
      // 对内部的line_plan_list变量进行循环
      item.line_plan_list.forEach((line_plan) => {
        const lp_data = {
          development_id: development_id, // 开发案id
          line_plan_id: line_plan.id, // id
          line_plan_title: `${development_name}-${line_plan.title}`, // 名称
          line_plan_client: line_plan.client || "未记录", // 客户
          line_plan_year: line_plan.year || "未记录", // 年
          line_plan_season: line_plan.season || "未记录", // 风格
          line_plan_is_new_development: line_plan.is_new_development, // 是否结案
          development_director: development_director,// 主导人
          development_start_data: development_start_data, //开发案时间
        }
        if (lp_data['line_plan_is_new_development']) {
          lp_data['is_new_development_text'] = "完结"
        } else {
          lp_data['is_new_development_text'] = "未完结"
        }
        arrangeData.push(lp_data)
      })
    })
    return arrangeData
  },
  // 数据分页显示处理
  dataRequest(mode) {
    const that = this;
    utils.LoadDataList({
      page: this,
      data: { type: "getProjectList", username: "admin" },
      mode: mode
    }).then(list => { // list 就是data数据
      const arrangeData = that.dataStructure(list);
      that.setData({
        allData: arrangeData
      })
      // 数据逻辑构建
      const pageData = utils.readPageStructure(that); // 分页数据
      let totalRequests = that.data.pageSize;
      if (pageData.length !== totalRequests) {
        totalRequests = pageData.length;
      }
      // 针对刷线和第一次加载使用
      if (mode === 'refresh') {
        that.setData({
          Data: pageData,
        })
      } else {
        that.setData({
          Data: that.data.Data.concat(pageData),
        })
      }
      that.setData({
        currentIndex: that.data.currentIndex + pageData.length // 记录下标索引
      });
    });
  },
  // 生命周期函数--监听页面加载 
  onLoad() {
    const that = this;
    const userRole = wx.getStorageSync('userRole');
    let tabBarTabLabel = "最终审查"
    if (userRole === "shelley") {
      tabBarTabLabel = "可行性分析"
    }
    that.setData({
      userRole: userRole,
      tabBarTabLabel: tabBarTabLabel
    });
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
    this.dataRequest("init"); // 分页处理
  },
  // 页面下拉刷新
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
  // 胶囊悬浮框切换函数
  onTabBarChange(e) {
    const that = this;
    // 对 胶囊悬浮框 进行复制，开启骨架
    const tabBarValue = e.detail.value;
    const userRole = that.data.userRole;
    let tabBarTabLabel = "最新";
    if (tabBarValue === "todo" && userRole === "shelley") {
      tabBarTabLabel = "可行性分析";
    }else if(tabBarValue === "todo" && userRole === "kyle"){
      tabBarTabLabel = "最终审查";
    }
    that.setData({
      tabBarValue: e.detail.value,
      tabBarTabLabel: tabBarTabLabel,
    });
  },
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const that = this;
    const groupId = e.currentTarget.dataset.groupId;
    const userRole = that.data.userRole;
    const tabBarValue = that.data.tabBarValue;
    const lineplan_id = e.currentTarget.dataset.lineplan_id;
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    if (tabBarValue === "todo") {
      if (userRole === "kyle") {
        wx.navigateTo({ url: `/pages/kyle/kyle_artowrk_ultimate_details/kyle_artowrk_ultimate_details?lineplan_id=${lineplan_id}` });
      } else if (userRole === "shelley") {
        wx.navigateTo({ url: `/pages/shelley/shelley_artwork_detail/shelley_artwork_detail?lineplan_id=${lineplan_id}` });
      }
    } else {
      wx.navigateTo({ url: `/pages/todo/todo_detail/todo_detail?groupId=${groupId}`, });
    }
  },




  // 搜索
  onSearchConfirm() {
    const keyword = e.detail.value;
    console.log("用户点击搜索，输入内容为：", keyword);
    console.log(this.data.searchValue);
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
})
