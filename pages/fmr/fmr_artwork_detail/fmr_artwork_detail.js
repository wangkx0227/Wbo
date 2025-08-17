const utils = require('../../../utils/util')
Page({
  data: {
    lineplan_id: null, // 存储的lp id值
    Data: [], // 页面渲染数据存储列表
    allData: [], // 全部的数据
    pageSize: 6, // 每次加载几个
    currentIndex: 0, // 当前加载到第几个
    skeletonLoading: true, // 骨架屏控制变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false, // 数据是否全部加载完毕
    userRole: null, // 用户角色
    userName: null, // 用户名称
    // 回到顶部变量
    scrollTop: 0,
    // 评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
    // 时间线抽屉
    popupTimeLineVisible: false,
    taskTimeLineData: {}, // 存储时间线的数据
    timeLineValue: [], // 具体查看的时间线
    // 筛选框变量-模板
    dropdownArtwork: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部图稿',
      },
      ],
    },
    // 筛选框变量-评估
    dropdownAssess: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部评估',
      },
      {
        value: 'discard',
        label: '可生产',
      },
      {
        value: 'reserve',
        label: '小幅度修改',
      },
      {
        value: 'reserve',
        label: '不具备可行性',
      },
      ],
    },
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    const userName = this.data.userName;
    const taskTimeLineData = {}; // 时间线数据
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      const fmr = task_list[index].fmr;
      const fmr2 = task_list[index].fmr2; // 当前fmr的状态
      const task_id = task_list[index].id;
      // 指派的FMR不是简老师就跳过，实际需要根据当前登录FMR用户确定 需要增加一个判断当前用户
      if (fmr !== userName) {
        continue;
      }
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIT_designer1 || "暂未指定",
        fmr: fmr || "暂未指派FMR", // 当前指派的fmr
        fmr2: fmr2 // 当前fmr的状态
      }
      if (fmr2 === 1) {
        data_dict["fmr2_text"] = "可生产";
      } else if (fmr2 === 2) {
        data_dict["fmr2_text"] = "不可生产";
      } else {
        data_dict["fmr2_text"] = "未标记";
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
            "name": task_list[index].timeline_list[i].name || "无提交人", // 提交人
            "comment": task_list[index].timeline_list[i].comment, // 评论内容
            "picture_list": picture_list, // 图片
            "timeline_type_text": timeline_type_text // 图稿类型
          })
          continue; // 跳过
        }

        data_dict["picture_list"] = picture_list;
        data_dict["timeline_id"] = timeline_id; // 第一条时间线的id
        data_dict["timeline_type"] = timeline_type; // 图稿类型
        // kyle标记 3 舍弃 1 保留
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
      }
      // kyle 标记如果时2舍弃，就直接过滤掉
      if (data_dict["confirmed"] === 2) {
        continue
      }
      taskTimeLineData[`${task_id}`] = timeLineData; // 时间线数据
      arrangeData.push(data_dict);
    }
    return { arrangeData, taskTimeLineData }; // 返回整理的结构体
  },
  // 后端请求
  dataRequest(mode) {
    const that = this;
    const lineplan_id = that.data.lineplan_id;
    const uameName = that.data.userName;
    utils.LoadDataList({
      page: that,
      data: { type: "getTaskByLinePlan", username: uameName, "lp_id": lineplan_id, },
      mode: mode
    }).then(list => { // list 就是data数据
      const allResults = that.dataStructure(list);
      const arrangeData = allResults.arrangeData; // 展示数据
      const taskTimeLineData = allResults.taskTimeLineData; // 时间线
      that.setData({
        allData: arrangeData,
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
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const that = this;
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const lineplan_id = options.lineplan_id || ''; // 首页跳转后的存储的id值
    that.setData({
      lineplan_id: lineplan_id, // 记录全部的id数据
      userRole:userRole,
      userName:userName
    })
    that.dataRequest('init');
  },
  // 轮播图函数 - 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    // utils.ImagesPreview(el, that);
    utils.onSwiperImagesTap(el, that);
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
  // 弹窗-评论-打开
  onOpenDialog(e) {
    const {
      timelineId,
      taskId
    } = e.currentTarget.dataset;
    this.setData({
      dialogVisible: true,
      timeline_id: timelineId,
      task_id: taskId
    });
  },
  // 填写评论-双向绑定
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 弹窗-评论-关闭（包含提交功能）
  onCloseDialog(e) {
    const that = this;
    const {
      task_id,
      timeline_id,
      dialogValue,
      userName
    } = this.data; // 输入的评论的数据

    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      if (!dialogValue) {
        const theme = "warning"
        const message = "无评论无法提交"
        utils.showToast(that, message, theme);
        return;
      }
      utils.UpdateData({
        page: that,
        data: {
          "type": "update_timeline",
          "timeLine_id": timeline_id,
          "username": userName, // 参数需要修改
          "name": userName, // 参数需要修改
          "comment": dialogValue
        },
        message: "评估建议完成"
      })
      // 更新时间线数据
      utils.updateTimeLine(that, task_id, timeline_id, dialogValue, userName);
    } else if (action === 'cancel') {
      const theme = "warning"
      const message = "评估建议取消"
      utils.showToast(that, message, theme);
    }
    this.setData({
      dialogVisible: false,
      dialogId: null
    });
    setTimeout(() => {
      this.setData({
        dialogValue: "",
      })
    }, 500)
  },
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
  // 修改当前图稿状态
  onModifyArtworkStatus(e) {
    const that = this;
    const userName = that.data.userName;
    const { taskId, contentStatus } = e.currentTarget.dataset;
    let task_data = {
      "type": "update_task",
      "order": true,
      "task_id": taskId,
      "username": userName,
    }
    if (contentStatus === "Y") {
      wx.showModal({
        title: '提示',
        content: '是否标记"可生产"当前图稿',
        success(res) {
          if (res.confirm) {
            task_data["fmr2"] = 1
            utils.UpdateData({
              page: that,
              data: task_data,
              message: "标记保留"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["fmr2"] = 1;
                item["fmr2_text"] = "可生产";
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
        content: '是否"不可生产"当前图稿',
        success(res) {
          if (res.confirm) {
            task_data["fmr2"] = 2
            utils.UpdateData({
              page: that,
              data: task_data,
              message: "标记保留"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["fmr2"] = 2;
                item["fmr2_text"] = "不可生产";
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
  // 打开抽屉，查看历史时间线
  onOpenHistoryTimeLine(e) {
    const { taskId } = e.currentTarget.dataset;
    const taskTimeLineData = this.data.taskTimeLineData;
    const timeLineValue = taskTimeLineData[`${taskId}`];
    this.setData({ popupTimeLineVisible: true, timeLineValue: timeLineValue });
  },
  // 关闭抽屉
  onCloseHistoryTimeLine(e) {
    // 打开弹窗，显示upload组件
    this.setData({ popupTimeLineVisible: false });
    setTimeout(() => {
      this.setData({ timeLineValue: [] });
    }, 500)
  },
  // 空方法，避免抽屉的滚动
  onDummyTouchMove() { },


  // 下拉菜单-图稿
  onArtworkChange(e) {
    this.setData({
      'dropdownArtwork.value': e.detail.value,
    });
  },
  // 下拉菜单-评估
  onAssessChange(e) {
    this.setData({
      'dropdownAssess.value': e.detail.value,
    });
  },


})