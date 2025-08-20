const utils = require('../../../utils/util')
Page({
  data: {
    lineplan_id: null, // 存储的lp id值
    Data: [], // 页面渲染数据存储列表
    allData: [], // 全部的数据
    filteredData: [], // 筛选后的数据
    pageSize: 6, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    skeletonLoading: true, // 骨架屏控制变量
    // 时间线抽屉
    popupTimeLineVisible: false,
    taskTimeLineData: {}, // 存储时间线的数据
    timeLineValue: [], // 具体查看的时间线
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false, // 数据是否全部加载完毕
    scrollTop: 0, // 回到顶部变量
    dialogVisible: false, // 评论弹出层变量
    dialogValue: "", // 评论
    dialogId: null, // 当前点击的id
    userRole: null, // 用户角色
    userName: null, // 用户名称
    // 筛选框变量-材质
    dropdownMaterial: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部材质',
        },
      ],
    },
    filterMaterialValue: "all", // 筛选存储变量
    // 筛选框变量-评估
    dropdownSelected: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部选中',
      },
      {
        value: 1,
        label: '已选中',
      },
      {
        value: 2,
        label: '未选中',
      },
      ],
    },
    filterStatusValue: 'all',  // 筛选存储变量
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    let material_list = [];
    const taskTimeLineData = {}; // 时间线数据
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      const task_id = task_list[index].id;
      const be_chosen2 = task_list[index].be_chosen2;
      const be_ordered2 = task_list[index].be_ordered2;
      if (be_chosen2 !== 1) {  // 第一轮选稿没有选中
        continue;
      }
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIT_designer1,
        be_ordered2: be_ordered2
      }
      if (be_ordered2 === 1) {
        data_dict["be_ordered2_text"] = "已完成";
      } else if (be_ordered2 === 2) {
        data_dict["be_ordered2_text"] = "未选中";
      } else {
        data_dict["be_ordered2_text"] = "未标记";
      }
      let timeLineData = []; // 时间线存储数据
      const timeline_list = task_list[index].timeline_list;
      for (let i = 0; i < timeline_list.length; i++) {
        const image_list = task_list[index].timeline_list[i].image_list;
        const picture_list = image_list.length === 0 ? [] : image_list.map(img => image_url + img.imageURL);
        const timeline_id = task_list[index].timeline_list[i].id;
        const timeline_type = task_list[index].timeline_list[i].timeline_type;
        if (i > 0) {
          let timeline_type_text = ""
          if (timeline_type === 1) {
            timeline_type_text = "设计稿"
          } else {
            timeline_type_text = "生产稿"
          }
          timeLineData.push({
            "id": timeline_id, // id 
            "time": task_list[index].timeline_list[i].time, // 提交时间
            "name": task_list[index].timeline_list[i].name, // 提交人
            "comment": task_list[index].timeline_list[i].comment, // 评论内容
            "picture_list": picture_list, // 图片
            "timeline_type_text": timeline_type_text // 图稿类型
          })
          continue; // 跳过
        }
        data_dict["picture_list"] = picture_list;
        // kyle最终标记
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
        // 第一条时间线的
        data_dict["timeline_id"] = timeline_id;
      }
      taskTimeLineData[`${task_id}`] = timeLineData; // 时间线数据
      material_list.push(data_dict["texture"].trim());
      arrangeData.push(data_dict);
    }
    // 筛选条件加入
    const material = utils.filterDataProcess(material_list);
    const options = this.data.dropdownMaterial.options;
    // 只有 筛选框的列表为1（内部默认有一条数据）才会添加
    if (options.length === 1) {
      this.setData({
        "dropdownMaterial.options": options.concat(material)
      })
    }
    return {
      arrangeData,
      taskTimeLineData
    }; // 返回整理的结构体
  },
  // 后端请求
  dataRequest(mode) {
    const that = this;
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const lineplan_id = that.data.lineplan_id;
    const userName = that.data.userName;
    utils.LoadDataList({
      page: that,
      data: { type: "getTaskByLinePlan", username: userName, "lp_id": lineplan_id, },
      mode: mode
    }).then(list => { // list 就是data数据
      const allResults = that.dataStructure(list);
      const arrangeData = allResults.arrangeData; // 展示数据
      const taskTimeLineData = allResults.taskTimeLineData; // 时间线
      that.setData({
        allData: arrangeData,
        filteredData: arrangeData,
        taskTimeLineData: taskTimeLineData,
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
  onLoad(options) {
    const that = this;
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const lineplan_id = options.lineplan_id || ''; // 首页跳转后的存储的id值
    that.setData({
      lineplan_id: lineplan_id, // 记录全部的id数据
      userRole: userRole,
      userName: userName
    })
    that.dataRequest('init');
  },
  // 回到顶部
  onToTop(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },
  //  回到顶部-实时监听滚动距离
  onPageScroll(e) {
    /*
      scrollTop：记录滚动距离
    */
    this.setData({
      scrollTop: e.scrollTop
    });
  },
  // 轮播图函数 - 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    // utils.ImagesPreview(el, that);
    utils.onSwiperImagesTap(el, that);
  },
  // 打开抽屉，查看历史时间线
  onOpenHistoryTimeLine(e) {
    const {
      taskId
    } = e.currentTarget.dataset;
    const taskTimeLineData = this.data.taskTimeLineData;
    const timeLineValue = taskTimeLineData[`${taskId}`];
    this.setData({
      popupTimeLineVisible: true,
      timeLineValue: timeLineValue
    });
  },
  // 关闭抽屉
  onCloseHistoryTimeLine(e) {
    // 打开弹窗，显示upload组件
    this.setData({
      popupTimeLineVisible: false
    });
    setTimeout(() => {
      this.setData({
        timeLineValue: []
      });
    }, 500)
  },
  // 空方法，避免抽屉的滚动
  onDummyTouchMove() { },
  // 页面上拉刷新
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
  // 修改当前选中图稿状态
  onModifyArtworkStatus(e) {
    const that = this;
    const userName = that.data.userName;
    const {
      taskId,
      contentStatus
    } = e.currentTarget.dataset;
    let task_data = {
      "type": "update_task",
      "task_id": taskId,
      "order": true,
      "username": userName,
    }
    if (contentStatus === "Y") {
      wx.showModal({
        title: '提示',
        content: '是否标记"已选中"',
        success(res) {
          if (res.confirm) {
            task_data["be_ordered2"] = 1
            utils.UpdateData({
              page: that,
              data: task_data,
              message: "图稿标记选中"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["be_ordered2"] = 1;
                item["be_ordered2_text"] = "已完成";
              }
              return item;
            })
            that.setData({
              Data: updatedData
            });
          } else if (res.cancel) {
            // 取消
            const theme = "warning"
            const message = "用户已取消操作"
            utils.showToast(that, message, theme);
          }
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '是否标记"未选中"',
        success(res) {
          if (res.confirm) {
            task_data["be_ordered2"] = 2
            utils.UpdateData({
              page: that,
              data: task_data,
              message: "图稿标记未选中"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["be_ordered2"] = 2;
                item["be_ordered2_text"] = "未选中";
              }
              return item;
            })
            that.setData({
              Data: updatedData
            });
          } else if (res.cancel) {
            // 取消
            const theme = "warning"
            const message = "用户已取消操作"
            utils.showToast(that, message, theme);
          }
        }
      })
    }

  },

  // 下拉菜单-材质
  onMaterialChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterStatusValue = that.data.filterStatusValue;
    const filtered = that.data.allData.filter(item => {
      const matchMaterial = (value === 'all') ? true : item.texture === value;
      const matchStatus = (filterStatusValue === 'all') ? true : item.be_ordered2 === filterStatusValue;
      return matchMaterial && matchStatus;
    });
    that.setData({
      filteredData: filtered, // 记录筛选数据
      Data: [],
      currentIndex: 0,
      noMoreData: false,
      filterMaterialValue: value
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
      'dropdownMaterial.value': value,
    });
  },
  // 下拉菜单-选中
  onSelectedChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterMaterialValue = that.data.filterMaterialValue;
    const filtered = that.data.allData.filter(item => {
      const matchStatus = (value === 'all') ? true : item.be_ordered2 === value;
      const matchMaterial = (filterMaterialValue === 'all') ? true : item.texture === filterMaterialValue;
      return matchMaterial && matchStatus;
    });
    that.setData({
      filteredData: filtered, // 记录筛选数据
      Data: [],
      currentIndex: 0,
      noMoreData: false,
      filterStatusValue: value
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
      'dropdownSelected.value': value,
    });
  },

})