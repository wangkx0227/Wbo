const app = getApp();
const utils = require('../../utils/util')
Page({
  data: {
    Data: [], // 页面展示数据
    allData: [],// 全部的数据
    pageSize: 6, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引

    tabBarTabLabel: "", // 胶囊的label
    tabBarValue: 'primary', // 胶囊选中的值
    userTabs: [], // 胶囊框的数据
    tabBarShow: false, // 显示胶囊标签和tab
    userRole: null, // 角色
    userName: null, // 名称
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    skeletonLoading: true, // 骨架控制变量
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
    // 搜索变量
    searchValue: '',

  },
  // 加载用户角色
  loadUserRole() {
    const userRole = wx.getStorageSync('userRole');
    // 判断显示标签栏
    if (userRole === "kyle") {
      this.setData({
        tabBarShow: true, userTabs: [
          { value: 'primary', label: '初步评审' },
          { value: 'ultimate', label: '最终审查' }
        ]
      });
    } else if (userRole === "fmr") {
      this.setData({
        tabBarShow: true, userTabs: [
          { value: 'primary', label: '可行性评估' },
          { value: 'ultimate', label: '样品上传' }
        ]
      });
    } else if (userRole === "d") {
      this.setData({
        tabBarShow: true, userTabs: [
          { value: 'primary', label: "图稿修改" },
          { value: 'factory', label: '工厂稿上传' },
          { value: 'ultimate', label: '样品图审查' }
        ]
      });
    } else if (userRole === "ms") {
      this.setData({
        tabBarShow: true, userTabs: [
          { value: 'primary', label: '第一轮选稿' },
          { value: 'ultimate', label: '第二轮选稿' }
        ]
      });
    }
    // 设置tag显示
    const current = this.data.userTabs.find(item => item.value === this.data.tabBarValue);
    if (current) {
      this.setData({
        tabBarTabLabel: current.label
      });
    }
    this.setData({
      userRole: userRole
    })
  },
  // 首页数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    dataList.forEach(item => {
      const development_name = item.name; // 开发案名称
      const development_director = item.director; // 主导人
      const development_start_data = item.start_date; // 开发案开始时间
      // 对内部的line_plan_list变量进行循环
      item.line_plan_list.forEach((line_plan) => {
        const lp_data = {
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
  dataPage(mode) {
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
  // 生命周期函数
  onLoad() {
    this.loadUserRole(); // 需要根据不同角色加载数据
    this.dataPage("init"); // 分页处理

  },
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const that = this;
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    const userRole = that.data.userRole;
    const tabBarValue = that.data.tabBarValue;
    const groupIdList = e.currentTarget.dataset.groupIdList;
    if (userRole === "kyle") {
      if (tabBarValue === "primary") { // kyle 初筛和终评
        wx.navigateTo({
          url: `/pages/kyle/kyle_artowrk_primary_details/kyle_artowrk_primary_details?groupIdList=${JSON.stringify(groupIdList)}`
        });
      } else {
        // 多携带一个参数tabBarValue，表明当前切换的时用户负责的阶段
        wx.navigateTo({
          url: `/pages/kyle/kyle_artowrk_ultimate_details/kyle_artowrk_ultimate_details?groupIdList=${JSON.stringify(groupIdList)}&tabBarValue=${tabBarValue}`
        });
      }
    } else if (userRole === "shelley") { // shelley可行性
      wx.navigateTo({
        url: `/pages/shelley/shelley_artwork_detail/shelley_artwork_detail?groupIdList=${JSON.stringify(groupIdList)}`
      });
    } else if (userRole === "fmr") { // fmr可行性与样品图上传
      if (tabBarValue === "primary") { // fmr 可行性评估与样品图上传
        wx.navigateTo({
          url: `/pages/fmr/fmr_artwork_detail/fmr_artwork_detail?groupIdList=${JSON.stringify(groupIdList)}`,
        });
      }
    } else if (userRole === "ms") { // 选稿阶段r1
      if (tabBarValue === "primary") { // fmr 可行性评估与样品图上传
        wx.navigateTo({
          url: `/pages/guest_selection/guest_selection_first_round/guest_selection_first_round?groupIdList=${JSON.stringify(groupIdList)}`,
        });
      } else {
        wx.navigateTo({
          url: `/pages/guest_selection/guest_selection_final_round/guest_selection_final_round?groupIdList=${JSON.stringify(groupIdList)}`
        });
      }

    } else if (userRole === "d") { // 设计师对上传工厂稿
      if (tabBarValue === "primary") { // 设计师工厂稿上传，样品图审查
        wx.navigateTo({
          url: `/pages/designer/designer_review_detail/designer_review_detail?groupIdList=${JSON.stringify(groupIdList)}`
        });
      } else if (tabBarValue === "factory") {
        wx.navigateTo({
          url: `/pages/designer/designer_artwork_detail/designer_artwork_detail?groupIdList=${JSON.stringify(groupIdList)}`,
        });
      }
    } else if (userRole === "fma") { // fmr主管分配fmr图稿
      wx.navigateTo({
        url: `/pages/fmr/fmr_manager_assignment/fmr_manager_assignment?groupIdList=${JSON.stringify(groupIdList)}`,
      });
    }
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
  // 页面下拉刷新
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return; // 如果正在加载更多，则禁止下拉刷新
    // 重置 currentIndex 让它从头开始访问
    this.setData({
      currentIndex: 0,
      noMoreData: false,
      isLoadingReachMore: false
    })
    this.dataPage('refresh');
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
    const userRole = that.data.userRole; // 角色
    const value = e.detail.value;// 值
    const current = that.data.userTabs.find(item => item.value === value); // 动态显示tab
    // 如果fmr点击的时样品上传，进行跳转
    if (current.value === "ultimate" && (userRole === "fmr" || userRole === "d")) {
      wx.navigateTo({
        url: `/pages/factory_login_page/wbo-list/wbo-list` // 样品图上传，使用原来项目
      });
    } else {
      that.setData({ // 设置切换值
        tabBarValue: e.detail.value,
      });
      if (current) {
        this.setData({
          tabBarTabLabel: current.label
        });
      }
      wx.showLoading({ title: '正在加载...' });
      that.setData({
        skeletonLoading: true,
      })
      // 需要根据不同角色加载数据
      utils.LoadDataList({
        page: this,
        data: { type: "getProjectList", username: "admin" },
        mode: 'init'
      }).then(list => { // list 就是data数据
        const arrangeData = this.dataStructure(list);
        this.setData({
          Data: arrangeData
        })
      });
    }
  },
  // 导出附件
  exportAttachments(e) {
    // const that = this;
    // const fileUrl = app.globalData.fileUrl;
    // wx.request({
    //   url: fileUrl, // 请求地址
    //   method: 'POST',
    //   data: {
    //     name: "11",
    //     url: 'https://xcx.1bizmail.com:8153/static/images/wpb_images/D51_Resin_Ornament_CS25-HHR-129_JkE4FgU.jpg'
    //   },
    //   header: {
    //     'content-type': 'application/json' // 根据后端要求设置
    //   },
    //   success(res) {
    //     if (res.statusCode === 200) {
    //       const message = "导出成功,请稍等"
    //       utils.showToast(that, message);
    //     } else {
    //       const theme = "error"
    //       const message = "导出失败"
    //       utils.showToast(that, message, theme);
    //     }
    //   },
    //   fail(err) {
    //     const theme = "error"
    //     const message = "导出失败"
    //     utils.showToast(that, message, theme);
    //   }
    // });
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
})
