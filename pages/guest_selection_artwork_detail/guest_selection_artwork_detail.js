const app = getApp(); // 用户信息
const utils = require('../../utils/util')
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
          label: '已选中',
        },
        {
          value: 'eliminate',
          label: '已淘汰',
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
    // 单选框变量
    radioValue: "0",
    // 增加图稿
    popupAddVisible: false,
    // 指派设计师
    pickerDesignerVisible: false,
    pickerDesignerValue: [],
    pickerDesignerTitile: "指派设计师",
    pickerDesignerItemList: [
      { label: '王五', value: 'A' },
      { label: '李四', value: 'B' },
      { label: '张明', value: 'B' },
      { label: '赵玉', value: 'B' },
      { label: '张三', value: 'B' },
      { label: '李明博', value: 'B' },
    ],
    // 上传图稿变量
    imageFileList: [],
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
  // 查看评论弹窗 - 打开
  onOpenPopup(e) {
    /*
      id: 当条记录的id
      commentContent: 评论内容
      popupVisible: 打开弹窗
      popupValue: 显示的评论内容
    */
    const { id, commentContent } = e.currentTarget.dataset;
    // commentator 变量控制显示评论标题
    this.setData({ popupVisible: true, popupValue: commentContent }); // 触发弹窗
  },
  // 打开评论框
  onOpenDialog(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ dialogVisible: true, dialogValue: "" });
  },
  // 输入评论-双向记录
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 输入弹窗-关闭（包含提交功能）
  onCloseDialog(e) {
    const that = this;
    const { id, dialogValue } = that.data; // 输入的评论的数据
    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      const message = "提交成功"
      utils.showToast(that, message);
    } else if (action === 'cancel') {
      const theme = "warning"
      const message = "提交取消"
      utils.showToast(that, message, theme);
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
  // 新增图稿
  onOpenAddArtwork(e) {
    this.setData({ popupAddVisible: true });
  },
  // 新增内部关闭按钮
  onCloseAddDialog(e) {
    const that = this;
    this.setData({ popupAddVisible: false });
  },
  // 新增内部提交按钮
  onSubmitAddDialog(e) {
    const that = this;
    this.setData({ popupAddVisible: false });
    console.log(11);
    const message = "新增图稿成功";
    utils.showToast(that, message);
  },
  // 新增内部的下拉框
  onDesignerPicker(e) {
    this.setData({ pickerDesignerVisible: true });
  },
  // 新增设计师筛选器-确定 
  onPickerDesignerChange(e) {
    /*
      pickerDesignerVisible：筛选器显示变量
      pickerDesignerValue： 选中的值
    */
    const that = this;
    const { value, label } = e.detail;
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
    this.setData({ pickerDesignerVisible: false, });
  },
  // 上传图稿函数
  imageAdd(e) {
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
  imageRemove(e) {
    const { index } = e.detail;
    const { imageFileList } = this.data;
    imageFileList.splice(index, 1);
    this.setData({
      imageFileList,
    });
  },
})