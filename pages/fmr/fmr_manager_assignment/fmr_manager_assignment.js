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
    // 首页跳转后的存储的id值
    groupId: null,
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
      ],
    },
    // 筛选框变量-评估
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
    // 筛选器
    pickerVisible: false,
    pickerValue: [],
    pickerLabel: "暂未指派FMR",
    pickerItemList: [
      { label: '王五', value: 'A' },
      { label: '李四', value: 'B' },
      { label: '张明', value: 'B' },
      { label: '赵玉', value: 'B' },
      { label: '张三', value: 'B' },
      { label: '李明博', value: 'B' },
    ],
  },
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const groupId = options.groupId; // 首页跳转后的存储的id值
    // wx.showLoading({ title: '正在加载...', });
    // setTimeout(() => {
    //   wx.hideLoading();
    //   this.setData({
    //     skeletonLoading: false,
    //   })
    // }, 2000)
  },
  // 生命周期函数--监听页面初次渲染完成
  onReady() { },
  // 生命周期函数--监听页面显示
  onShow() { },
  //生命周期函数--监听页面隐藏
  onHide() { },
  // 生命周期函数--监听页面卸载
  onUnload() { },
  // 用户点击右上角分享
  onShareAppMessage() { },
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

  // 轮播图函数 - 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const { index } = e.detail;
    const that = this;
    // const urls = e.currentTarget.dataset.images || [];   // 所有图片对象数组
    // const index = e.currentTarget.dataset.index;         // 当前图片索引
    // //把图片对象数组提取成 URL 数组
    // const urlList = urls.map(img => img.image_url);
    const swiperImages = this.data.swiperImages; // 假数据
    const current = swiperImages[index];
    if (!current || !swiperImages.length) {
      const theme = "error"
      const message = "无法预览图片"
      utils.showToast(that, message, theme);
      return;
    }
    wx.previewImage({
      current,
      urls: swiperImages
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
  // 筛选器-确定 
  onPickerChange(e) {
    /*
      pickerVisible：筛选器显示变量
      pickerValue： 选中的值
    */
    const that = this;
    const { value, label } = e.detail;
    this.setData({
      pickerVisible: false,
      pickerValue: value,
      pickerLabel: label
    });
    const message = `FMR已指派${label}`
    utils.showToast(that, message);
  },
  // 关闭 筛选器
  onClosePicker(e) {
    /*
      pickerVisible：筛选器显示变量
    */
    this.setData({ pickerVisible: false, });
  },
  // 打开 筛选器
  onOpenPicker() {
    /*
      pickerVisible：筛选器显示变量
      实际情况下需要加入一个默认值
    */
    this.setData({ pickerVisible: true });
  },

})