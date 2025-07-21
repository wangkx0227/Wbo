import { Toast } from 'tdesign-miniprogram'; // 轻提示
import Message from 'tdesign-miniprogram/message/index'; // 提示
const imageCdn = 'https://tdesign.gtimg.com/mobile/demos';
const swiperImages = [
  `${imageCdn}/swiper1.png`,
  `${imageCdn}/swiper2.png`,
  `${imageCdn}/swiper1.png`,
  `${imageCdn}/swiper2.png`,
  `${imageCdn}/swiper1.png`,
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
          value: 'not_review',
          label: '未审查',
        },
        {
          value: 'review',
          label: '已审查',
        }
      ],
    },
    // 筛选框变量-2
    dropdownSorter: {
      value: 'default',
      options: [
        {
          value: 'default',
          label: '默认排序',
        },
        {
          value: 'time',
          label: '时间从高到低',
        },
      ],
    },
    // 轮播图变量
    current: 0,
    autoplay: false,
    duration: 500,
    interval: 5000,
    swiperImages,
    cur: {},
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const groupId = options.groupId; // 首页跳转后的存储的id值
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 轮播图函数
  onTap(e) {
    const { index } = e.detail;
    console.log(index);
  },
  onChange(e) {
    const { current, source } = e.detail;

    console.log(current, source);
  },
  onImageLoad(e) {
    console.log(e.detail.index);
  },
})