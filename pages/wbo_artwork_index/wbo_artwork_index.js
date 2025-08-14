const app = getApp();
const utils = require('../../utils/util')
Page({
  data: {
    // 悬浮胶囊标签栏变量
    tabBarTabLabel: "", // 胶囊的label
    tabBarValue: 'primary', // 胶囊选中的值
    userTabs: [], // 胶囊框的数据
    tabBarShow: false, // 显示胶囊标签和tab
    userRole: null, // 角色
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
    // 数据
    Data: [],
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    dataList.forEach(item => {
      // 对内部的line_plan_list变量进行循环
      let lp_list = [];
      item.line_plan_list.forEach((line_plan) => {
        lp_list.push(line_plan.id)
      })
      arrangeData.push({
        id: item.id,
        name: item.name,
        director: item.director,
        start_date: item.start_date,
        line_plan_list: lp_list,
        to_confirmed: 80, // 假数据
      })
    })
    return arrangeData
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
          { value: 'primary', label: '工厂稿上传' },
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
  // 生命周期函数
  onLoad() {
    this.loadUserRole();
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
  },
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const that = this;
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    const userRole = that.data.userRole;
    const tabBarValue = that.data.tabBarValue;
    const groupIdList = e.currentTarget.dataset.groupIdList;
    const groupId = 1;
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
      } else {
        wx.navigateTo({
          url: `/pages/fmr/fmr_factory_samples/fmr_factory_samples?groupIdList=${JSON.stringify(groupIdList)}`
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
          url: `/pages/designer/designer_artwork_detail/designer_artwork_detail?groupIdList=${JSON.stringify(groupIdList)}`,
        });
      } else {
        wx.navigateTo({
          url: `/pages/designer/designer_review_detail/designer_review_detail?groupId=${groupId}`
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
  // 页面下拉刷新 - 用于页面重置
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return;
    utils.LoadDataList({
      page: this,
      data: {
        type: 'getProjectList',
        username: 'admin',
      },
      mode: 'refresh',
      // 如果有分页加入分页，或者搜索条件等等
    }).then(list => { // list 就是data数据
      const arrangeData = this.dataStructure(list);
      this.setData({
        Data: arrangeData
      })
    });
  },
  // 页面上拉触底事件的处理函数-用于加载更多数据
  onReachBottom() {
    // noMoreData:true, 下拉时，如果数据没有了，将这个值进行设置
    // 如果在下拉刷新，禁止滚动加载
    if (this.data.isDownRefreshing || this.data.noMoreData) return;
    utils.LoadDataList({
      page: this,
      data: {
        type: 'getProjectList',
        username: 'admin',
      },
      mode: 'more',
      // 如果有分页加入分页，或者搜索条件等等
    }).then(list => { // list 就是data数据
      const arrangeData = this.dataStructure(list);
      this.setData({
        Data: this.data.Data.concat(arrangeData),
      })
    });
    // // 触底操作数据完成后处理
    // if (this.data.currentIndex === this.data.allIdList.length) {
    //   this.setData({
    //     noMoreData: true
    //   })
    // }
  },
  // 胶囊悬浮框切换函数
  onTabBarChange(e) {
    const that = this;
    // 设置切换值
    wx.showLoading({ title: '正在加载...' });
    that.setData({
      tabBarValue: e.detail.value,
      skeletonLoading: true,
    });
    // 动态显示tab
    const current = this.data.userTabs.find(item => item.value === this.data.tabBarValue);
    if (current) {
      this.setData({
        tabBarTabLabel: current.label
      });
    }
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
