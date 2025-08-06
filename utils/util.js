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
// 图片预览
function ImagesPreview(el,that) {
  /*
    el：点击的对象
    that：当前this对象
    需要在轮播图或者图片预览的标签设置 data-images 变量存储图片的路径
  */
 console.log(1,"点击轮播图");
  const { index } = el.detail; // 点击的图片索引
  const images = el.currentTarget.dataset.images || [];   // 所有图片列表
  // 如果不是列表就需要调整未列表
  let imagesList = [];
  if( !Array.isArray(images)){
    imagesList = images.map(img => img.image_url);
  }else {
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
module.exports = {
  formatTime,
  showToast,
  ImagesPreview
}
