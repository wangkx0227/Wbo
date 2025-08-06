import { Toast } from 'tdesign-miniprogram'; // 轻提示
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

function showToast(that,content,theme="success") {
  Toast({
    context: that,
    selector: '#t-toast',
    message: content,
    theme: theme,
    direction: 'row',
  });
}
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
}
module.exports = {
  formatTime,
  showToast
}
