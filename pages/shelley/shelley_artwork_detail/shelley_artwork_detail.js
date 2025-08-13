const utils = require('../../../utils/util')
Page({
  data: {
    Data: [], // 页面渲染数据存储列表
    pageSize: 1, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的ID值列表
    loadedIdList: [], // 已经读取渲染到页面的ID
    skeletonLoading: true, // 骨架屏控制变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false, // 数据是否全部加载完毕
    userRole: null, // 用户角色
    userName: null, // 用户名称
    // 回到顶部变量
    scrollTop: 0,
    // 填写评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
    // 筛选器
    pickerVisible: false,
    pickerItemList: [], // fmr全部的用户列表的数据
    // 时间线抽屉
    popupTimeLineVisible: false,
    taskTimeLineData: {}, // 存储时间线的数据
    timeLineValue: [], // 具体查看的时间线
    // 筛选框变量-图稿
    dropdownArtwork: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部图稿',
      },
      {
        value: 'NAQ',
        label: '宁安琪',
      },
      {
        value: 'LSL',
        label: '黎善玲',
      },
      {
        value: 'HYJ',
        label: '韩奕君'
      }
      ],
    },
    // 筛选框变量-指派
    dropdownAssign: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部指派',
      },
      {
        value: 'discard',
        label: '未指派',
      },
      {
        value: 'reserve',
        label: '已指派',
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
    const taskTimeLineData = {}; // 时间线数据
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      const task_id = task_list[index].id;
      const fmr2 = task_list[index].fmr2;
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
        fmr: task_list[index].fmr || "暂未指派FMR", // 当前指派的fmr
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
        if (i > 0) {
          timeLineData.push({
            "id": timeline_id, // id 
            "time": task_list[index].timeline_list[i].time, // 提交时间
            "name": task_list[index].timeline_list[i].name, // 提交人
            "comment": task_list[index].timeline_list[i].comment, // 评论内容
            "picture_list": picture_list, // 图片
          })
          continue; // 跳过
        }
        data_dict["picture_list"] = picture_list;
        // kyle标记 3 舍弃 1 保留
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
        // shelley 1可生产 2修改 3不具备可行性
        data_dict["confirmed2"] = task_list[index].timeline_list[i].confirmed2;
        // 第一条时间线的id 1-5步都是按照第一条时间线操作
        data_dict["timeline_id"] = timeline_id;
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
  // 请求后端接口数据处理
  multiIdRequest(mode) {
    const that = this;
    // 读取id
    const nextIds = utils.readIdStructure(that);
    // 判断，如果nextIds的长度小于预设pageSize的长度，就totalRequests重置，避免加载动作卡死
    let totalRequests = that.data.pageSize;
    if (nextIds.length !== that.data.pageSize) {
      totalRequests = nextIds.length;
    }
    // 实例化请求类
    const loader = new utils.MultiRequestLoader(that, totalRequests);
    // 读取数据
    let successIds = []; // 用于记录成功的 id 
    const promises = nextIds.map(id => {
      return loader.request({
        data: {
          type: "getTaskByLinePlan",
          username: "admin",
          "lp_id": id,
        },
        mode: mode,
      }).then(res => {
        successIds.push(id); // 用于记录成功的 id
        return res;
      }).catch(err => {
        console.warn(`ID ${id} 请求失败`, err);
        return null; // 保证 Promise.all 能跑完
      });
    })
    Promise.all(promises).then(results => {
      const allResults = results.flatMap(list => that.dataStructure(list));
      const arrangeData = allResults.flatMap(item => item.arrangeData); // 展示数据
      const taskTimeLineData = Object.assign(
        {},
        ...allResults.map(x => x.taskTimeLineData)
      );
      if (mode === 'refresh') {
        that.setData({
           Data: arrangeData,
          taskTimeLineData: taskTimeLineData,
        })
      } else {
        that.setData({
          Data: that.data.Data.concat(arrangeData),
          taskTimeLineData: { ...that.data.taskTimeLineData, ...taskTimeLineData }
        })
      }
      that.setData({
        // 只记录访问成功的id
        loadedIdList: that.data.loadedIdList.concat(successIds),
        currentIndex: that.data.currentIndex + successIds.length
      });
    })
  },
  // 获取 fmr 用户数据
  fmrRequest() {
    const that = this;
    const data = {
      "type": "get_names_by_role",
      "role_name": "FMR",
      "username": "admin"
    }
    utils.LoadDataList({
      page: that,
      data: data,
      showLoading: false,
      showSkeleton: false,
    }).then(list => { // list 就是data数据
      let fmrData = [];
      for (let i = 0; i < list.length; i++) {
        fmrData.push({
          label: list[i],
          value: list[i]
        })
      }
      that.setData({
        pickerItemList: fmrData
      })
    });
  },
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const that = this;
    const groupIdList = JSON.parse(options.groupIdList || '[]'); // 首页跳转后的存储的id值
    that.setData({
      allIdList: groupIdList, // 记录全部的id数据
    })
    this.multiIdRequest('init');
    this.fmrRequest();
  },
  // 轮播图函数 - 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    utils.ImagesPreview(el, that);
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
  // 关闭 FMR筛选器
  onClosePicker(e) {
    /*
      pickerVisible：筛选器显示变量
    */
    this.setData({
      pickerVisible: false,
    });
  },
  // 打开 FMR筛选器
  onOpenPicker(e) {
    /*
      pickerVisible：筛选器显示变量
      实际情况下需要加入一个默认值
    */
    const {
      taskId
    } = e.currentTarget.dataset; // task id值
    this.setData({
      pickerVisible: true,
      task_id: taskId
    });
  },
  // 提交 FMR筛选器 - 需要小调整
  onPickerChange(e) {
    /*
      pickerVisible：筛选器显示变量
      pickerValue： 选中的值
    */
    const that = this;
    const task_id = that.data.task_id;
    const {
      value,
      label
    } = e.detail;
    const data = {
      "type": "update_task",
      "task_id": task_id,
      "username": "admin",
      "fmr": value[0],
      "fmr2": 0,
    }
    this.setData({
      pickerVisible: false,
      task_id: null,
    });
    const message = `FMR已指派${label}`
    utils.UpdateData({
      page: that,
      data: data,
      message: message
    });
    // 修改新的fmr时，重置之前的选中
    const updatedData = that.data.Data.map(item => {
      if (item.id === task_id) {
        item["fmr"] = value[0];
        item["fmr2"] = 0;
      }
      return item;
    })
    that.setData({
      Data: updatedData
    });
  },
  // 页面上拉刷新 - 用于页面重置
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return; // 如果正在加载更多，则禁止下拉刷新
    // 重置 currentIndex 让它从头开始访问
    this.setData({
      currentIndex: 0,
      noMoreData: false,
      isLoadingReachMore: false
    })
    this.multiIdRequest('refresh');
  },
  // 页面上拉触底事件的处理函数-用于加载更多数据
  onReachBottom() {
    // 如果在下拉刷新，禁止滚动加载
    if (this.data.isDownRefreshing || this.data.noMoreData) return;
    this.multiIdRequest('more');
    if (this.data.currentIndex === this.data.allIdList.length) {
      this.setData({
        noMoreData: true
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
  // 评估建议单选框
  onRadioChange(e) {
    const that = this;
    // 点击的选中的
    const selectedValue = e.detail.value;
    // 修改前的数据
    const confirmed2 = e.currentTarget.dataset.confirmed2;
    const timelineid = e.currentTarget.dataset.timelineid;
    let data = {
      "type": "update_timeline",
      "timeLine_id": timelineid,
      "username": "admin",
      "name": "管理员",
      "confirmed2": selectedValue,
    }
    const isConfirmedEqual = selectedValue.toString() === confirmed2.toString();
    // 如果选中的点选框的值等于记录的值那么就取消
    if (isConfirmedEqual) {
      data["confirmed2"] = 0;
      utils.UpdateData({
        page: that,
        data: data,
        message: "取消评估建议",
        theme: "warning"
      });
    } else {
      // 如果选择小幅度修改，需要输入评估建议
      if (selectedValue === "2") {
        this.setData({
          dialogVisible: true,
          timelineid: timelineid
        });
      } else {
        if (confirmed2 !== 0) {
          utils.UpdateData({
            page: that,
            data: data,
            message: "修改评估建议"
          });
        } else {
          utils.UpdateData({
            page: that,
            data: data,
            message: "提交评估建议"
          });
        }
      }
    }
    if (selectedValue !== "2" || isConfirmedEqual) {
      const updatedData = that.data.Data.map(item => {
        if (item.timeline_id === timelineid) {
          item["confirmed2"] = data["confirmed2"];
        }
        return item;
      })
      that.setData({
        Data: updatedData
      });
    }
  },
  // 填写评论-双向绑定
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 填写弹窗-关闭（包含评论提交功能）
  onCloseDialog(e) {
    const that = this;
    const {
      dialogValue,
      timelineid
    } = that.data; // 输入的评论的数据
    const action = e.type;
    if (action === 'confirm') {
      if (!dialogValue) {
        const theme = "warning"
        const message = "无评审无法提交"
        utils.showToast(that, message, theme);
        return;
      }
      const data = {
        "type": "update_timeline",
        "timeLine_id": timelineid,
        "username": "admin",
        "name": "管理员",
        "confirmed2": 2,
        "comment": dialogValue, // 携带其他人原来的评论
      }
      utils.UpdateData({
        page: that,
        data: data,
        message: "提交评估建议"
      });
      // 刷新数据
      const updatedData = that.data.Data.map(item => {
        if (item.timeline_id === timelineid) {
          item["confirmed2"] = 2;
        }
        return item;
      })
      that.setData({
        Data: updatedData
      });
    } else if (action === 'cancel') {
      utils.showToast(that, "取消评估建议", "warning");
    }
    this.setData({
      dialogVisible: false,
      dialogValue: "",
      timelineid: null
    });
  },


  // 下拉菜单-图稿
  onArtworkChange(e) {
    this.setData({
      'dropdownArtwork.value': e.detail.value,
    });
  },
  // 下拉菜单-指派
  onAssignChange(e) {
    this.setData({
      'dropdownAssign.value': e.detail.value,
    });
  },
  // 下拉菜单-评估
  onAssessChange(e) {
    this.setData({
      'dropdownAssess.value': e.detail.value,
    });
  },
})