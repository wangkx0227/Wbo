const utils = require('../../../utils/util')
Page({
  data: {
    lineplan_id: null, // 存储的lp id值
    Data: [], // 页面渲染数据存储列表
    allData: [], // 全部的数据
    filteredData: [], // 筛选后的数据
    pageSize: 6, // 每次加载
    currentIndex: 0, // 当前加载到
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
    dropdownAssess: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部评估',
      },
      {
        value: 1,
        label: '可生产',
      },
      {
        value: 2,
        label: '小幅度修改',
      },
      {
        value: 3,
        label: '不具备可行性',
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
      const fmr2 = task_list[index].fmr2;
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIT_designer1,
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
        // kyle标记 3 舍弃 1 保留
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
        // shelley 1可生产 2修改 3不具备可行性
        data_dict["confirmed2"] = task_list[index].timeline_list[i].confirmed2;
        // 第一条时间线的id 1-5步都是按照第一条时间线操作
        data_dict["timeline_id"] = timeline_id;
        data_dict["timeline_type"] = timeline_type; // 图稿类型
      }
      // kyle 标记如果时2舍弃，就直接过滤掉
      if (data_dict["confirmed"] === 2) {
        continue
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
    return { arrangeData, taskTimeLineData }; // 返回整理的结构体
  },
  // 后端请求
  dataRequest(mode) {
    const that = this;
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
        filteredData: arrangeData, // 筛选后的数据
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
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const lineplan_id = options.lineplan_id || ''; // 首页跳转后的存储的id值
    that.setData({
      lineplan_id: lineplan_id, // 记录全部的id数据
      userRole: userRole,
      userName: userName
    })
    this.dataRequest('init');
    this.fmrRequest();
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
  // 提交 FMR筛选器
  onPickerChange(e) {
    /*
      pickerVisible：筛选器显示变量
      pickerValue： 选中的值
    */
    const that = this;
    const task_id = that.data.task_id;
    const userName = that.data.userName;
    const {
      value,
      label
    } = e.detail;
    const data = {
      "type": "update_task",
      "task_id": task_id,
      "username": userName,
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
    const userName = that.data.userName;  // 当前登录用户
    // 点击的选中的
    const selectedValue = e.detail.value;
    // 修改前的数据
    const confirmed2 = e.currentTarget.dataset.confirmed2;
    const timeline_id = e.currentTarget.dataset.timelineId;
    const task_id = e.currentTarget.dataset.taskId;
    let data = {
      "type": "update_timeline",
      "timeLine_id": timeline_id,
      "username": userName,
      "name": userName,
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
      if (selectedValue === "2" || selectedValue === "3") {
        this.setData({
          dialogVisible: true,
          timeline_id: timeline_id,
          task_id: task_id,
          submit_data: data, // 提交的数据
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
    if (selectedValue === "1" || isConfirmedEqual) {
      const updatedData = that.data.Data.map(item => {
        if (item.timeline_id === timeline_id) {
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
      timeline_id,
      task_id,
      userName,
      submit_data
    } = that.data; // 输入的评论的数据
    submit_data["comment"] = dialogValue;
    submit_data["name_str"] = userName;
    const action = e.type;
    if (action === 'confirm') {
      if (!dialogValue) {
        const theme = "warning"
        const message = "无评审无法提交"
        utils.showToast(that, message, theme);
        return;
      }
      utils.UpdateData({
        page: that,
        data: submit_data,
        message: "提交评估建议"
      });
      // 更新时间线
      utils.updateTimeLine(that, task_id, timeline_id, dialogValue, userName);
      // 刷新数据
      const updatedData = that.data.Data.map(item => {
        if (item.timeline_id === timeline_id) {
          item["confirmed2"] = submit_data["confirmed2"];
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
      timeline_id: null
    });
    setTimeout(() => {
      this.setData({
        dialogValue: "",
      })
    }, 500)
  },
  // 下拉菜单-材质
  onMaterialChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterStatusValue = that.data.filterStatusValue;
    const filtered = that.data.allData.filter(item => {
      const matchMaterial = (value === 'all') ? true : item.texture === value;
      const matchStatus = (filterStatusValue === 'all') ? true : item.confirmed2 === filterStatusValue;
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
  // 下拉菜单-评估
  onAssessChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterMaterialValue = that.data.filterMaterialValue;
    const filtered = that.data.allData.filter(item => {
      const matchStatus = (value === 'all') ? true : item.confirmed2 === value;
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
      'dropdownAssess.value': value,
    });
  },
})