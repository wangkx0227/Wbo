const utils = require('../../../utils/util')
Page({
  data: {
    Data: [], // 页面渲染数据存储列表
    pageSize: 1, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的ID值列表
    loadedIdList: [], // 已经读取渲染到页面的ID
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
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
        be_chosen2: be_chosen2
      }
      if (be_chosen2 === 1) {
        data_dict["be_chosen2_text"] = "已选中";
      } else if (be_chosen2 === 2) {
        data_dict["be_chosen2_text"] = "未选中";
      } else {
        data_dict["be_chosen2_text"] = "未标记";
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
        // kyle最终标记
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
        // 第一条时间线的id 1-5步都是按照第一条时间线操作
        data_dict["timeline_id"] = timeline_id;
      }
      // kyle 标记如果时2舍弃，就直接过滤掉
      if (data_dict["confirmed"] !== 3) {
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
      const taskTimeLineData = Object.assign({},
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
          taskTimeLineData: {
            ...that.data.taskTimeLineData,
            ...taskTimeLineData
          }
        })
      }
      that.setData({
        // 只记录访问成功的id
        loadedIdList: that.data.loadedIdList.concat(successIds),
        currentIndex: that.data.currentIndex + successIds.length
      });
    })
  },
  onLoad(options) {
    const that = this;
    const groupIdList = JSON.parse(options.groupIdList || '[]'); // 首页跳转后的存储的id值
    that.setData({
      allIdList: groupIdList, // 记录全部的id数据
    })
    this.multiIdRequest('init');
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
  onDummyTouchMove() {},
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
  // 打开评论框
  onOpenDialog(e) {
    const {
      timelineid
    } = e.currentTarget.dataset;
    this.setData({
      dialogVisible: true,
      dialogId: timelineid
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
      dialogId
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
          "timeLine_id": dialogId,
          "username": "admin", // 参数需要修改
          "name": "管理员", // 参数需要修改
          "comment": dialogValue
        },
        message: "提交评论完成"
      })
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
              data:task_data,
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







  // 新增图稿
  onOpenAddArtwork(e) {
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
  // 新增内部提交按钮
  onSubmitAddDialog(e) {
    const that = this;
    this.setData({
      popupAddVisible: false
    });
    console.log(11);
    const message = "新增图稿成功";
    utils.showToast(that, message);
  },
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