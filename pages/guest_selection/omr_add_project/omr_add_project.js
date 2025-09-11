const app = getApp();
const utils = require('../../../utils/util')
const montageUrl = app.globalData.montageUrl;
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
      end_date: null,
      director: null, // 主导人id
      create_man: null, // 创建人的id
      members: [], // 参与成员 id 列表
    },
    showDirectorUserName: [],
    showMembersUserName: [],
    date_field: null,
    dateVisible: false,
    start: '2025-01-01',
    end: '2050-12-31',
    defaultValue: '2025-09-10', // 默认时间
    userList: [],
    AITUserList: [],
    AIEUserList: [],
    userSelectPickerVisible: false,
    userSelectPickerValue: [],// 选择主导人
    popupUserVisible: false,
    checkAllValues: [], // 多选参与人默认选中
  },
  // 获取用户
  dataUserRequest() {
    const that = this;
    const AITUserList = [];
    const AIEUserList = [];
    wx.request({
      url: montageUrl + '/wbo/user-roles/',
      method: "GET",
      success: (res) => {
        if (res.statusCode === 200) {
          let userList = [];
          const data = res.data;
          for (let i = 0; i < data.length; i++) {
            const id = data[i].id;
            const name = data[i].name;
            const role = data[i].role;
            userList.push({
              label: name,
              value: id
            })
            if (role.length > 0) {
              if (role[0].name === "AIT") {
                AITUserList.push(id);
              };
              if (role[0].name === "AIE") {
                AIEUserList.push(id);
              };
            };
          };
          that.setData({
            userList: userList,
            AITUserList: AITUserList,
            AIEUserList: AIEUserList,
          })
        } else {
          utils.showToast(that, "请求失败", "error");
        }
      },
      fail(err) {
        utils.showToast(that, "网络连接失败", "error");
      }
    })
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
    // 获取当前时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份补0
    const day = String(now.getDate()).padStart(2, '0'); // 日期补0
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const apiUserName = wx.getStorageSync('apiUserName');
    that.setData({
      userRole: userRole,
      userName: userName,
      defaultValue: `${year}-${month}-${day}`,
      apiUserName: apiUserName,
    });
    that.dataRequest("init"); // 分页处理
    that.dataUserRequest();
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
    const development_id = e.currentTarget.dataset.development_id;
    wx.navigateTo({
      url: `/pages/guest_selection/omr_add_lp/omr_add_lp?development_id=${JSON.stringify(development_id)}`,
      fail: (err) => {
        console.log(err);
        wx.showToast({
          title: '跳转失败',
          icon: 'error'
        });
      }
    });
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
  // 打开新增开发案
  onOpenAddProject(e) {
    this.setData({
      popupAddVisible: true
    });
  },
  // 提交新增内部
  onSubmitAddProject(e) {
    const that = this;
    const { name, start_date, end_date, director, members } = that.data.addProjectData;
    if (!name || !start_date || !end_date || !director || members.length === 0) {
      utils.showToast(that, "数据不能为空", "error");
      return
    } else {
      const userInfo = wx.getStorageSync('userInfo');
      let data = {
        "name": name,
        "start_date": start_date,
        "end_date": end_date,
        "is_completed": false,
        "director": director[0],
        "create_man": 1,
        "members": members
      }
      if (userInfo) {
        data["create_man"] = userInfo.fmr.user_id;
      }
      wx.request({
        url: montageUrl + '/wbo/development-projects/',
        method: "POST",
        data: data,
        success: (res) => {
          if (res.statusCode === 201) {
            const data = res.data;
            const development_data = {
              development_director: data.director.name,
              development_end_date: data.end_date,
              development_id: data.id,
              development_name: data.name,
              development_start_date: data.start_date,
            }
            that.setData({
              Data: [development_data, ...that.data.Data],
              allData: [development_data, ...that.data.allData],
              filteredData: [development_data, ...that.data.filteredData],
            });
            that.onCloseAddProject();
          } else {
            utils.showToast(that, "请求失败", "error");
          }
        },
        fail(err) {
          utils.showToast(that, "网络连接失败", "error");
        }
      })
    }
  },
  // 关闭新增内部
  onCloseAddProject(e) {
    const that = this;
    that.setData({
      popupAddVisible: false,
    });
    setTimeout(() => {
      that.setData({
        addProjectData: {
          name: null,
          start_date: null,
          end_date: null,
          director: null,
          members: [],
        },
        showDirectorUserName: [],
        showMembersUserName: [],
      })
    }, 500)
  },
  // 通用输入处理
  handleInput(e) {
    const field = e.currentTarget.dataset.field; // 获取字段名（year/month）
    this.setData({
      [`addProjectData.${field}`]: e.detail.value // 动态更新对应字段
    });
  },
  // 选择时间框的点击事项
  onDateInputClick(e) {
    const field = e.currentTarget.dataset.field; // 获取字段名（year/month）
    this.setData({
      date_field: field,
      dateVisible: true,
    });
  },
  // 时间选择器确定
  onDateConfirm(e) {
    const { value } = e.detail;
    const date_field = this.data.date_field;
    this.setData({
      [`addProjectData.${date_field}`]: value,
    });
    this.onDateHidePicker();
  },
  // 时间选择器关闭
  onDateHidePicker() {
    this.setData({
      date_field: null,
      dateVisible: false,
    });
  },
  // 打开筛选框-主导人
  onUserInputClick(e) {
    this.setData({
      userSelectPickerVisible: true,
      userSelectPickerValue: this.data.addProjectData.director,
    });
  },
  // 关闭筛选器-主导人
  onUserSelectClosePicker(e) {
    this.setData({
      userSelectPickerVisible: false,
    });
    setTimeout(() => {
      this.setData({
        userSelectPickerValue: [],
      });
    }, 500)
  },
  // 确认筛选器-主导人
  onUserSelectPickerChange(e) {
    const that = this;
    const { value, label } = e.detail;
    that.setData({
      showDirectorUserName: label,
      "addProjectData.director": value,
    });
    setTimeout(() => {
      that.setData({
        userSelectPickerValue: [],
      });
    }, 500)
  },
  // 打开弹窗-参与人
  onOpneUserPopup(e) {
    const that = this;
    const members = that.data.addProjectData.members;
    that.setData({
      popupUserVisible: true,// 先显示弹窗
      checkAllValues: members,
    });
  },
  // 关闭弹窗-参与人
  oncloseUserPopup(e) {
    this.setData({
      checkAllValues: [],
      popupUserVisible: false,
    });
  },
  // 多选参与人
  onCheckAllChange(event) {
    this.setData({
      checkAllValues: event.detail.value,
    });
  },
  // 确定参与人
  onUserSubmit() {
    const that = this;
    let userNameList = [];
    const checkAllValues = that.data.checkAllValues;
    that.data.userList.forEach(item => {
      if (checkAllValues.includes(item.value)) {
        userNameList.push(item.label);
      };
    });
    that.setData({
      showMembersUserName: userNameList,
      "addProjectData.members": checkAllValues,
    })
    that.oncloseUserPopup();
  },
  // 根据分组选择参与人
  onUserGruopSubmit(e) {
    const that = this;
    const gruop = e.currentTarget.dataset.gruop;
    let data = [];
    if (gruop === "AIT") {
      data = that.data.AITUserList;
    }
    if (gruop === "AIE") {
      data = that.data.AIEUserList;
    }
    that.setData({
      checkAllValues: data,
    });
  }
})
