const utils = require('../../../utils/util')
// 评论筛选工具
const tool = new utils.CommentTool();
let commentStr = tool.init();
Page({
  data: {
    Data: [], // 页面渲染数据存储列表
    pageSize: 2, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的ID值列表
    loadedIdList: [], // 已经读取渲染到页面的ID
    skeletonLoading: true, // 骨架屏控制变量
    // 筛选框变量-图稿
    dropdownArtwork: {
      value: 'all',
      options: [
        {
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
      options: [
        {
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
      options: [
        {
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
    // 轮播图变量
    current: 0, // 当前轮播在哪一项（下标）默认第0个索引
    autoplay: false, // 是否启动自动播放
    duration: 500, // 滑动动画时长
    interval: 5000, // 轮播间隔时间，只有开启自动播放才有用
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    // 回到顶部变量
    scrollTop: 0,
    // 查看评论弹窗控制变量
    popupVisible: false,
    popupValue: "",
    // 填写评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
    // 筛选器
    pickerVisible: false,
    pickerValue: [],
    pickerLabel: "暂未指派FMR",
    pickerItemList: [
      { label: '王五', value: '王五' },
      { label: '李四', value: '李四' },
      { label: '张明', value: '张明' },
      { label: '赵玉', value: '赵玉' },
      { label: '张三', value: '张三' },
      { label: '李明博', value: '李明博' },
    ]
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      let data_dict = {
        id: task_list[index].id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
      }
      const timeline_list = task_list[index].timeline_list;
      for (let i = timeline_list.length - 1; i >= 0; i--) {
        if (i < timeline_list.length - 1) {
          continue; // 跳过倒序的第2个及以后
        }
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
        const conmment = task_list[index].timeline_list[i].comment; // 全部的评论
        const shelley_conmment = tool.get(conmment, "Shelley"); // 只获取Shelley的评论
        const fmr_conmment = tool.get(conmment, "FMR"); // 只获取FMR的评论
        data_dict["conmment"] = conmment; // 全部评论，需要在shelley评论时携带
        data_dict["shelley_conmment"] = shelley_conmment;
        data_dict["fmr_conmment"] = fmr_conmment;
        // kyle标记 3 舍弃 1 保留
        data_dict["confirmed"] = task_list[index].timeline_list[i].confirmed;
        // shelley 1可生产 2修改 3不具备可行性
        data_dict["confirmed2"] = task_list[index].timeline_list[i].confirmed2;
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
        data: { type: "getTaskByLinePlan", username: "admin", "lp_id": id, },
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
  // 评估建议单选框
  onRadioChange(e) {
    /*
      radioValue：记录选中的单选值
    */
    const that = this;
    // 点击的选中的
    const selectedValue = e.detail.value;
    // 修改前的数据
    const confirmed2 = e.currentTarget.dataset.confirmed2;
    const timelineid = e.currentTarget.dataset.timelineid;
    const conmment = e.currentTarget.dataset.conmment;
    let data = {
      "type": "update_timeline",
      "timeLine_id": timelineid,
      "username": "admin",
      "name": "管理员",
      "confirmed2": selectedValue,
      // "comment": tool.set(conmment, "Shelley", "")
    }
    const isConfirmedEqual = selectedValue.toString() === confirmed2.toString();
    // 如果选中的点选框的值等于记录的值那么就取消
    if (isConfirmedEqual) {
      data["confirmed2"] = 0;
      utils.UpdateData({ page: that, data: data, message: "取消评估建议", theme: "warning" });
    } else {
      // 如果选择小幅度修改，需要输入评估建议
      if (selectedValue === "2") {
        this.setData({ dialogVisible: true, timelineid: timelineid, conmment: conmment });
      } else {
        // 如果当前存在评论，需要将评论修改为空
        const shelley_conmment = tool.get(conmment, "Shelley");
        if(shelley_conmment){
          data["comment"] =  tool.set(conmment, "Shelley", "");
        }
        if (confirmed2 !== 0) {
          utils.UpdateData({ page: that, data: data, message: "修改评估建议" });
        } else {
          utils.UpdateData({ page: that, data: data, message: "提交评估建议" });
        }
      }
    }
    if (selectedValue !== "2" || isConfirmedEqual) {
      const updatedData = that.data.Data.map(item => {
        if (item.timeline_id === timelineid) {
          item["confirmed2"] = data["confirmed2"];
          item["conmment"] = tool.set(conmment, "Shelley", "");
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
    const { dialogValue, timelineid, conmment } = that.data; // 输入的评论的数据
    // 确定格式
    const kyle_conmment = tool.get(conmment,'Kyle');
    // 设置评论格式
    let commentStr = tool.set(commentStr,'Kyle',kyle_conmment);
    // 包含shelley的评论
    const shelley_conmment = tool.set(commentStr, "Shelley", dialogValue);
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
        "comment": shelley_conmment, // 携带其他人原来的评论
      }
      utils.UpdateData({ page: that, data: data, message: "提交评估建议" });
      const updatedData = that.data.Data.map(item => {
        if (item.timeline_id === timelineid) {
          item["confirmed2"] = 2;
          item["shelley_conmment"] = dialogValue;
          item["conmment"] = shelley_conmment;
        }
        return item;
      })
      that.setData({
        Data: updatedData
      });
    } else if (action === 'cancel') {
      utils.showToast(that, "取消评估建议", "warning");
    }
    this.setData({ dialogVisible: false, dialogValue: "", timelineid: null });
  },
  // 查看评论弹窗 - 关闭
  onClosePopup(e) {
    /*
      popupVisible: 关闭弹窗
      popupValue: 清空评论内容
      popupTitle: 清空评论的标题
    */
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
    /*
      id: 当条记录的id
      commentContent: 评论内容
      popupVisible: 唤起弹窗
      commentStatus: 评论的状态
    */
    const that = this;
    const { shelleyConmment, conmmentStatus, fmrConmment, clickObject } = e.currentTarget.dataset;
    if (conmmentStatus.toString() !== "2") {
      const theme = "warning"
      const message = "当前评估没有评论"
      utils.showToast(that, message, theme);
      return
    }
    if (clickObject === "fmr") {
      this.setData({
        popupValue: fmrConmment
      })
    } else {
      this.setData({
        popupValue: shelleyConmment
      })
    }
    that.setData({ popupVisible: true }); // 触发弹窗
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
    this.setData({ pickerVisible: false, });
  },
  // 打开 FMR筛选器
  onOpenPicker(e) {
    /*
      pickerVisible：筛选器显示变量
      实际情况下需要加入一个默认值
    */
    const { taskId } = e.currentTarget.dataset; // task id值
    this.setData({ pickerVisible: true, task_id: taskId });
  },
  // 提交 FMR筛选器 - 需要小调整
  onPickerChange(e) {
    /*
      pickerVisible：筛选器显示变量
      pickerValue： 选中的值
    */
    const that = this;
    const task_id = that.data.task_id;
    const { value, label } = e.detail;
    const data = {
      "type": "update_task",
      "task_id": task_id,
      "username": "admin",
      "fmr": value[0],
    }
    this.setData({
      pickerVisible: false,
      task_id: null,
      pickerValue: value,
      pickerLabel: label
    });
    const message = `FMR已指派${label}`
    utils.UpdateData({ page: that, data: data, message: message });
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


  // 页面上拉刷新 - 用于页面重置
  onPullDownRefresh() {
    console.log("下拉刷新触发");
    // 如果正在加载更多，则禁止下拉刷新
    if (this.data.isLoadingReachMore) return;
    this.setData({ isDownRefreshing: true });
    // 模拟数据加载
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
      this.setData({
        isDownRefreshing: false, // 修改状态
      });
    }, 1500);
  },
  // 页面上拉触底事件的处理函数-用于加载更多数据
  onReachBottom() {
    // 如果在下拉刷新，禁止滚动加载
    if (this.data.isDownRefreshing || this.data.noMoreData) return;
    this.setData({ isLoadingReachMore: true });
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
      this.setData({
        isLoadingReachMore: false, // 修改状态
        // noMoreData:true // 如果数据已经读取完毕,就变为true,下拉就没有效果了
      });
    }, 1500);

  },



})