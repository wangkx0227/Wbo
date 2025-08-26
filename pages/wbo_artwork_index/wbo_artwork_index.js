const app = getApp();
const utils = require('../../utils/util')
Page({
  data: {
    Data: [], // 页面展示数据变量
    allData: [],// 全部的数据
    filteredData: [], // 筛选后的数据
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
          label: '全部客户',
        },
      ],
    },
    filterTemplate:'all',
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
    } else if (userRole === "designer") {
      this.setData({
        tabBarShow: true, userTabs: [
          { value: 'primary', label: "图稿修改" },
          { value: 'factory', label: '工厂稿上传' },
          { value: 'ultimate', label: '样品图审查' }
        ]
      });
    } else if (userRole === "chosen_draft") {
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
    let client_list = [];
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
        client_list.push(lp_data["line_plan_client"].trim()); // 客户列表加入
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
    /*
        mode：模式
        filter：筛选条件
        field: 筛选数据内的key也就是字段
        , filter = "all", field
    */
   
    const that = this;
    const apiUserName = that.data.apiUserName;
    utils.LoadDataList({
      page: this,
      data: { type: "getProjectList", username: apiUserName },
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
  onLoad() {
    const that = this;
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const apiUserName = wx.getStorageSync('apiUserName');
    // 先设置数据，再执行其他操作
    that.setData({
      userRole: userRole,
      userName: userName,
      apiUserName:apiUserName
    }, () => {
      // 在setData回调中执行后续操作
      that.loadUserRole();
      that.dataRequest("init");
    });
  },
  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const that = this;
    // 需要3类人进行跳转 Kyle Shelley FMR 进行跳转
    const userRole = that.data.userRole;
    const tabBarValue = that.data.tabBarValue;
    const lineplan_id = e.currentTarget.dataset.lineplan_id;
    const development_id = e.currentTarget.dataset.development_id;
    if (userRole === "kyle") {
      if (tabBarValue === "primary") { // kyle 初筛和终评
        wx.navigateTo({
          url: `/pages/kyle/kyle_artowrk_primary_details/kyle_artowrk_primary_details?lineplan_id=${lineplan_id}`
        });
      } else {
        // 多携带一个参数tabBarValue，表明当前切换的时用户负责的阶段

        wx.navigateTo({
          url: `/pages/kyle/kyle_artowrk_ultimate_details/kyle_artowrk_ultimate_details?lineplan_id=${lineplan_id}&tabBarValue=${tabBarValue}`
        });
      }
    } else if (userRole === "shelley") { // shelley可行性
      wx.navigateTo({
        url: `/pages/shelley/shelley_artwork_detail/shelley_artwork_detail?lineplan_id=${lineplan_id}`
      });
    } else if (userRole === "fmr") { // fmr可行性与样品图上传
      if (tabBarValue === "primary") { // fmr 可行性评估与样品图上传
        wx.navigateTo({
          url: `/pages/fmr/fmr_artwork_detail/fmr_artwork_detail?lineplan_id=${lineplan_id}`,
        });
      }
    } else if (userRole === "chosen_draft") { // 选稿阶段r1
      if (tabBarValue === "primary") { // fmr 可行性评估与样品图上传
        wx.navigateTo({
          url: `/pages/guest_selection/guest_selection_first_round/guest_selection_first_round?lineplan_id=${lineplan_id}&development_id=${development_id}`,
        });
      } else {
        wx.navigateTo({
          url: `/pages/guest_selection/guest_selection_final_round/guest_selection_final_round?lineplan_id=${lineplan_id}`
        });
      }

    } else if (userRole === "designer") { // 设计师对上传工厂稿
      if (tabBarValue === "primary") { // 设计师工厂稿上传，样品图审查
        wx.navigateTo({
          url: `/pages/designer/designer_revision_detail/designer_revision_detail?lineplan_id=${lineplan_id}&development_id=${development_id}`
        });
      } else if (tabBarValue === "factory") {
        wx.navigateTo({
          url: `/pages/designer/designer_artwork_detail/designer_artwork_detail?lineplan_id=${lineplan_id}`,
        });
      }
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
  // 胶囊悬浮框切换函数
  onTabBarChange(e) {
    const that = this;
    const value = e.detail.value;// 值
    const userRole = that.data.userRole; // 角色
    const current = that.data.userTabs.find(item => item.value === value); // 动态显示tab
    // 重置数据，与筛选条件
    that.setData({
      'dropdownTemplate.value': 'all',
      'dropdownSorter.value': 'default',
    })
    // 如果fmr点击的时样品上传，进行跳转
    if (current.value === "ultimate" && (userRole === "fmr" || userRole === "designer")) {
      // wx.navigateTo({
      //   url: `/pages/factory_login_page/wbo-list/wbo-list` // 样品图上传，使用原来项目
      // });
      wx.navigateTo({
        url: `/pages/factory_login_page/index/index` // 样品图上传，使用原来项目
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
      this.dataRequest("switch"); // 分页处理
    }
  },
  // 导出附件
  exportAttachments(e) {
    const that = this;
    const url = app.globalData.url;
    // const fileUrl = app.globalData.fileUrl;
    const userName = that.data.userName;
    const lineplan_id = e.currentTarget.dataset.lineplan_id; // 注意属性名会自动转驼峰
    wx.request({
      url: url, // 请求地址
      method: 'POST',
      data: {
        "type": "exportPPT",
        "lp_ids": [
          lineplan_id,
        ],
        "username": userName
      },
      header: {
        'content-type': 'application/json' // 根据后端要求设置
      },
      success(res) {
        if (res.statusCode === 200) {
          const full_url_list = res.data.full_url_list || [];
          if (full_url_list.length === 0) {
            utils.showToast(that, "无附件", "error");
          } else {
            utils.showToast(that, "请查看微信通知");
          }
        } else {
          utils.showToast(that, "导出失败", "error");
        }
      },
      fail(err) {
        utils.showToast(that, "网络错误", "error");
      }
    });
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
      filterTemplate:value,
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
  // 上传表格文档
  descUpload(e) {
    const that = this;
    const lineplan_id = e.currentTarget.dataset.lineplan_id;
    const montageUrl = app.globalData.montageUrl;
    // 1. 让用户选择文件
  
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xls', 'xlsx'],
      success: (res) => {
        // 2. 用户选择成功
        const tempFile = res.tempFiles[0];
        const parts = tempFile.name.split('.');
        const suffix = parts[parts.length - 1]; // 正确：获取最后一个元素
        // 健壮性检查
        if (!suffix || (suffix !== 'xls' && suffix !== 'xlsx')) {
          utils.showToast(that, "文件格式错误，请选择Excel文件", "error");
          return;
        }
        wx.showLoading({ title: '上传中，请稍后' });
        // 3. 上传文件到服务器
        wx.uploadFile({
          url: montageUrl + '/wbo/upload_file/', // 你的服务器上传接口地址
          filePath: tempFile.path, // 临时文件路径
          name: 'file', // 文件对应的参数名，后端根据这个字段获取文件
          formData: {
            // 可以附带其他参数，如用户ID
            'lp_id': lineplan_id
          },
          success: (uploadRes) => {
            // 4. 上传成功
            utils.showToast(that, "上传成功");
          },
          fail: (err) => {
            utils.showToast(that, "上传失败", "error");
          },
          complete(res) {
            wx.hideLoading();
          }
        });
      },
      fail: (err) => {
        utils.showToast(that, "选择文件失败", "error");
      }
    });
  }
})
