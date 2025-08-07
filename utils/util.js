import { Toast } from 'tdesign-miniprogram'; // 轻提示
const app = getApp();
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}
// 提示
function showToast(that, content, theme = "success") {
  Toast({
    context: that,
    selector: '#t-toast',
    message: content,
    theme: theme,
    direction: 'row',
  });
}
// 图片预览
function ImagesPreview(el, that) {
  /*
    el：点击的对象
    that：当前this对象
    需要在轮播图或者图片预览的标签设置 data-images 变量存储图片的路径
  */
  const { index } = el.detail; // 点击的图片索引
  const images = el.currentTarget.dataset.images || [];   // 所有图片列表
  // 如果不是列表就需要调整未列表
  let imagesList = [];
  if (!Array.isArray(images)) {
    imagesList = images.map(img => img.image_url);
  } else {
    imagesList = images;
  }
  const current = imagesList[index];
  if (!current || !imagesList.length) {
    const theme = "error"
    const message = "无法预览图片"
    showToast(that, message, theme);
    return;
  }
  wx.previewImage({
    current,
    urls: imagesList
  });
}

// 请求
function LoadDataList({
  page,                // 页面 this
  method = 'POST',      // 请求方法
  data,                 // 请求数据
  mode = 'init',      // 加载模式：init（初始化访问） | refresh（下拉刷新） | more（加载更多）
  toastOnError = true, // 是否显示错误提示
  showLoading = true, // 是否显示了加载框
  showSkeleton = true, // 是否显示骨架
}) {
  const isInit = mode === 'init';
  const isRefresh = mode === 'refresh';
  const isMore = mode === 'more';
  // 第一访问页面加载状态
  if (showLoading && isInit) {
    wx.showLoading({ title: '加载中...' });
  }
  // 下拉刷线加载状态
  if (isRefresh) {
    page.setData({ isDownRefreshing: true });
  }
  // 加载更多
  if (isMore) {
    page.setData({ isLoadingReachMore: true });
  }
  const url = app.globalData.url; // 请求后端接口
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) { // 请求成功
          const listData = res.data.data || [];
          resolve(listData);
        } else { // 请求失败
          if (toastOnError) showToast(page, "数据请求失败", "error");
          reject(res);
        }
      },
      fail: (err) => { // 错误
        if (toastOnError) showToast(page, "数据请求失败", "error");
        reject(err);
      },
      complete: () => {
        // 关闭加载-init模式
        if (showLoading && isInit) {
          wx.hideLoading();
        }
        // 关闭骨架显示-init模式
        if (showSkeleton && isInit) {
          page.setData({ skeletonLoading: false });
        }
        // 如果模式是下拉刷新，进行关闭
        if (isRefresh) {
          wx.stopPullDownRefresh(); // 必须手动停止
          page.setData({
            isDownRefreshing: false, // 修改状态
          });
        }
        // 加载更多，进行关闭
        if (isMore) {
          wx.stopPullDownRefresh(); // 必须手动停止
          page.setData({
            isLoadingReachMore: false, // 修改状态
          });
        }
      }
    });
  });
}
module.exports = {
  formatTime,
  showToast,
  ImagesPreview,
  LoadDataList
}
