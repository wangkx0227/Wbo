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
  // 获取数据
  getData() {
    wx.showLoading({ title: '正在加载...', });
    const that = this;
    const fileUrl = app.globalData.url;
    wx.request({
      url: fileUrl, // 请求地址
      method: 'POST',
      data: {
        type: "getProjectList",
        username: "admin"
      },
      header: {
        'content-type': 'application/json' // 根据后端要求设置
      },
      success(res) {
        if (res.statusCode === 200) {
          const data = res.data.data;// 数据
          if (data) {
            let arrangeData = [];
            data.forEach(item => {
              arrangeData.push({
                id: item.id,
                name: item.name,
                director: item.director,
                start_date: item.start_date,
                line_plan_list: item.line_plan_list,
                to_confirmed: 80, // 假数据
              })
            })
            that.setData({
              Data: arrangeData
            })
          }
        } else {
          utils.showToast(that, "数据请求失败", "error");
        }
      },
      fail(err) {
        utils.showToast(that, "数据请求失败", "error");
      },
      complete: () => {
        that.setData({ skeletonLoading: false }); // 即使失败也结束骨架
        wx.hideLoading();
      }
    });
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
    utils.LoadDataList({
      page: this,
      data: { type: "getProjectList", username: "admin" },
      mode: 'init'
    }).then(list => { // list 就是data数据
        let arrangeData = [];
        list.forEach(item => {
          arrangeData.push({
            id: item.id,
            name: item.name,
            director: item.director,
            start_date: item.start_date,
            line_plan_list: item.line_plan_list,
            to_confirmed: 80, // 假数据
          })
        })
        this.setData({
          Data: arrangeData
        })
    });
  },
  // 页面下拉刷新 - 用于页面重置
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return;
    this.setData({ isDownRefreshing: true });
    this.getData();
    // 模拟数据加载
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
      this.setData({
        isDownRefreshing: false, // 修改状态
      });
    }, 1500);
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
    console.log(1);
    console.log(groupId, "准备跳转");
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    const tabBarValue = that.data.tabBarValue;
    if (userRole === "kyle") {
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
    } else if (userRole === "fmr") { // fmr可行性与样品图上传
      if (tabBarValue === "primary") { // fmr 可行性评估与样品图上传
        wx.navigateTo({
          url: `/pages/fmr/fmr_artwork_detail/fmr_artwork_detail?groupId=${groupId}`,
        });
      } else {
        wx.navigateTo({
          url: `/pages/fmr/fmr_factory_samples/fmr_factory_samples?groupId=${groupId}`
        });
      }
    } else if (userRole === "ms") { // 选稿阶段r1
      if (tabBarValue === "primary") { // fmr 可行性评估与样品图上传
        wx.navigateTo({
          url: `/pages/guest_selection/guest_selection_first_round/guest_selection_first_round?groupId=${groupId}`,
        });
      } else {
        wx.navigateTo({
          url: `/pages/guest_selection/guest_selection_final_round/guest_selection_final_round?groupId=${groupId}`
        });
      }

    } else if (userRole === "d") { // 设计师对上传工厂稿
      if (tabBarValue === "primary") { // 设计师工厂稿上传，样品图审查
        wx.navigateTo({
          url: `/pages/designer/designer_artwork_detail/designer_artwork_detail?groupId=${groupId}`,
        });
      } else {
        wx.navigateTo({
          url: `/pages/designer/designer_review_detail/designer_review_detail?groupId=${groupId}`
        });
      }

    } else if (userRole === "fma") { // fmr主管分配fmr图稿
      wx.navigateTo({
        url: `/pages/fmr/fmr_manager_assignment/fmr_manager_assignment?groupId=${groupId}`,
      });
    }
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
    // 设置值
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
    // 加载假数据
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
})
