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

module.exports = {
  formatTime,
  showToast
}
