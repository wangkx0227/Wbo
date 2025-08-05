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
          label: '已上传打样图稿',
        },
        {
          value: 'NAQ',
          label: '未上传打样图稿',
        },
      ],
    },
    // 筛选框变量建议
    dropdownAssess: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部反馈建议',
        },
        {
          value: 'discard',
          label: '无反馈建议',
        },
        {
          value: 'reserve',
          label: '有反馈建议',
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
    // 折叠版
    collapseValue: [],
    // 上传工厂稿弹窗
    popupAddVisible: false,
    imageFileList: [],
    UpdatefactoryArtworkStatus:"未上传",
    // 假数据，工厂稿
    swiperImages2: [],
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
        popupValue: "",
      });
    }, 300);
  },
  // 查看评论弹窗 - 唤起
  onOpenPopup(e) {
    /*
      id: 当条记录的id
      commentContent: 评论内容
      popupVisible: 唤起弹窗
      popupValue: 显示的评论内容
    */
    const { id, commentContent } = e.currentTarget.dataset;
    this.setData({ popupVisible: true, popupValue: commentContent }); // 触发弹窗
  },
  // 折叠板展开展开
  onCollapseChange(e) {
    this.setData({
      collapseValue: e.detail.value,
    });
  },
  // 打开-上传工厂打样稿
  onOpenUploadFactoryArtwork(e) {
    e.stopPropagation && e.stopPropagation();  // 阻止事件冒泡
    // 打开弹窗，显示upload组件
    this.setData({ popupAddVisible: true });
  },
  // 关闭-上传工厂打样稿
  onCloseUploadFactoryArtwork() {
    this.setData({ popupAddVisible: false, });
    // 等动画结束后，删除imageFileList的图
    setTimeout(() => {
      this.setData({
        imageFileList: []
      })
    }, 500)
  },
  // 上传图稿函数
  onImageAdd(e) {
    const { imageFileList } = this.data;
    const { files } = e.detail;
    console.log();
    // 方法1：选择完所有图片之后，统一上传，因此选择完就直接展示
    this.setData({
      imageFileList: [...imageFileList, ...files], // 此时设置了 fileList 之后才会展示选择的图片
    });
    // 方法2：每次选择图片都上传，展示每次上传图片的进度
    // files.forEach(file => this.uploadFile(file))
  },
  // 图稿删除函数
  onImageRemove(e) {
    const { index } = e.detail;
    const { imageFileList } = this.data;
    imageFileList.splice(index, 1);
    this.setData({
      imageFileList,
    });
  },
  // 提交上传数据
  onSubmitFactoryArtwork(e) {
    const that = this;
    this.setData({ popupAddVisible: false,UpdatefactoryArtworkStatus:"已上传", swiperImages2: ['https://xcx.1bizmail.com:8153/static/images/wpb_images/D51_ResinGlitter_Ornament_CS25-SKR-120_HgS7tjR.jpg'] });
    const message = "新增图稿成功";
    utils.showToast(that, message);
    setTimeout(() => {
      this.setData({
        imageFileList: []
      })
    }, 500)
  }
})