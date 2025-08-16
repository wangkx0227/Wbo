const app = getApp();
const utils = require('../../../utils/util')
Page({
  data: {
    lineplan_id: null, // 存储的lp id值
    Data: [], // 页面渲染数据存储列表
    allData: [], // 全部的数据
    pageSize: 6, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    skeletonLoading: true, // 骨架屏控制变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false, // 数据是否全部加载完毕
    userRole: null, // 用户角色
    userName: null, // 用户名称
    scrollTop: 0, // 回到顶部变量
    popupFactoryArtworkVisible: false, // 上传工厂稿弹窗
    imageFileList: [], // 存储图片列表

    // 筛选框变量-模板
    dropdownArtwork: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部图稿',
      },
      ],
    },
    // 筛选框变量建议
    dropdownAssess: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部反馈建议',
      },
      ],
    },

  },

  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    const taskTimeLineData = {}; // 时间线数据
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    const userName = this.data.userName;
    for (const index in task_list) {
      const task_id = task_list[index].id;
      const AIE_designer1 = task_list[index].AIE_designer1;
      if (AIE_designer1 !== userName) {
        continue;
      }
      // 需要增加一个关于当前用户的判断，只有当前用户才可以看到自己的图稿并上传
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
      }
      let timeLineData = []; // 时间线存储数据
      const timeline_list = task_list[index].timeline_list;
      for (let i = 0; i < timeline_list.length; i++) {
        const image_list = task_list[index].timeline_list[i].image_list;
        const picture_list = image_list.length === 0 ? [] : image_list.map(img => image_url + img.imageURL);
        const timeline_id = task_list[index].timeline_list[i].id;
        const timeline_type = task_list[index].timeline_list[i].timeline_type;
        if (i > 0) {
          let timeline_type_text = ""
          if (timeline_type === 1) {
            timeline_type_text = "设计稿"
          } else {
            timeline_type_text = "生产稿"
          }
          timeLineData.push({
            "id": timeline_id, // id 
            "time": task_list[index].timeline_list[i].time, // 提交时间
            "name": task_list[index].timeline_list[i].name, // 提交人
            "comment": task_list[index].timeline_list[i].comment, // 评论内容
            "picture_list": picture_list, // 图片
            "timeline_type_text": timeline_type_text // 图稿类型
          })
          continue; // 跳过
        }
        const confirmed2 = task_list[index].timeline_list[i].confirmed2; // kyle 标记
        data_dict["picture_list"] = picture_list;
        // 第一条时间线的id
        data_dict["timeline_id"] = timeline_id;
        // 可行性分析，shelley 选3直接跳过
        if (confirmed2 === 3) {
          continue
        }
      }
      taskTimeLineData[`${task_id}`] = timeLineData; // 时间线数据
      arrangeData.push(data_dict);
    }
    return {
      arrangeData,
      taskTimeLineData
    }; // 返回整理的结构体
  },
  // 后端请求
  dataRequest(mode) {
    const that = this;
    const userName = that.data.userName;
    const lineplan_id = that.data.lineplan_id;
    utils.LoadDataList({
      page: that,
      data: { type: "getTaskByLinePlan", username: userName, "lp_id": lineplan_id, },
      mode: mode
    }).then(list => { // list 就是data数据
      const allResults = that.dataStructure(list);
      const arrangeData = allResults.arrangeData; // 展示数据
      const taskTimeLineData = allResults.taskTimeLineData; // 时间线
      that.setData({
        allData: arrangeData,
        taskTimeLineData: taskTimeLineData,
      })
      // 数据逻辑构建
      const pageData = utils.readPageStructure(that); // 分页数据
      let totalRequests = that.data.pageSize;
      if (pageData.length !== totalRequests) {
        totalRequests = pageData.length;
      }
      // 针对刷线和第一次加载使用
      if (mode === 'refresh') {
        that.setData({
          Data: pageData,
        })
      } else {
        that.setData({
          Data: that.data.Data.concat(pageData),
        })
      }
      that.setData({
        currentIndex: that.data.currentIndex + pageData.length // 记录下标索引
      });
    });
  },
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const that = this;
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const lineplan_id = options.lineplan_id || ''; // 首页跳转后的存储的id值
    that.setData({
      lineplan_id: lineplan_id, // 记录全部的id数据
      userRole: userRole,
      userName: userName
    })
    that.dataRequest('init');
  },
  // 轮播图函数 - 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    // utils.ImagesPreview(el, that);
    utils.onSwiperImagesTap(el, that);
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
  // 打开抽屉，查看历史时间线
  onOpenHistoryTimeLine(e) {
    const {
      taskId
    } = e.currentTarget.dataset;
    const taskTimeLineData = this.data.taskTimeLineData;
    const timeLineValue = taskTimeLineData[`${taskId}`];
    this.setData({
      popupTimeLineVisible: true,
      timeLineValue: timeLineValue
    });
  },
  // 关闭抽屉
  onCloseHistoryTimeLine(e) {
    // 打开弹窗，显示upload组件
    this.setData({
      popupTimeLineVisible: false
    });
    setTimeout(() => {
      this.setData({
        timeLineValue: []
      });
    }, 500)
  },
  // 空方法，避免抽屉的滚动
  onDummyTouchMove() { },
  // 页面上拉刷新
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return; // 如果正在加载更多，则禁止下拉刷新
    // 重置 currentIndex 让它从头开始访问
    this.setData({
      currentIndex: 0,
      noMoreData: false,
      isLoadingReachMore: false
    })
    this.dataRequest('refresh');
  },
  // 页面上拉触底加载更多数据
  onReachBottom() {
    // 下拉刷线，读取原来的加载过的数据即可
    const that = this;
    // 如果在下拉刷新，禁止滚动加载
    if (that.data.isDownRefreshing || that.data.noMoreData) return;
    const pageData = utils.readPageStructure(that); // 分页数据
    let totalRequests = that.data.pageSize;
    if (pageData.length !== totalRequests) {
      totalRequests = pageData.length;
    }
    that.setData({
      Data: that.data.Data.concat(pageData),
      currentIndex: that.data.currentIndex + pageData.length // 记录下标索引
    });
    if (that.data.currentIndex === that.data.allData.length) {
      that.setData({
        noMoreData: true
      })
    }
  },
  // 打开-上传工厂打样稿
  onOpenUploadFactoryArtwork(e) {
    // 打开弹窗，显示upload组件
    const {
      taskId,
      timelineId
    } = e.currentTarget.dataset;
    this.setData({
      popupFactoryArtworkVisible: true,
      task_id: taskId,
      timeline_id: timelineId
    });
  },
  // 关闭-上传工厂打样稿
  onCloseUploadFactoryArtwork() {
    this.setData({
      popupFactoryArtworkVisible: false,
    });
    // 等动画结束后，删除imageFileList的图
    setTimeout(() => {
      this.setData({
        imageFileList: []
      })
    }, 500)
  },
  // 上传图稿函数
  onImageAdd(e) {
    const {
      imageFileList
    } = this.data;
    const {
      files
    } = e.detail;
    // 选择完所有图片之后，统一上传，因此选择完就直接展示
    this.setData({
      imageFileList: [...imageFileList, ...files], // 此时设置了 fileList 之后才会展示选择的图片
    });
  },
  // 图稿删除函数
  onImageRemove(e) {
    const {
      index
    } = e.detail;
    const {
      imageFileList
    } = this.data;
    imageFileList.splice(index, 1);
    this.setData({
      imageFileList,
    });
  },
  // 提交上传的图稿，一次一张
  onSubmitFactoryArtwork(e) {
    const that = this;
    const pictureUrl = app.globalData.pictureUrl; // 请求后端接口
    const task_id = that.data.task_id;
    const userName = that.data.userName;
    const timeline_id = that.data.timeline_id;
    const imageFileList = that.data.imageFileList;
    if (imageFileList.length === 0) {
      utils.showToast(that, "选择图片后上传", "error");
      return;
    }
    wx.uploadFile({
      url: pictureUrl,
      filePath: imageFileList[0].url, // 临时文件路径
      name: 'file',       // 与接口的 file 字段一致
      formData: {
        task_id: task_id   // 整数 ID
      },
      success(res) {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            const updatedData = that.data.Data.map(item => {
              if (item.timeline_id === timeline_id) {
                return {
                  ...item,
                  picture_list: [...item.picture_list, imageFileList[0].url]
                };
              }
              return item;
            })
            that.setData({
              Data: updatedData
            });
            that.setData({
              popupFactoryArtworkVisible: false,
            });
            utils.showToast(that, "上传成功");
          } else {
            utils.showToast(that, "上传失败", "error");
          }
        } catch (e) {
          console.log(e);
          utils.showToast(that, "返回数据解析失败", "error");
        }
      },
      fail(err) {
        utils.showToast(that, "接口调用失败", "error");
      }
    });
    setTimeout(() => {
      that.setData({
        imageFileList: []
      })
    }, 500)
  },

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
})