import { Toast } from 'tdesign-miniprogram'; // 轻提示
import Message from 'tdesign-miniprogram/message/index'; // 提示

Page({
  data: {
    // 筛选框变量-1
    dropdownTemplate: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部',
        },
        {
          value: 'HL',
          label: 'HL',
        },
        {
          value: 'D51',
          label: 'TG-D51',
        },
        {
          value: 'D240',
          label: 'TG-D240',
        },

        {
          value: 'D234',
          label: 'TG-D240',
        },
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
    // 搜索变量
    searchValue: '',
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false    // 数据是否全部加载完毕

  },
  onChange(e) {
    this.setData({
      'product.value': e.detail.value,
    });
  },
  onSearchChange() {
    console.log(this.data.searchValue);
  },

  // 跳转到详情页面
  onJumpArtworkDeatails(e) {
    const that = this;
    const groupId = e.currentTarget.dataset.groupId;
    wx.showLoading({ title: '正在加载...' });
    console.log(groupId, "准备跳转");
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/wbo_artowrk_details/wbo_artowrk_details?groupId=${groupId}`,
        success() {
          wx.hideLoading();
        },
        fail(err) {
          Toast({
            context: that,
            selector: '#t-toast',
            message: '跳转失败',
            theme: 'error',
            con: 'check-circle',
          });
        }
      });
    }, 300)
  },
  // 用户点击右上角分享
  onShareAppMessage() {
    return {
      title: 'WBO',
      path: 'pages/wbo_artwork_index/wbo_artwork_index',  // 分享后打开的页面路径
      imageUrl: '/assets/1752927115162.png'     // 自定义分享封面
    };
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
    if (this.data.isDownRefreshing) return;
    wx.showLoading({ title: '加载更多...' });
    this.setData({ isLoadingReachMore: true });
    setTimeout(() => {
      wx.stopPullDownRefresh(); // 必须手动停止
      wx.hideLoading();
      this.setData({
        isLoadingReachMore: false, // 修改状态
      });
    }, 1500);

  },
})
