const utils = require('../../../utils/util')
Page({
  data: {
    Data: [], // 页面渲染数据存储列表
    pageSize: 2, // 每次加载几个ID
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
    // 评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
    // 查看评论
    popupVisible: false,
    popupValue: "",
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
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      const fmr = task_list[index].fmr;
      const fmr2 = task_list[index].fmr2; // 当前fmr的状态
      // 指派的FMR不是简老师就跳过，实际需要根据当前登录FMR用户确定
      if (fmr !== "简老师") {
        continue;
      }
      let data_dict = {
        id: task_list[index].id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
        fmr: fmr || "暂未指派FMR", // 当前指派的fmr
        fmr2: fmr2 // 当前fmr的状态
      }
      // 需要增加一个判断当前用户
      const timeline_list = task_list[index].timeline_list;
      for (let i = 0; i < timeline_list.length; i++) {
        if (i > 0) {
          break;
        }
        let conmment = "";
        // 因为fmr判断了，所以状态记录 = 3，因为当评论会生成新的时间线，所以要取当前上一条时间线的评论
        if (fmr2 === 3) { 
          conmment = task_list[index].timeline_list[i + 1].comment;
        } else {
          conmment = task_list[index].timeline_list[i].comment;
        }
        data_dict["conmment"] = conmment;
        const image_list = task_list[index].timeline_list[i].image_list;
        if (image_list.length === 0) {
          data_dict["picture_list"] = [];
        } else {
          let picture_list = []
          for (let img_num = 0; img_num < image_list.length; img_num++) {
            picture_list.push(image_url + image_list[img_num].imageURL)
          }
          data_dict["picture_list"] = picture_list;
        }

        // kyle标记 3 舍弃 1 保留
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
        // 第一条时间线的id 1-5步都是按照第一条时间线操作
        data_dict["timeline_id"] = task_list[index].timeline_list[i].id;
      }
      // kyle 标记如果时3舍弃，就直接过滤掉
      if (data_dict["confirmed"] === 3) {
        continue
      }
      arrangeData.push(data_dict);
    }
    return arrangeData; // 返回整理的结构体
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
      const arrangedData = results.flatMap(list => that.dataStructure(list));
      // refresh刷新时重置，其他的数据追加
      if (mode === 'refresh') {
        that.setData({
          Data: arrangedData,
        })
      } else {
        that.setData({
          Data: that.data.Data.concat(arrangedData),
        })
      }
      that.setData({
        // 只记录访问成功的id
        loadedIdList: that.data.loadedIdList.concat(successIds),
        currentIndex: that.data.currentIndex + successIds.length
      });
    })
  },
  /* 生命周期函数--监听页面加载 */
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
  // 评估建议单选框
  onRadioChange(e) {
    /*
      radioValue：记录选中的单选值
    */
    const that = this;
    // 点击的选中的
    const selectedValue = e.detail.value;
    // 修改前的数据
    const fmr2 = e.currentTarget.dataset.fmr2;
    const task_id = e.currentTarget.dataset.taskId;
    const timelineid = e.currentTarget.dataset.timelineid;
    // 提交fmr的状态
    let task_data = {
      "type": "update_task",
      "task_id": task_id,
      "username": "admin",
      "fmr2": selectedValue,
    }
    const isConfirmedEqual = selectedValue.toString() === fmr2.toString();
    // 如果选中的点选框的值等于记录的值那么就取消
    if (isConfirmedEqual) {
      task_data["fmr2"] = 0;
      utils.UpdateData({
        page: that,
        data: task_data,
        message: "取消评估建议",
        theme: "warning"
      });
    } else {
      if (selectedValue === "3") { // 只进行评价
        that.setData({
          dialogVisible: true,
          timelineid: timelineid,
          task_id: task_id
        });
      } else {
        if (fmr2 !== 0) {
          utils.UpdateData({
            page: that,
            data: task_data,
            message: "修改评估建议"
          });
        } else {
          utils.UpdateData({
            page: that,
            data: task_data,
            message: "提交评估建议"
          });
        }
      }
    }
    if (selectedValue !== "3" || isConfirmedEqual) {
      const updatedData = that.data.Data.map(item => {
        if (item.id === task_id) {
          item["fmr2"] = task_data["fmr2"]
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
  // 填写弹窗-关闭（包含提交功能）
  onCloseDialog(e) {
    const that = this;
    const {
      dialogValue,
      timelineid,
      task_id
    } = that.data; // 输入的评论的数据
    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      if (!dialogValue) {
        const theme = "warning"
        const message = "无评审无法提交"
        utils.showToast(that, message, theme);
        return;
      }
      // 提交fmr的状态
      let task_data = {
        "type": "update_task",
        "task_id": task_id,
        "username": "admin",
        "fmr2": 3, // 将状态提交为3，在小端进行标记显示
      }
      // 提交评论修改记录
      let timeline_data = {
        "type": "update_timeline",
        "timeLine_id": timelineid,
        "username": "admin",
        "name": "管理员",
        "comment": dialogValue, // 携带其他人原来的评论
      }
      utils.UpdateData({
        page: that,
        data: timeline_data,
        toastShow: false
      });
      utils.UpdateData({
        page: that,
        data: task_data,
        message: "提交评估建议"
      });
      const updatedData = that.data.Data.map(item => {
        if (item.id === task_id) {
          item["fmr2"] = 3;
        }
        if (item.timeline_id === timelineid) {
          item["conmment"] = dialogValue;
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
      timelineid: null,
      task_id: null
    });
  },
  // 查看评论弹窗 - 关闭
  onClosePopup(e) {
    this.setData({
      popupVisible: e.detail.visible,
    });
    // 延迟清空内容，确保动画完成后执行
    setTimeout(() => {
      this.setData({
        popupValue: ""
      });
    }, 300);
  },
  // 查看评论弹窗 - 查看
  onOpenPopup(e) {
    const that = this;
    const {
      conmmentStatus,
      conmment,
    } = e.currentTarget.dataset;
    if (conmmentStatus.toString() !== "3") {
      utils.showToast(that, "当前评估没有评论", "warning");
      return
    }
    that.setData({
      popupVisible: true,
      popupValue: conmment
    }); // 触发弹窗
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
})