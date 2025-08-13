const utils = require('../../../utils/util')
const tool = new utils.CommentTool();
let commentStr = tool.init();
Page({
  data: {
    Data: [], // 存储数据
    tabBar: null,// 记录切换值
    pageSize: 1, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的id值
    loadedIdList: [], // 已经读取渲染到页面的ID
    skeletonLoading: true, // 骨架屏控制变量
    noMoreData: false,    // 数据是否全部加载完毕
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    // 回到顶部变量
    scrollTop: 0,
    // 筛选框变量-1
    dropdownDesigner: {
      value: 'all',
      options: [
        {
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
      options: [
        {
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
    popupTitle: "", // 评论的标题
    // 评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
    // 评审单选框变量
    radioValue: "",
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
        fmr:task_list[index].fmr,
      }
      const timeline_list = task_list[index].timeline_list;
      for (let i = timeline_list.length - 1; i >= 0; i--) {
        if (i < timeline_list.length - 1) {
          continue; // 跳过倒序的第2个及以后
        }
        const comment = task_list[index].timeline_list[i].comment; // 全部的评论
        const kyle_conmment = tool.get(comment, "Kyle"); // 只获取kyle的评论
        data_dict["comment"] = kyle_conmment; // kyle评审信息
        const confirmed = task_list[index].timeline_list[i].confirmed; // 标记舍弃(3)还是保留(1)
        data_dict["confirmed"] = confirmed;
        if (confirmed === 0) {
          data_dict["confirmed_text"] = "未标记";
        } else if (confirmed === 1) {
          data_dict["confirmed_text"] = "保留";
        } else if (confirmed === 3) {
          data_dict["confirmed_text"] = "舍弃";
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
        data_dict["timeline_id"] = task_list[index].timeline_list[i].id;
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
  // 查看评论弹窗函数 - 关闭
  onClosePopup(e) {
    this.setData({
      popupVisible: e.detail.visible,
    });
    // 延迟清空内容，确保动画完成后执行
    setTimeout(() => {
      this.setData({
        popupValue: "",
        popupTitle: ""
      });
    }, 300);
  },
  // 查看评论弹窗函数 - 唤起
  onOpenPopup(e) {
    /*
      id: 当条记录的id
      designer_comments: 当前按钮的属性,用来确定点击内容
      commentator: 评论的内容
      assessStatus: 状态(只针对 可行性评估 shelley与fmr) 1(可生产) 2(小幅度修改 有评论内容) 3(不具备生产条件)
    */
    const that = this;
    const { id, commentator, commentStatus } = e.currentTarget.dataset; // 点击按钮的存储的数据 id 点击id designer_comments 点击的自评文字
    if (commentStatus !== "1") {
      const theme = "warning"
      const message = "未选择评估选项"
      utils.showToast(that, message, theme);
      return
    }
    if (commentator === "shelley") {
      this.setData({ popupValue: "无内容", popupTitle: "Shelley 评估" });
    } else if (commentator === "fmr") {
      this.setData({ popupValue: "无内容", popupTitle: "FMR 评估" });
    }
    this.setData({ popupVisible: true, popupValue: "无内容" }); /// 触发弹窗
  },
  // 弹窗-评论输入-打开
  onOpenDialog(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ dialogVisible: true });
  },
  // 弹窗-评论-双向绑定
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 弹窗-评论-关闭（包含提交功能）
  onCloseDialog(e) {
    const { dialogValue } = this.data; // 输入的评论的数据
    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      console.log("提交数据");
      this.setData({ radioValue: "1" }); // 选中单选框
    } else if (action === 'cancel') {
      console.log("提交取消");
    }
    this.setData({ dialogVisible: false, dialogValue: "" });
  },
  // 单选框
  onRadioChange(e) {
    /*
      radioValue：记录选中的单选值
    */
    const that = this;
    const selectedradioValue = e.detail.value;
    const radioValue = that.data.radioValue;
    // 如果选中的点选框的值等于记录的值那么就取消
    if (selectedradioValue === radioValue) {
      this.setData({ radioValue: null });
      const theme = "warning"
      const message = "取消最终评审"
      utils.showToast(that, message, theme);
    } else {
      // 如果选择小幅度修改，需要输入评估建议
      if (selectedradioValue === "1") {
        this.setData({ dialogVisible: true });
      } else {
        if (radioValue) {
          const message = "修改最终评审";
          utils.showToast(that, message);
        } else {
          const message = "提交最终评审";
          utils.showToast(that, message);
        }
        this.setData({ radioValue: selectedradioValue });
      }
    }
  },
})