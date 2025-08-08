const app = getApp(); // 用户信息
const utils = require('../../../utils/util')

const swiperImages = [
  'https://picsum.photos/800/600?random=1',  // 横版
  // 物品类
  'https://picsum.photos/700/900?random=5',  // 长竖版
];
Page({
  data: {
    Data: [], // 页面渲染数据存储列表
    pageSize: 1, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的ID值列表
    loadedIdList: [], // 已经读取渲染到页面的ID
    skeletonLoading: true, // 骨架屏控制变量

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
          value: 'reserve',
          label: '保留',
        },
      ],
    },
    // 轮播图变量
    current: 0, // 当前轮播在哪一项（下标）默认第0个索引
    autoplay: false, // 是否启动自动播放
    duration: 500, // 滑动动画时长
    interval: 5000, // 轮播间隔时间，只有开启自动播放才有用
    swiperImages, // 轮播图 url变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    // 回到顶部变量
    scrollTop: 0,
    // 设计师自评弹窗控制变量
    popupVisible: false,
    popupValue: "",
    // 评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    console.log(dataList);
    return arrangeData
  },
  // 页面初次加载数据
  onLoad(options) {
    const groupIdList = JSON.parse(options.groupIdList || '[]'); // 首页跳转后的存储的id值
    this.setData({
      allIdList: groupIdList, // 记录全部的id数据
    })
    const { allIdList, pageSize, currentIndex } = this.data;
    const nextIds = allIdList.slice(currentIndex, currentIndex + pageSize); // 取读取id的范围
    // 读取数据
    console.log(nextIds);
    utils.LoadDataList({
      page: this,
      data: { type: "getTaskByLinePlan", username: "admin", "lp_id": "10468", },
      mode: 'init'
    }).then(list => { // list 就是data数据
      const arrangeData = this.dataStructure(list);
      this.setData({
        Data: this.data.Data.concat(arrangeData)
      })
    });
    // 记录已经读取的id和读取id的位置
    this.setData({
      loadedIdList: this.data.loadedIdList.concat(nextIds),
      currentIndex: this.data.currentIndex + nextIds.length
    })
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
  // 轮播图函数 - 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    utils.ImagesPreview(el, that);
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
  // 设计师评论弹窗函数 - 关闭
  onClosePopup(e) {
    this.setData({
      popupVisible: e.detail.visible,
      popupValue: "",
    });
  },
  // 设计师评论弹窗函数 - 唤起
  onOpenPopup(e) {
    const { id, designer_comments } = e.currentTarget.dataset; // 点击按钮的存储的数据 id 点击id designer_comments 点击的自评文字
    this.setData({ popupVisible: true, popupValue: "无内容" }); /// 触发弹窗
  },
  // 弹窗-评论-打开
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
    const that = this;
    const { dialogValue } = this.data; // 输入的评论的数据
    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      const message = "评审完成"
      utils.showToast(that, message);
    } else if (action === 'cancel') {
      const theme = "warning"
      const message = "评审取消"
      utils.showToast(that, message, theme);
    }
    this.setData({ dialogVisible: false, dialogValue: "" });
  },
  // 修改当前图稿状态（舍弃与保留，默认都是保留）
  onModifyArtworkStatus(e) {
    const that = this;
    const { id, contentStatus } = e.currentTarget.dataset;
    if (contentStatus === "Y") {
      wx.showModal({
        title: '提示',
        content: '是否"保留"当前图稿',
        success(res) {
          if (res.confirm) {
            // 发送请求
            const message = "图稿已标记保留"
            utils.showToast(that, message);
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
            // 发送请求
            const message = "图稿已标记舍弃"
            utils.showToast(that, message);
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
})