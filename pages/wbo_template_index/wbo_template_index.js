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
          value: 'not',
          label: '未评审',
        },
        {
          value: 'initial',
          label: '初步评审',
        },
        {
          value: 'final',
          label: '最终评审',
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
    searchValue: '',
  },
  onChange(e) {
    this.setData({
      'product.value': e.detail.value,
    });
  },
  onSearchChange() {
    console.log(this.data.searchValue);
  },
  // 跳转到模板链接
  onLinkTap(e) {
    // e.stopPropagation(); // 阻止事件继续冒泡，避免触发折叠面板
    // 你的跳转逻辑
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/wbo_template_details/wbo_template_details',
      });
    }, 300)
  },
  // 文件上传
  onUploadFile() {
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      success(res) {
        const tempFilePath = res.tempFiles[0].path;
      },
      complete(res) {
        if (res.errMsg && res.errMsg.includes('fail cancel')) {
          Toast({
            context: that,
            selector: '#t-toast',
            message: '取消文件上传',
          })
        }
      }
    });
  },

  // 文件下载
  onDownloadFile() {
    wx.previewImage({
      current: 'https://www.news.cn/photo/20250716/30b113f61261413e9bb027ae97864185/2025071630b113f61261413e9bb027ae97864185_2025071632994008663d418d892d8d71ab22bb13.jpg', // 当前显示的图片链接
      urls: ['https://www.news.cn/photo/20250716/30b113f61261413e9bb027ae97864185/2025071630b113f61261413e9bb027ae97864185_2025071632994008663d418d892d8d71ab22bb13.jpg']   // 只包含这张图片的数组
    });
    // const that = this;
    // wx.showLoading({ title: '正在下载...' });
    // wx.downloadFile({
    //   url: 'http://bos.itdks.com/abca09e481384e0ca659bd72848d1495.pdf', // 文件网络地址
    //   success(res) {
    //     if (res.statusCode === 200) {
    //       const tempFilePath = res.tempFilePath; // 文件对象
    //       const fs = wx.getFileSystemManager();
    //       const savePath = `${wx.env.USER_DATA_PATH}/file_${Date.now()}.pdf`;
    //       wx.hideLoading();
    //       fs.saveFile({
    //         tempFilePath,
    //         filePath: savePath,
    //         success() {
    //           Toast({
    //             context: that,
    //             selector: '#t-toast',
    //             message: '保存文件成功',
    //             theme: 'success',
    //             con: 'check-circle',
    //           });
    //         },
    //         fail(err) {
    //           wx.showToast({
    //             context: that,
    //             selector: '#t-toast',
    //             title: '保存文件失败',
    //             theme: 'error',
    //             con: 'check-circle',
    //           });
    //         }
    //       });
    //     } else {
    //       wx.hideLoading();
    //       Toast({
    //         context: that,
    //         selector: '#t-toast',
    //         message: `下载失败`,
    //         theme: 'error',
    //         con: 'check-circle',
    //       });
    //     }
    //   },
    //   fail(err) {
    //     wx.hideLoading();
    //     Toast({
    //       context: that,
    //       selector: '#t-toast',
    //       message: '网络错误',
    //       theme: 'error',
    //       con: 'check-circle',
    //     });
    //   }
    // });
  },
  // 在线预览ppt
  onLookPPTFile() {
    wx.showLoading({ title: '文件加载中...' });
    const that = this;
    wx.downloadFile({
      url: 'http://bos.itdks.com/abca09e481384e0ca659bd72848d1495.pdf', // 改成你服务器上真实地址
      success(res) {
        wx.hideLoading();
        if (res.statusCode === 200) {
          // 文件校验，判断文件是否是正常大小，或者其他
          const filePath = res.tempFilePath;
          wx.getFileInfo({
            filePath: res.tempFilePath,
            success(info) {
              if (info.size > 0) {
                wx.openDocument({
                  filePath: filePath,
                  fileType: 'pdf', // 需要修改当前的类型
                  success() {
                    console.log('打开成功');
                  },
                  fail(err) {
                    Toast({
                      context: that,
                      selector: '#t-toast',
                      message: '打开失败',
                      theme: 'error',
                      con: 'check-circle',
                    });
                  }
                });
              } else {
                Toast({
                  context: that,
                  selector: '#t-toast',
                  message: `文件损坏`,
                  theme: 'error',
                  con: 'check-circle',
                });
              }
            }
          })
        } else {
          Toast({
            context: that,
            selector: '#t-toast',
            message: `下载失败`,
            theme: 'error',
            con: 'check-circle',
          });
        }
      },
      fail(err) {
        wx.hideLoading();
        console.log(err);
        Toast({
          context: that,
          selector: '#t-toast',
          message: '网络错误',
          theme: 'error',
          con: 'check-circle',
        });
      }
    });
  },
  // 用户点击右上角分享
  onShareAppMessage() {
    return {
      title: 'WBO',
      path: 'pages/wbo_template_index/wbo_template_index',  // 分享后打开的页面路径
      imageUrl: '/assets/1752927115162.png'     // 自定义分享封面
    };
  }
})
