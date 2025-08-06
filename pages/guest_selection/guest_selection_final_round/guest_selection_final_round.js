const app = getApp(); // 用户信息
const utils = require('../../../utils/util')
const swiperImages = [
  'https://picsum.photos/800/600?random=1',  // 横版
  // 物品类
  'https://picsum.photos/700/900?random=5',  // 长竖版
];
Page({
  data: {
    // 骨架屏变量
    skeletonLoading: true,
    groupId: null, // 首页跳转后的存储的id值
    // 筛选框变量-模板
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
        }
      ],
    },
    // 筛选框变量-客户选中
    dropdownSelected: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部状态',
        },
        {
          value: 'bot_selected',
          label: '未选',
        },
        {
          value: 'selected',
          label: '已完成',
        },
        {
          value: 'eliminate',
          label: '未选中',
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
    // 单选框变量
    radioValue: "0",
  },
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const groupId = options.groupId; // 首页跳转后的存储的id值
    wx.showLoading({ title: '正在加载...', });
    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        skeletonLoading: false,
      })
    }, 2000)
  },
  // 下拉菜单
  onArtworkChange(e) {
    this.setData({
      'dropdownArtwork.value': e.detail.value,
    });
  },
  // 下拉菜单
  onAssessChange(e) {
    this.setData({
      'dropdownAssess.value': e.detail.value,
    });
  },
  // 轮播图函数 - 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    utils.ImagesPreview(el,that);
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
  //  回到顶部-实时监听滚动距离
  onPageScroll(e) {
    /*
      scrollTop：记录滚动距离
    */
    this.setData({
      scrollTop: e.scrollTop
    });
  },
  // 单选框
  onRadioChange(e) {
    /*
      radioValue：记录选中的单选值
    */
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
      const message = "取消客户选稿";
      utils.showToast(that, message, theme);
    } else {
      // 如果选择小幅度修改，需要输入评估建议
      if (radioValue) {
        const message = "修改客户选稿";
        utils.showToast(that, message);
      } else {
        const message = "提交客户选稿";
        utils.showToast(that, message);
      }
      this.setData({ radioValue: selectedradioValue });
    }
  },
})