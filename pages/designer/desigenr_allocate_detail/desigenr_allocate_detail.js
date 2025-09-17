const utils = require('../../../utils/util')
Page({
  data: {
    allData: [],// 全部的数据
    userRole: null, // 角色
    userName: null, // 名称
    filteredData: [], // 筛选后的数据
    pageSize: 6, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕

    Data: [{
      task_id: 9999,
      task_code: "Jasonyu_2025_30296_001",
      allocate: "南宁TD",
      desigenr_name: "暂未指派"
    }, {
      task_id: 1,
      task_code: "Jasonyu_2025_30296_001",
      allocate: "深圳TD",
      desigenr_name: "暂未指派"
    },], // 页面展示数据变量
    line_plan_id: null, // lp id
    skeletonLoading: false, // 骨架控制变量
    scrollTop: 0, // 回到顶部变量
    desigenrPickerVisible: false, // task分配公司
    desigenrPickerItemList: [
      {
        label: "韩浩然",
        value: "韩浩然",
      }, {
        label: "李亚丹",
        value: "李亚丹",
      }
    ],
    fileDataList: [
      {
        "file_id": 1,
        "file_name": "xxxx_xxx.pnf",
      },
      {
        "file_id": 2,
        "file_name": "xxxx_xxx.pnf",
      },
    ], // 资料列表
    seriesList: [
      {
        "series_id": 1,
        "series_name": "圣诞系列",
      },
      {
        "series_id": 2,
        "series_name": "圣诞系列",
      },
    ], // 系列列表
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

  // 首页数据结构处理 - 未用
  dataStructure(dataList) {
    let arrangeData = [];
    let client_list = [];
    dataList.forEach(item => {
      const development_id = item.id; // 开发案id
      const development_start_data = item.start_date; // 开发案开始时间
      // 对内部的line_plan_list变量进行循环
      item.line_plan_list.forEach((line_plan) => {
        const lp_data = {
          development_id: development_id, // 开发案id
          line_plan_id: line_plan.id, // id
          lp_title: line_plan.title,
          line_plan_client: line_plan.client || "未记录", // 客户
          line_plan_year: line_plan.year || "未记录", // 年
          line_plan_season: line_plan.season || "未记录", // 风格
          development_start_data: development_start_data, //开发案时间
          line_new: false,
        }
        client_list.push(lp_data["line_plan_client"].trim()); // 客户列表加入
        lp_data["select_status"] = false; // 批量选中状态
        arrangeData.push(lp_data)
      })
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

    return arrangeData // 全部数据
  },
  // 数据分页显示处理 - 未用
  dataRequest(mode) {
    const that = this;
    const apiUserName = that.data.apiUserName;
    const development_id = that.data.development_id;
    utils.LoadDataList({
      page: that,
      data: { type: "getProjectList", username: apiUserName, project_id: development_id },
      mode: mode
    }).then(list => { // list 就是data数据
      const arrangeData = that.dataStructure(list);
      that.setData({
        allData: arrangeData, // 初始数据保持不变
        filteredData: arrangeData
      })
      // 分页基于 filteredData
      const pageData = utils.readPageStructure(that); // 分页数据
      let totalRequests = that.data.pageSize;
      if (pageData.length !== totalRequests) {
        totalRequests = pageData.length;
      }
      // 针对刷新和第一次加载使用，tab切换使用
      if (mode === 'refresh' || mode === 'switch') {
        that.setData({
          Data: pageData
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
  onLoad(options) {
    const that = this;
    // if (!utils.LoginStatusAuthentication(that)) {
    //   // 未登录状态，函数已处理跳转逻辑
    //   return;
    // }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const apiUserName = wx.getStorageSync('apiUserName');
    const line_plan_id = options.lineplan_id; // 开发案id
    that.setData({
      userRole: userRole,
      userName: userName,
      apiUserName: apiUserName,
      line_plan_id: line_plan_id,
    })
  },

  // 页面下拉刷新
  // onPullDownRefresh() {
  //   if (this.data.isLoadingReachMore) return; // 如果正在加载更多，则禁止下拉刷新
  //   // 重置 currentIndex 让它从头开始访问
  //   this.setData({
  //     searchValue: "",
  //     currentIndex: 0,
  //     noMoreData: false,
  //     isLoadingReachMore: false
  //   })
  //   // this.dataRequest('refresh');
  // },
  // 页面上拉触底加载更多数据
  // onReachBottom() {
  //   // 下拉刷线，读取原来的加载过的数据即可
  //   const that = this;
  //   // 如果在下拉刷新，禁止滚动加载
  //   if (that.data.isDownRefreshing || that.data.noMoreData) return;
  //   const pageData = utils.readPageStructure(that); // 分页数据
  //   let totalRequests = that.data.pageSize;
  //   if (pageData.length !== totalRequests) {
  //     totalRequests = pageData.length;
  //   }
  //   that.setData({
  //     Data: that.data.Data.concat(pageData),
  //     currentIndex: that.data.currentIndex + pageData.length // 记录下标索引
  //   });
  //   if (that.data.currentIndex === that.data.filteredData.length) {
  //     that.setData({
  //       noMoreData: true
  //     })
  //   }
  // },





  // 图稿公司分配
  onAllocateClick(e) {
    const task_id = e.target.dataset.task_id;
    this.setData({
      task_id: task_id,
      desigenrPickerVisible: true
    });
  },
  // 关闭 AIT筛选器
  onAllocateClosePicker() {
    this.setData({
      task_id: null,
      allocatePickerValue: null,
      desigenrPickerVisible: false,
    });
  },
  // 提交 AIT筛选器
  onAllocatePickerChange(e) {
    const that = this;
    const userName = that.data.userName;
    const task_id = that.data.task_id;
    const { value } = e.detail;
    const updatedData = that.data.Data.map(item => {
      if (item.task_id === task_id) {
        item["desigenr_name"] = value;
      };
      return item;
    })
    that.setData({
      Data: updatedData
    });
    that.onAllocateClosePicker();
  },
})
