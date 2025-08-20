const utils = require('../../../utils/util')
Page({
  data: {
    // 悬浮胶囊标签栏变量
    tabBarValue: 'todo',
    tabBarTabLabel: '最终审查',
    Data: [], // 页面展示数据
    allData: [],// 全部的数据
    filteredData: [], // 筛选后的数据
    pageSize: 6, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引
    userTabs: [], // 胶囊框的数据
    tabBarShow: false, // 显示胶囊标签和tab
    userRole: null, // 角色
    userName: null, // 名称
    scrollTop: 0, // 回到顶部变量
    searchValue: "",
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
          label: '从低到高排序',
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
      title: 'WBO待处理页面',
      path: 'pages/todo/todo_index/todo_index',  // 分享后打开的页面路径
      imageUrl: '/assets/images/log.jpg'     // 自定义分享封面
    };
  },
  // 首页数据结构处理
  dataStructure(dataList) {
    const that = this;
    const mode = 'init';
    const userName = that.data.userName;
    const userRole = that.data.userRole;
    let arrangeData = [];
    let client_list = [];
    dataList.forEach(item => {
      const development_id = item.id; // 开发案id
      const development_name = item.name; // 开发案名称
      const development_director = item.director; // 主导人
      const development_start_data = item.start_date; // 开发案开始时间
      // 对内部的line_plan_list变量进行循环
      item.line_plan_list.forEach((line_plan) => {
        const development_status = line_plan.status; // 阶段
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
          development_status: development_status
        }
        if (lp_data['line_plan_is_new_development']) {
          lp_data['is_new_development_text'] = "完结"
        } else {
          lp_data['is_new_development_text'] = "未完结"
        }
        if (development_status === 1) {
          lp_data['development_status_text'] = "概念创建打包"
        } else if (development_status === 2) {
          lp_data['development_status_text'] = "初级审查"
        } else if (development_status === 3) {
          lp_data['development_status_text'] = "可行性分析"
        } else if (development_status === 4) {
          lp_data['development_status_text'] = "AIT制图"
        } else if (development_status === 5) {
          lp_data['development_status_text'] = "最终审查"
        } else if (development_status === 6) {
          lp_data['development_status_text'] = "MIRO阶段"
        } else if (development_status === 7) {
          if (userRole === 'designer') {
            lp_data['development_status_text'] = "上传工厂稿"
          } else {
            lp_data['development_status_text'] = "客户选样"
          }

        } else if (development_status === 8) {
          lp_data['development_status_text'] = "工厂打样"
        } else if (development_status === 9) {
          lp_data['development_status_text'] = "客户中单"
        }
        if (userRole === 'kyle' && (development_status === 2 || development_status === 5)) {
          // kyle的初审与终审
          arrangeData.push(lp_data)
        }
        if ((userRole === 'shelley' || userRole === 'fmr') && development_status === 3) {
          // fmr与shelley可行性分析
          arrangeData.push(lp_data)
        }
        if (userRole === 'designer' && (development_status === 4 || development_status === 7)) {
          // ait制图与工厂稿上传
          arrangeData.push(lp_data)
        }
        if (userRole === 'chosen_draft' && (development_status === 7 || development_status === 9)) {
          // 第一轮选稿与第二轮选稿
          arrangeData.push(lp_data)
        }
        client_list.push(lp_data["line_plan_client"].trim()); // 客户列表加入
      });
    })
    // 筛选条件加入
    const client = utils.filterDataProcess(client_list);
    const options = this.data.dropdownTemplate.options;
    // 只有 筛选框的列表为1（内部默认有一条数据）才会添加
    if (options.length === 1) {
      this.setData({
        "dropdownTemplate.options": options.concat(client)
      })
    }
    return arrangeData
  },
  // 数据分页显示处理
  dataRequest(mode) {
    const that = this;
    const userName = that.data.userName;
    utils.LoadDataList({
      page: this,
      data: { type: "getProjectList", username: userName },
      mode: mode
    }).then(list => { // list 就是data数据
      const arrangeData = that.dataStructure(list);
      that.setData({
        allData: arrangeData,
        filteredData: arrangeData
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
    const userName = wx.getStorageSync('userName');
    // let tabBarTabLabel = "最终审查"
    // if (userRole === "shelley") {
    //   tabBarTabLabel = "可行性分析"
    // }
    that.setData({
      userRole: userRole,
      userName: userName,
      // tabBarTabLabel: tabBarTabLabel,
    });
    if (!userRole || !userName) {
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
      searchValue: "",
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
    let tabBarTabLabel = "最新阶段";
    // if (tabBarValue === "todo" && userRole === "shelley") {
    //   tabBarTabLabel = "可行性分析";
    // } else if (tabBarValue === "todo" && userRole === "kyle") {
    //   tabBarTabLabel = "最终审查";
    // }
    that.setData({
      tabBarValue: e.detail.value,
      tabBarTabLabel: tabBarTabLabel,
    });
  },
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const that = this;
    const userRole = that.data.userRole;
    const tabBarValue = that.data.tabBarValue;
    const lineplan_id = e.currentTarget.dataset.lineplan_id;
    const development_status = e.currentTarget.dataset.development_status;
    console.log(development_status);
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    if (tabBarValue === "todo") {
      if (userRole === "kyle") {
        if (development_status === 2) {
          wx.navigateTo({ url: `/pages/kyle/kyle_artowrk_primary_details/kyle_artowrk_primary_details?lineplan_id=${lineplan_id}` });
        }
        if (development_status === 5) {
          wx.navigateTo({ url: `/pages/kyle/kyle_artowrk_ultimate_details/kyle_artowrk_ultimate_details?lineplan_id=${lineplan_id}` });
        }
      } else if (userRole === "shelley") {
        wx.navigateTo({ url: `/pages/shelley/shelley_artwork_detail/shelley_artwork_detail?lineplan_id=${lineplan_id}` });
      } else if (userRole === "fmr") {
        wx.navigateTo({ url: `/pages/fmr/fmr_artwork_detail/fmr_artwork_detail?lineplan_id=${lineplan_id}` });
      } else if (userRole === "designer") {
        if (development_status === 4) {
          wx.navigateTo({ url: `/pages/designer/designer_revision_detail/designer_revision_detai?lineplan_id=${lineplan_id}` });
        }
        if (development_status === 7) {
          wx.navigateTo({ url: `/pages/designer/designer_artwork_detail/designer_artwork_detail?lineplan_id=${lineplan_id}` });
        }
      } else if (userRole === "chosen_draft") {
        if (development_status === 7) {
          wx.navigateTo({ url: `/pages/guest_selection/guest_selection_first_round/guest_selection_first_round?lineplan_id=${lineplan_id}` });
        }
        if (development_status === 9) {
          wx.navigateTo({ url: `/pages/guest_selection/guest_selection_final_round/guest_selection_final_round?lineplan_id=${lineplan_id}` });
        }
      }
    } else {
      wx.navigateTo({ url: `/pages/todo/todo_detail/todo_detail?lineplan_id=${lineplan_id}`, });
    }
  },
  // 下拉菜单-模板
  onTemplateChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterSorter = that.data.filterSorter; // 排序
    const filtered = that.data.allData.filter(item => {
      if (value === 'all') {
        return item;
      }
      return !value || item.line_plan_client === value;
    });
    that.setData({
      filteredData: filterSorter ? filtered.reverse() : filtered, // 记录筛选数据
      Data: [],
      currentIndex: 0,
      noMoreData: false
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
      'dropdownTemplate.value': value,
    });
  },
  // 下拉菜单-排序
  onSorterChange(e) {
    const that = this;
    let sorted = [...that.data.filteredData]; // 拷贝一份，避免直接改动原数组
    sorted = sorted.reverse(); // 生成一个新的
    that.setData({
      Data: [],
      currentIndex: 0,
      filterSorter: true,
      filteredData: sorted, // 存储筛选记录数据
      'dropdownSorter.value': e.detail.value,
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
    });
  },
  // 搜索
  onSearchConfirm(e) {
    const that = this;
    const keyword = e.detail.value;
    const filtered = that.data.allData.filter(item => {
      const matchName = (keyword === '') ? true : new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        .test(item.line_plan_title);
      return matchName;
    });
    that.setData({
      filteredData: filtered, // 记录筛选数据
      Data: [],
      currentIndex: 0,
      noMoreData: false
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
    });
  },
})
