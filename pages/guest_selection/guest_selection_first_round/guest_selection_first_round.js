const utils = require('../../../utils/util')
Page({
  data: {
    lineplan_id: null, // 存储的lp id值
    development_id: null, // 开发案id
    Data: [], // 页面渲染数据存储列表
    allData: [], // 全部的数据
    pageSize: 6, // 每次加载几个
    currentIndex: 0, // 当前加载到
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
    userName: null, // 用户名
    userRloe: null,  // 角色名
    addLPData: {
      project_id: null,
      type: "addLp",
      lp_type: 0,
      title: null,
      client: null,
      year: null,
      season: null,
      is_new_development: 1,
      username: "管理员",
    }, // 新增lp
    // 筛选框变量-模板
    dropdownArtwork: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部图稿',
      },
      {
        value: 'NAQ',
        label: '宁安琪',
      }
      ],
    },
    // 筛选框变量-客户选中
    dropdownSelected: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部状态',
      },
      {
        value: 'bot_selected',
        label: '未选',
      },
      {
        value: 'selected',
        label: '已选中',
      },
      {
        value: 'eliminate',
        label: '已淘汰',
      },

      ],
    },
    // 增加图稿
    popupAddVisible: false,
    // 指派设计师
    pickerDesignerVisible: false,
    pickerDesignerValue: [],
    pickerDesignerTitile: "指派设计师",
    pickerDesignerItemList: [{
      label: '王五',
      value: 'A'
    },
    {
      label: '李四',
      value: 'B'
    },
    {
      label: '张明',
      value: 'B'
    },
    {
      label: '赵玉',
      value: 'B'
    },
    {
      label: '张三',
      value: 'B'
    },
    {
      label: '李明博',
      value: 'B'
    },
    ],
    // 上传图稿变量
    imageFileList: [],
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    const taskTimeLineData = {}; // 时间线数据
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      const task_id = task_list[index].id;
      const be_chosen2 = task_list[index].be_chosen2;
      const whether_to_proof = task_list[index].whether_to_proof;
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
        be_chosen2: be_chosen2,
        whether_to_proof: whether_to_proof
      }
      if (be_chosen2 === 1) {
        data_dict["be_chosen2_text"] = "已选中";
      } else if (be_chosen2 === 2) {
        data_dict["be_chosen2_text"] = "未选中";
      } else {
        data_dict["be_chosen2_text"] = "未标记";
      }
      if (whether_to_proof === 1) {
        data_dict["whether_to_proof_text"] = "是";
      } else {
        data_dict["whether_to_proof_text"] = "否";
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
        // kyle最终标记
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
        // 第一条时间线的id 1-5步都是按照第一条时间线操作
        data_dict["timeline_id"] = timeline_id;
        data_dict["timeline_type"] = timeline_type; // 类型
      }
      if (data_dict["confirmed"] !== 3) { // kyle 标记如果是3，kyle终选择ok
        continue
      }
      taskTimeLineData[`${task_id}`] = timeLineData; // 时间线数据
      arrangeData.push(data_dict);
    }
    return {
      arrangeData,
      taskTimeLineData
    }; // 返回整理的结构体
  },
  // 后端请求
  dataRequest(mode) {
    const that = this;
    const lineplan_id = that.data.lineplan_id;
    utils.LoadDataList({
      page: that,
      data: { type: "getTaskByLinePlan", username: "admin", "lp_id": lineplan_id, },
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
  onLoad(options) {
    const that = this;
    const lineplan_id = options.lineplan_id || ''; // 首页跳转后的存储的id值
    const development_id = options.development_id || ''; // 开发案id
    that.setData({
      lineplan_id: lineplan_id, // 记录全部的id数据
      development_id: development_id
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
  // 打开评论框
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
  // 输入评论-双向记录
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 弹窗-评论-关闭（包含提交功能）
  onCloseDialog(e) {
    const that = this;
    const {
      dialogValue,
      timeline_id,
      task_id,
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
          "username": "admin", // 参数需要修改
          "name": "管理员", // 参数需要修改
          "comment": dialogValue
        },
        message: "提交评论完成"
      })
      // 更新时间线
      utils.updateTimeLine(that, task_id, timeline_id, dialogValue, userName);
    } else if (action === 'cancel') {
      const theme = "warning"
      const message = "评论取消"
      utils.showToast(that, message, theme);
    }
    this.setData({
      dialogVisible: false,
      dialogId: null
    });
  },
  // 修改当前选中图稿状态
  onModifyArtworkStatus(e) {
    const that = this;
    const {
      taskId,
      contentStatus
    } = e.currentTarget.dataset;
    let task_data = {
      "type": "update_task",
      "task_id": taskId,
      "username": "admin",
    }
    if (contentStatus === "Y") {
      wx.showModal({
        title: '提示',
        content: '是否标记"已选中"',
        success(res) {
          if (res.confirm) {
            task_data["be_chosen2"] = 1
            utils.UpdateData({
              page: that,
              data: task_data,
              message: "图稿标记选中"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["be_chosen2"] = 1;
                item["be_chosen2_text"] = "已选中";
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
            task_data["be_chosen2"] = 2
            utils.UpdateData({
              page: that,
              data: task_data,
              message: "图稿标记未选中"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["be_chosen2"] = 2;
                item["be_chosen2_text"] = "未选中";
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
  // 是否画工厂稿
  onFactoryDraftStatus(e) {
    const that = this;
    const {
      taskId,
      contentStatus
    } = e.currentTarget.dataset;
    let task_data = {
      "type": "update_task",
      "task_id": taskId,
      "username": "admin",
    }
    if (contentStatus === "Y") {
      wx.showModal({
        title: '提示',
        content: '是否标记"需要工厂稿"',
        success(res) {
          if (res.confirm) {
            task_data["whether_to_proof"] = 1
            utils.UpdateData({
              page: that,
              data: task_data,
              message: '标记完成'
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["whether_to_proof"] = 1;
                item["whether_to_proof_text"] = "是";
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
        content: '是否标记"不需要工厂稿"',
        success(res) {
          if (res.confirm) {
            task_data["whether_to_proof"] = 0
            utils.UpdateData({
              page: that,
              data: task_data,
              message: "标记完成"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.id === taskId) {
                item["whether_to_proof"] = 0;
                item["whether_to_proof_text"] = "否";
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
  // 新增lp
  onOpenAddLP(e) {
    this.setData({
      popupAddVisible: true
    });
  },
  // 新增内部关闭按钮
  onCloseAddDialog(e) {
    const that = this;
    this.setData({
      popupAddVisible: false
    });
  },
  // 通用输入处理
  handleInput(e) {
    const field = e.currentTarget.dataset.field; // 获取字段名（year/month）
    this.setData({
      [`addLPData.${field}`]: e.detail.value // 动态更新对应字段
    });
  },
  // 新增内部提交按钮
  onSubmitAddDialog(e) {
    const that = this;
    const development_id = that.data.development_id;
    that.setData({
      'addLPData.project_id': development_id // 使用路径语法
    });
    const { title, client, year, season } = that.data.addLPData;
    if (!title || !client || !year || !season) {
      utils.showToast(that, "数据不能为空", "error");
      return
    } else {
      utils.UpdateData({
        page: that,
        data: that.data.addLPData,
        message: "新增LP成功"
      })
      that.setData({
        popupAddVisible: false
      });
    }

  },






  /* 未完成 */
  // 新增内部的下拉框
  onDesignerPicker(e) {
    this.setData({
      pickerDesignerVisible: true
    });
  },
  // 新增设计师筛选器-确定 
  onPickerDesignerChange(e) {
    /*
      pickerDesignerVisible：筛选器显示变量
      pickerDesignerValue： 选中的值
    */
    const that = this;
    const {
      value,
      label
    } = e.detail;
    console.log(value, label);
    this.setData({
      pickerDesignerVisible: false,
      pickerDesignerValue: value,
      pickerDesignerTitile: label
    });
    const message = `设计师已指派${label}`
    utils.showToast(that, message);
  },
  // 新增设计师筛选器-关闭 
  onCloseDesignerPicker(e) {
    /*
      pickerDesignerVisible：筛选器显示变量
    */
    this.setData({
      pickerDesignerVisible: false,
    });
  },
  // 上传图稿函数
  imageAdd(e) {
    const {
      imageFileList
    } = this.data;
    const {
      files
    } = e.detail;
    console.log();
    // 方法1：选择完所有图片之后，统一上传，因此选择完就直接展示
    this.setData({
      imageFileList: [...imageFileList, ...files], // 此时设置了 fileList 之后才会展示选择的图片
    });
    // 方法2：每次选择图片都上传，展示每次上传图片的进度
    // files.forEach(file => this.uploadFile(file))
  },
  // 图稿删除函数
  imageRemove(e) {
    const {
      index
    } = e.detail;
    const {
      imageFileList
    } = this.data;
    imageFileList.splice(index, 1);
    this.setData({
      imageFileList,
    });
  },

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