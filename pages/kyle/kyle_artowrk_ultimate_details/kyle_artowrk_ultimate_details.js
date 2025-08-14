const utils = require('../../../utils/util')
Page({
  data: {
    Data: [], // 存储数据
    tabBar: null, // 记录切换值
    pageSize: 1, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的id值
    loadedIdList: [], // 已经读取渲染到页面的ID
    skeletonLoading: true, // 骨架屏控制变量
    noMoreData: false, // 数据是否全部加载完毕
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    // 回到顶部变量
    scrollTop: 0,
    // 时间线抽屉
    popupTimeLineVisible: false,
    taskTimeLineData: {}, // 存储时间线的数据
    timeLineValue: [], // 具体查看的时间线
    // 筛选框变量-1
    dropdownDesigner: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部',
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
    // 筛选框变量-2
    dropdownStatus: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部状态',
      },
      {
        value: 'discard',
        label: '舍弃',
      },
      {
        value: 'modify',
        label: '轻微修改',
      },
      {
        value: 'reserve',
        label: '保留',
      },
      ],
    },
    // 设计师自评弹窗控制变量
    popupVisible: false,
    popupValue: "", // 评论的内容
    // 评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
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
        fmr: task_list[index].fmr,
        fmr2: fmr2, // 这是fmr选中状态
      }
      if (fmr2 === 1) {
        data_dict["fmr2_text"] = "可生产";
      } else if (fmr2 === 2) {
        data_dict["fmr2_text"] = "不可生产";
      }  else {
        data_dict["fmr2_text"] = "未标记";
      }
      let timeLineData = []; // 时间线存储数据
      const timeline_list = task_list[index].timeline_list;
      for (let i = 0; i < timeline_list.length; i++) {
        const image_list = task_list[index].timeline_list[i].image_list;
        const picture_list = image_list.length === 0 ? [] : image_list.map(img => image_url + img.imageURL);
        const timeline_id = task_list[index].timeline_list[i].id;
        const timeline_type  = task_list[index].timeline_list[i].timeline_type;
        if (i > 0) {
          let timeline_type_text = ""
          if(timeline_type === 1){
            timeline_type_text = "设计稿"
          }else{
            timeline_type_text = "生产稿"
          }
          timeLineData.push({
            "id": timeline_id, // id 
            "time": task_list[index].timeline_list[i].time, // 提交时间
            "name": task_list[index].timeline_list[i].name, // 提交人
            "comment": task_list[index].timeline_list[i].comment, // 评论内容
            "picture_list": picture_list, // 图片
            "timeline_type_text":timeline_type_text // 图稿类型
          })
          continue; // 跳过
        }
        const confirmed = task_list[index].timeline_list[i].confirmed; // kyle 标记
        const confirmed2 = task_list[index].timeline_list[i].confirmed2; // shelley 标记
        data_dict["confirmed2"] = confirmed2;
        data_dict["confirmed"] = confirmed;
        // 最终选择字段
        if (confirmed === 3) {
          data_dict["confirmed_text"] = "保留";
        } else if (confirmed === 4) {
          data_dict["confirmed_text"] = "舍弃";
        } else {
          data_dict["confirmed_text"] = "未标记";
        }
        if (confirmed2 === 1) {
          data_dict["confirmed2_text"] = "可生产";
        } else if (confirmed === 2) {
          data_dict["confirmed2_text"] = "需要小幅度修改";
        } else if (confirmed === 3) {
          data_dict["confirmed2_text"] = "不具备可行性";
        } else {
          data_dict["confirmed2_text"] = "未标记";
        }
        data_dict["picture_list"] = picture_list;
        data_dict["timeline_id"] = timeline_id;
      }
      // 初选 kyle 标记如果时2舍弃，就直接过滤掉
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
      // refresh刷新时重置，其他的数据追加
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
  onLoad(options) {
    const that = this;
    const tabBarValue = options.tabBarValue || ''; // 切换时的tab值
    const groupIdList = JSON.parse(options.groupIdList || '[]'); // 首页跳转后的存储的id值
    that.setData({
      allIdList: groupIdList, // 记录全部的id数据
      tabBar: tabBarValue, // 记录当前tab属性
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
  //  实时监听滚动距离，把这个值传给回到顶部的按钮，让它知道是否应该出现
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop
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
  // 修改当前图稿状态-终审
  onModifyArtworkStatus(e) {
    const that = this;
    const {
      timelineid,
      contentStatus
    } = e.currentTarget.dataset;
    if (contentStatus === "Y") {
      wx.showModal({
        title: '提示',
        content: '是否"保留"当前图稿',
        success(res) {
          if (res.confirm) {
            utils.UpdateData({
              page: that,
              data: {
                "type": "update_timeline",
                "timeLine_id": timelineid,
                "username": "admin",
                "name": "管理员",
                "confirmed": 3
              },

              message: "图稿已标记保留"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.timeline_id === timelineid) {
                item["confirmed"] = 3;
                item["confirmed_text"] = "保留";
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
        content: '是否"舍弃"当前图稿',
        success(res) {
          if (res.confirm) {
            utils.UpdateData({
              page: that,
              data: {
                "type": "update_timeline",
                "timeLine_id": timelineid,
                "username": "admin",
                "name": "管理员",
                "confirmed": 4
              },
              message: "图稿已标记舍弃"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.timeline_id === timelineid) {
                item["confirmed"] = 3;
                item["confirmed_text"] = "舍弃";
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
  // 弹窗-评论-打开
  onOpenDialog(e) {
    const {
      timelineid
    } = e.currentTarget.dataset;
    this.setData({
      dialogVisible: true,
      dialogId: timelineid
    });
  },
  // 弹窗-评论-双向绑定
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
        const message = "无评审无法提交"
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
        message: "评审记录完成"
      })
    } else if (action === 'cancel') {
      const theme = "warning"
      const message = "评审记录取消"
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

  // 下拉菜单-设计师
  onDesignerChange(e) {
    this.setData({
      'dropdownDesigner.value': e.detail.value,
    });
  },
  // 下拉菜单-状态
  onStatusChange(e) {
    this.setData({
      'dropdownStatus.value': e.detail.value,
    });
  },
})