const utils = require('../../../utils/util')
Page({
  data: {
    Data: [], // 页面展示数据变量
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
    skeletonLoading: true, // 骨架控制变量
    scrollTop: 0, // 回到顶部变量
    // 筛选框变量-1
    dropdownTemplate: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部客户',
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
          label: '默认排序',
        },
        {
          value: 'reverse',
          label: '从低到高排序',
        },
      ],
    },
    filterSorter: false, // 排序筛选条件
    popupAddVisible: false, // 新增lp
    addLPData: {
      project_id: null,
      type: "addLp",
      lp_type: 0,
      title: null,
      client: null,
      year: null,
      season: null,
      status: "", // 是TD还是AIE
      is_new_development: 1,
      username: "管理员",
    },
  },
  // 生命周期函数
  onLoad(options) {
    const that = this;
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const apiUserName = wx.getStorageSync('apiUserName');
    const development_id = options.development_id; // 开发案id
    that.setData({
      userRole: userRole,
      userName: userName,
      apiUserName: apiUserName,
      development_id: development_id,
    })
    that.dataRequest("init");
  },
  // 首页数据结构处理
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
  // 数据分页显示处理
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
    console.log(11);
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
    if (that.data.currentIndex === that.data.filteredData.length) {
      that.setData({
        noMoreData: true
      })
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
      filterTemplate: value,
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
    const filterTemplate = that.data.filterTemplate;
    let sorted = [...that.data.filteredData]; // 拷贝一份，避免直接改动原数组
    const filtered = sorted.filter(item => {
      const matchName = (filterTemplate === 'all') ? true : item.line_plan_client === filterTemplate;
      return matchName;
    });
    sorted = filtered.reverse(); // 生成一个新的
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
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    console.log("跳转");
  },
  // 创建类型 单选的状态赋值
  onRadioChange(event) {
    const { value } = event.detail;
    this.setData({ "addLPData.type": value });
  },
  // 新增lp
  onOpenAddLP() {
    this.setData({
      popupAddVisible: true
    });
  },
  // 新增lp内部关闭
  onCloseAddDialog() {
    const that = this;
    that.setData({
      popupAddVisible: false,
    });
    setTimeout(() => {
      that.setData({
        addLPData: {
          project_id: null,
          type: "addLp",
          lp_type: 0,
          title: null,
          client: null,
          year: null,
          season: null,
          type: "",
          is_new_development: 1,
          username: "管理员",
        },
      });
    }, 500)
  },
  // 新增lp输入处理
  handleInput(e) {
    const field = e.currentTarget.dataset.field; // 获取字段名（year/month）
    this.setData({
      [`addLPData.${field}`]: e.detail.value // 动态更新对应字段
    });
  },
  // 新增lp内部提交
  onSubmitAddDialog() {
    const that = this;
    const development_id = that.data.development_id;
    that.setData({
      'addLPData.project_id': development_id // 使用路径语法
    });
    const { title, client, year, season,type } = that.data.addLPData;
    if (!title || !client || !year || !season || !type) {
      utils.showToast(that, "数据不能为空", "error");
      return
    } else {
      utils.UpdateData({
        page: that,
        data: that.data.addLPData,
        message: "添加LP成功"
      }).then(res => {
        if (res.statusCode === 200) {
          let lp_data = {
            lp_title: title,
            line_plan_year: year,
            line_plan_season: season,
            line_plan_client: client,
            development_start_data: "暂未获取",
            line_new: true,
            type:type,
          }
          that.setData({
            Data: [lp_data, ...that.data.Data],
            allData: [lp_data, ...that.data.allData],
            filteredData: [lp_data, ...that.data.filteredData],
          });
          that.onCloseAddDialog();
        }
      })
    }
  },
})
