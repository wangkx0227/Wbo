import { Toast } from 'tdesign-miniprogram'; // 轻提示
const app = getApp();
function currentTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`
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
// 单次请求获取数据
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
// 多次请求获取数据-避免加载状态重复，导致页面闪烁
class MultiRequestLoader {
  constructor(page, totalRequests) {
    this.page = page;
    this.loadingCount = 0; // 计数
    this.totalRequests = totalRequests; // 总请求数
    this.url = app.globalData.url; // 请求后端接口
  }
  request({ method = 'POST', data, mode = 'init', toastOnError = true }) {
    const isInit = mode === 'init';
    const isRefresh = mode === 'refresh';
    const isMore = mode === 'more';
    const url = this.url;
    if (isInit) {
      // 多次请求只第一次显示loading和骨架
      if (this.loadingCount === 0) {
        wx.showLoading({ title: '加载中...' });
      }
      this.loadingCount++;
    }
    if (isRefresh) {
      this.page.setData({ isDownRefreshing: true });
      this.loadingCount++;
    }
    if (isMore) {
      this.page.setData({ isLoadingReachMore: true });
      this.loadingCount++;
    }
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method,
        data,
        header: { 'content-type': 'application/json' },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data.data || []);
          } else {
            if (toastOnError) showToast(this.page, "数据请求失败", "error");
            reject(res);
          }
        },
        fail: (err) => {
          if (toastOnError) showToast(this.page, "数据请求失败", "error");
          reject(err);
        },
        complete: () => {
          // 关闭加载状态
          if (isInit) {
            if (this.loadingCount === this.totalRequests) {
              wx.hideLoading();
              this.page.setData({ skeletonLoading: false });
            }
          }
          if (isRefresh) {
            if (this.loadingCount === this.totalRequests) {
              wx.stopPullDownRefresh();
              this.page.setData({ isDownRefreshing: false });
            }

          }
          if (isMore) {
            if (this.loadingCount === this.totalRequests) {
              wx.stopPullDownRefresh();
              this.page.setData({ isLoadingReachMore: false });
            }
          }
        }
      });
    });
  }
}
// 提交请求-不牵扯加载动态
function UpdateData({
  page,                // 页面 this
  method = 'POST',      // 请求方法
  data,                 // 请求数据
  message,
  theme,
  toastShow = true, // 是否显示提示
}) {
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
          if (!theme) {
            if (toastShow) {
              showToast(page, message);
            }
          } else {
            if (toastShow) {
              showToast(page, message, theme);
            }
          }
        } else { // 请求失败
          if (toastShow) showToast(page, "数据请求失败", "error");
          reject(res);
        }
      },
      fail: (err) => { // 错误
        if (toastShow) showToast(page, "数据请求失败", "error");
        reject(err);
      },
      complete: () => {

      }
    });
  });
}
// 读取访问ID处理-分页处理
function readIdStructure(that) {
  const { allIdList, pageSize, currentIndex } = that.data;
  if (allIdList.length === 0) {
    showToast(this.page, "无数据", "warning");
    that.setData({
      skeletonLoading: false
    })
    return [];
  }
  const nextIds = allIdList.slice(currentIndex, currentIndex + pageSize); // 取读取id的范围
  return nextIds; // 返回需要读取的id列表
}
// 登录
function checkLogin() {
  const userInfo = wx.getStorageSync('userInfo')
  console.log('check!', !userInfo)
  if (!userInfo) {
    wx.redirectTo({
      url: '/pages/wxLogin/wxLogin'
    })
    return false
  }
  return true
}

// 无刷新更新时间线
function updateTimeLine(page, task_id, timeline_id, comment, username) {
  let picture_list = [];
  let timeline_type_text = "";
  const data = page.data.Data;
  for (let i = 0; data.length > i; i++) {
    if (data[i].timeline_id === timeline_id) {
      picture_list = data[i].picture_list;
      timeline_type_text = data[i].timeline_type === 1 ? "设计稿" : "生产稿";
    }
  }
  let updateTaskTimeLineData = { ...page.data.taskTimeLineData };
  let timeLineValue = updateTaskTimeLineData[task_id] || [];
  timeLineValue.unshift({
    id: "", // 无法获取没有
    name: username,
    time: currentTime(),
    picture_list: picture_list, // 可以获取当前时间线的图片
    comment: comment,
    timeline_type_text: timeline_type_text,
  })
  updateTaskTimeLineData[`${task_id}`] = timeLineValue;
  page.setData({
    taskTimeLineData: updateTaskTimeLineData
  })
}


module.exports = {
  showToast,
  ImagesPreview,
  LoadDataList,
  MultiRequestLoader,
  UpdateData,
  readIdStructure,
  checkLogin,
  updateTimeLine
}
