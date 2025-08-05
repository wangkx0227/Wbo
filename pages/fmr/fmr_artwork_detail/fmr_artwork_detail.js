const app = getApp(); // 用户信息
const utils = require('../../../utils/util')
const swiperImages = [
  'https://xcx.1bizmail.com:8153/static/images/wpb_images/D51_Resin_Ornament_CS25-LYD-095_Ur7N7rc.jpg',  // 横版
  // 物品类
  'https://xcx.1bizmail.com:8153/static/images/wpb_images/D51_Resin_Ornament_CS25-HHR-129_JkE4FgU.jpg',  // 长竖版
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
    swiperImages, // 轮播图 url变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    // 回到顶部变量
    scrollTop: 0,
    // 评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
    // 单选框变量
    radioValue: "0",
  },
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const groupId = options.groupId; // 首页跳转后的存储的id值
    console.log(groupId);
    wx.showLoading({ title: '正在加载...', });
    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        skeletonLoading: false,
      })
    }, 2000)
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

  // 填写评论-双向绑定
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 填写弹窗-关闭（包含提交功能）
  onCloseDialog(e) {
    const that = this;
    const { dialogValue, radioValue } = that.data; // 输入的评论的数据
    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      console.log("提交数据");
      this.setData({ radioValue: "1" });
      const message = "提交评估建议成功"
      utils.showToast(that, message);
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
     const message = "取消评估建议";
     utils.showToast(that, message, theme);
   } else {
     // 如果选择小幅度修改，需要输入评估建议
     if (selectedradioValue === "1") {
       this.setData({ dialogVisible: true });
     } else {
       if (radioValue) {
         const message = "修改评估建议";
         utils.showToast(that, message);
       } else {
         const message = "提交评估建议";
         utils.showToast(that, message);
       }
       this.setData({ radioValue: selectedradioValue });
     }
   }
  },
})