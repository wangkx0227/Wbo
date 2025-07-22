import { Toast } from 'tdesign-miniprogram'; // 轻提示
import Message from 'tdesign-miniprogram/message/index'; // 提示
const swiperImages = [
  'https://picsum.photos/800/600?random=1',  // 横版
  'https://picsum.photos/600/800?random=2',  // 竖版
  'https://picsum.photos/1000/500?random=3', // 宽幅
  // 物品类
  'https://picsum.photos/800/800?random=4',  // 正方形
  'https://picsum.photos/700/900?random=5',  // 长竖版
];
Page({
  data: {
    groupId: null, // 首页跳转后的存储的id值
    // 筛选框变量-1
    dropdownTemplate: {
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
        }
      ],
    },
    // 筛选框变量-2
    dropdownSorter: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '默认状态',
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
    // 上拉刷新变量
    downRefreshEnable:false,
    downRefreshLoadingTexts:['下拉刷新', '松手刷新', '正在刷新', '刷新完成'],
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const groupId = options.groupId; // 首页跳转后的存储的id值
  },

  // 生命周期函数--监听页面初次渲染完成
  onReady() { },
  // 生命周期函数--监听页面显示
  onShow() { },
  //生命周期函数--监听页面隐藏
  onHide() { },

  // 生命周期函数--监听页面卸载
  onUnload() { },

  // 页面相关事件处理函数--监听用户下拉动作
  onPullDownRefresh() { },

  // 页面上拉触底事件的处理函数
  onReachBottom() { },

  // 用户点击右上角分享
  onShareAppMessage() { },

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
      Toast({
        context: that,
        selector: '#t-toast',
        message: '无法预览图片',
        theme: 'error',
        con: 'check-circle',
      });
      return;
    }
    wx.previewImage({
      current,
      urls: swiperImages
    });
  },
  // 修改当前图稿状态（舍弃与保留，默认都是保留）
  onModifyArtworkStatus(e) {
    const that = this;
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '是否舍弃当前图稿',
      success(res) {
        if (res.confirm) {
          // 发送请求
          console.log('用户舍弃')
          Message.success({
            context: that,
            offset: [10, 32],
            duration: 3000,
            content: '提交成功，3秒后消失',
          });
        } else if (res.cancel) {
          // 取消
          console.log('用户取消')
        }
      }
    })
  },
  // 上拉刷新 - 用于页面重置
  onPullDownRefresh() {
    console.log("下拉刷新触发");
    // 模拟数据加载
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
    }, 1500);
  }
})