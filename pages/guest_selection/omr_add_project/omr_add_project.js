const utils = require('../../../utils/util')
Page({
  data: {
    Data: [], // 页面展示数据
    allData: [],// 全部的数据
    filteredData: [], // 筛选后的数据
    pageSize: 10, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引
    userTabs: [], // 胶囊框的数据
    tabBarShow: false, // 显示胶囊标签和tab
    userRole: null, // 角色
    userName: null, // 名称
    scrollTop: 0, // 回到顶部变量
    tabBarTabLabel: null,// 阶段
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false, // 数据是否全部加载完毕
    skeletonLoading: true, // 骨架屏控制变量
    // 筛选框变量-1
    dropdownTemplate: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部主导人',
        },
      ],
    },
    filterName: 'all',
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
    filterSorter: false, // 排序筛选条件
    popupAddVisible: false, // 新增按钮
    addProjectData: {
      name: null,
      start_date: null,
      end_date: 0,
      director: null,
      member: [],
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
  // 首页数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    let name_list = [];
    dataList.forEach(item => {
      const development_id = item.id; // 开发案id
      const development_name = item.name; // 开发案名称
      const development_director = item.director; // 主导人
      const development_start_date = item.start_date; // 开发案开始时间
      const development_end_date = item.end_date; // 结束时间
      // 对内部的line_plan_list变量进行循环
      let line_plan_id_list = [];
      item.line_plan_list.forEach((line_plan) => {
        line_plan_id_list.push(line_plan.id);
      })
      const development_data = {
        development_id: development_id, // 开发案id
        development_name: development_name, // 开发案的名称
        development_director: development_director,// 主导人
        development_start_date: development_start_date,
        development_end_date: development_end_date,
        line_plan_id_list: line_plan_id_list, // lp的id
      }
      arrangeData.push(development_data)
      name_list.push(development_data["development_director"].trim());
    })
    const director_name = utils.filterDataProcess(name_list);
    const options = this.data.dropdownTemplate.options;
    // 只有 筛选框的列表为1（内部默认有一条数据）才会添加
    if (options.length === 1) {
      this.setData({
        "dropdownTemplate.options": options.concat(director_name)
      })
    }
    return arrangeData
  },
  // 数据分页显示处理
  dataRequest(mode) {
    const that = this;
    const apiUserName = that.data.apiUserName;
    utils.LoadDataList({
      page: this,
      data: { type: "getProjectList", username: apiUserName },
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
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const apiUserName = wx.getStorageSync('apiUserName');
    let tabBarTabLabel = "样品图审核"
    if (userRole === "fmr") {
      tabBarTabLabel = "上传样品图"
    }
    that.setData({
      userRole: userRole,
      userName: userName,
      apiUserName: apiUserName,
      tabBarTabLabel: tabBarTabLabel
    });
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
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const userName = this.data.userName;
    const userRole = this.data.userRole;
    const development_id = e.currentTarget.dataset.development_id;
    // // fmr与设计师进行跳转
    // if (userName && (userRole === "fmr" || userRole === "designer")) {
    //   wx.navigateTo({
    //     url: `/pages/factory_login_page/wbo-list/wbo-list?development_id=${JSON.stringify(development_id)}`,
    //     fail: (err) => {
    //       wx.showToast({
    //         title: '跳转失败',
    //         icon: 'error'
    //       });
    //     }
    //   });
    // } else {
    //   wx.showToast({
    //     title: '未登录',
    //     icon: 'error'
    //   });
    // }
  },
  // 搜索
  onSearchConfirm(e) {
    const that = this;
    const keyword = e.detail.value;
    const filtered = that.data.allData.filter(item => {
      const matchName = (keyword === '') ? true : new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        .test(item.development_name);
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
  // 下拉菜单-模板
  onTemplateChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterSorter = that.data.filterSorter;
    const filtered = that.data.allData.filter(item => {
      const matchName = (value === 'all') ? true : item.development_director === value;
      return matchName;
    });
    that.setData({
      filteredData: filterSorter ? filtered.reverse() : filtered, // 记录筛选数据
      Data: [],
      currentIndex: 0,
      noMoreData: false,
      filterName: value
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
    const filterName = that.data.filterName;
    let sorted = [...that.data.filteredData]; // 拷贝一份，避免直接改动原数组
    const filtered = sorted.filter(item => {
      const matchName = (filterName === 'all') ? true : item.development_director === filterName;
      return matchName;
    });
    const data = filtered.reverse(); // 生成一个新的
    that.setData({
      Data: [],
      currentIndex: 0,
      filterSorter: true,
      filteredData: data, // 存储筛选记录数据
      'dropdownSorter.value': e.detail.value,
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
    });
  },
  // 新增开发案
  onOpenAddProject(e) {
    this.setData({
      popupAddVisible: true
    });
  },
  // 新增内部关闭按钮
  onCloseAddProject(e) {
    const that = this;
    that.setData({
      popupAddVisible: false
    });
  },
  // 新增内部提交按钮
  onSubmitAddProject(e) {
    // const that = this;
    // const development_id = that.data.development_id;
    // that.setData({
    //   'addLPData.project_id': development_id // 使用路径语法
    // });
    // const { title, client, year, season } = that.data.addLPData;
    // if (!title || !client || !year || !season) {
    //   utils.showToast(that, "数据不能为空", "error");
    //   return
    // } else {
    //   utils.UpdateData({
    //     page: that,
    //     data: that.data.addLPData,
    //     message: "新增LP成功"
    //   })
    //   that.setData({
    //     popupAddVisible: false
    //   });
    // }

  },
  // 通用输入处理
  handleInput(e) {
    const field = e.currentTarget.dataset.field; // 获取字段名（year/month）
    this.setData({
      [`addLPData.${field}`]: e.detail.value // 动态更新对应字段
    });
  },
})
