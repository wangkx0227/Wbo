const app = getApp();
const url = app.globalData.montageUrl;
const utils = require('../../../utils/util')
Page({
  data: {
    allData: [], // 全部的数据
    userRole: null, // 角色
    userName: null, // 名称
    filteredData: [], // 筛选后的数据
    pageSize: 6, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false, // 数据是否全部加载完毕
    Data: [], // 页面展示数据变量
    line_plan_id: null, // lp id
    skeletonLoading: true, // 骨架控制变量
    scrollTop: 0, // 回到顶部变量
    desigenrPickerVisible: false, // 指派设计师弹窗
    desigenrPickerItemList: [], //被指派设计师列表
    fileDataList: [], // 资料列表
    seriesList: [], // 系列列表
    task_id: null,
    task_leader: null,
  },

  // 补充函数 文件名称省略
  shortenFileName(filename, frontLen = 10, backLen = 8) {
    if (filename.length <= frontLen + backLen) {
      return filename; // 太短就不省略
    }
    return filename.substring(0, frontLen) + "..." + filename.substring(filename.length - backLen);
  },
  // 回到顶部
  onToTop(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },
  // 后端设计师分配人与设计师图稿请求
  dataDesignerRequest() {
    const that = this;
    wx.request({
      url: url + '/wbo/user-roles/',
      method: "GET",
      success(res) {
        if (res.statusCode === 200) {
          const data = res.data;
          let desigenrPickerItemList = [];
          data.forEach(item => {
            const role = item.role.filter(item => item.name === "TD");
            if (role.length !== 0) {
              desigenrPickerItemList.push({
                label: item.name,
                value: item.id,
              })
            }
          })
          that.setData({
            desigenrPickerItemList: desigenrPickerItemList
          })
        }
      }
    })
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
    const line_plan_type = dataList.line_plan_type; // 当前的LP类型是TD还是AIE
    const task_list = dataList.task_list; // task数据
    const trends_images = dataList.trends_images; // 资料
    const series_names_list = dataList.series_names_list; // 系列
    task_list.forEach(item => {
      const task_id = item.id; // taks 的id
      const task_leader = item.leader || "未指派";
      const task_code = item.code || "未生成"; // taks 的code
      const task_series = item.series || "未指定"; // 系列
      const task_title = item.title || "未填写"; // 名称
      const task_material = item.material || "未选择"; // 材质
      const task_desigenr = item.name || "未指派"; // 指派的设计师
      arrangeData.push({
        line_plan_type: line_plan_type,
        task_id: task_id,
        task_code: task_code,
        task_series: task_series,
        task_title: task_title,
        task_material: task_material,
        task_desigenr: task_desigenr,
        task_leader: task_leader
      })
      // 资料处理
      let fileDataList = [];
      trends_images.forEach(item => {
        const filename = item.imageURL.split("/").pop();
        const shortName = this.shortenFileName(filename);
        fileDataList.push({
          "file_id": item.id,
          "file_name": shortName,
        })
      });
      // 系列处理
      let seriesList = [];
      series_names_list.forEach(item => {
        seriesList.push({
          "value": item.id,
          "label": item.name,
        })
      });
      this.setData({
        seriesList: seriesList,
        fileDataList: fileDataList
      })
    })
    return arrangeData.sort((a, b) => a.task_id - b.task_id); // 进行排序
  },
  // 数据分页显示处理
  dataRequest(mode) {
    const that = this;
    const apiUserName = that.data.apiUserName;
    const line_plan_id = that.data.line_plan_id;
    utils.LoadDataList({
      page: that,
      data: {
        type: "get_create_lp_data",
        username: apiUserName,
        lp_id: line_plan_id
      },
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
    const line_plan_id = options.lineplan_id; // lp的id
    that.setData({
      userRole: userRole,
      userName: userName,
      apiUserName: apiUserName,
      line_plan_id: line_plan_id,
    });
    this.dataDesignerRequest();
    this.dataRequest("init");
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
  // 指派设计师 
  onAllocateClick(e) {
    const task_id = e.target.dataset.task_id;
    const task_leader = e.target.dataset.task_leader;
    this.setData({
      task_id: task_id,
      task_leader: task_leader,
      desigenrPickerVisible: true
    });
  },
  // 关闭 AIT筛选器
  onAllocateClosePicker() {
    this.setData({
      task_id: null,
      task_leader: null,
      desigenrPickerVisible: false,
    });
  },
  // 提交 AIT筛选器
  onAllocatePickerChange(e) {
    const that = this;
    const userName = that.data.userName;
    const task_id = that.data.task_id;
    const task_leader = that.data.task_leader;
    const {
      value,
      label
    } = e.detail;
    if (task_leader !== userName) {
      utils.showToast(that, "权限不足无法指派", "warning");
      return;
    };
    utils.UpdateData({
      page: that,
      data: {
        "type": "update_create_lp_task",
        "task_id": task_id,
        "name": value[0],
        "username": userName
      },
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const updatedData = that.data.Data.map(item => {
          if (item.task_id === task_id) {
            item["task_desigenr"] = label;
          };
          return item;
        })
        that.setData({
          Data: updatedData
        });
        utils.showToast(that, "提交成功")
        that.onAllocateClosePicker();
      } else {
        utils.showToast(that, "提交失败", "error");
      }
    })
  },
})