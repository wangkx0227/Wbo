const utils = require('../../../utils/util')


Page({
  data: {
    Data: [], // 页面渲染数据存储列表
    pageSize: 2, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的ID值列表
    loadedIdList: [], // 已经读取渲染到页面的ID
    skeletonLoading: true, // 骨架屏控制变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false, // 数据是否全部加载完毕
    userRole: null, // 用户角色
    userName: null, // 用户名称
    scrollTop: 0, // 回到顶部变量
    // 上传工厂稿弹窗
    popupFactorySampleVisible: false,
    imageFileList: [],
    // 筛选器
    pickerVisible: false,
    pickerValue: [],
    pickerLabel: "未选择工厂",
    pickerItemList: [{
      label: '深圳工厂',
      value: 'A'
    },
    {
      label: '佛山工厂',
      value: 'B'
    },
    {
      label: '惠州工厂',
      value: 'B'
    },
    {
      label: '浙江工厂',
      value: 'B'
    },
    {
      label: '越南工厂',
      value: 'B'
    },
    {
      label: '缅甸工厂',
      value: 'B'
    },
    ],
    // 筛选框变量-模板
    dropdownArtwork: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部图稿',
      },
      {
        value: 'NAQ',
        label: '已上传样品照片',
      },
      {
        value: 'NAQ',
        label: '未上传样品照片',
      },
      ],
    },
    // 筛选框变量建议
    dropdownAssess: {
      value: 'all',
      options: [{
        value: 'all',
        label: '全部选择',
      },
      {
        value: 'discard',
        label: '未选择工厂',
      },
      {
        value: 'reserve',
        label: '已选择工厂',
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
    for (const index in task_list) {
      const task_id = task_list[index].id;
      const be_chosen2 = task_list[index].be_chosen2;
      // 说明没被选中，就过滤，同时需要确定是当前FMR被指派的图稿
      if (be_chosen2 !== 1) {
        continue;
      }
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
            "name": task_list[index].timeline_list[i].name || "无提交人", // 提交人
            "comment": task_list[index].timeline_list[i].comment, // 评论内容
            "picture_list": picture_list, // 图片
            "timeline_type_text": timeline_type_text // 图稿类型
          })
          continue; // 跳过
        }

        data_dict["picture_list"] = picture_list;
        data_dict["timeline_type"] = timeline_type; // 图稿类型
        data_dict["timeline_id"] = timeline_id; // 第一条时间线的id
      }
      taskTimeLineData[`${task_id}`] = timeLineData; // 时间线数据
      arrangeData.push(data_dict);
    }
    return {
      arrangeData,
      taskTimeLineData
    }; // 返回整理的结构体
  },
  // 请求后端接口数据处理
  multiIdRequest(mode) {
    const that = this;
    // 读取id
    const nextIds = utils.readIdStructure(that);
    // 判断，如果nextIds的长度小于预设pageSize的长度，就totalRequests重置，避免加载动作卡死
    let totalRequests = that.data.pageSize;
    if (nextIds.length !== that.data.pageSize) {
      totalRequests = nextIds.length;
    }
    // 实例化请求类
    const loader = new utils.MultiRequestLoader(that, totalRequests);
    // 读取数据
    let successIds = []; // 用于记录成功的 id 
    const promises = nextIds.map(id => {
      return loader.request({
        data: {
          type: "getTaskByLinePlan",
          username: "admin",
          "lp_id": id,
        },
        mode: mode,
      }).then(res => {
        successIds.push(id); // 用于记录成功的 id
        return res;
      }).catch(err => {
        console.warn(`ID ${id} 请求失败`, err);
        return null; // 保证 Promise.all 能跑完
      });
    })
    Promise.all(promises).then(results => {
      const allResults = results.flatMap(list => that.dataStructure(list));
      const arrangeData = allResults.flatMap(item => item.arrangeData); // 展示数据
      const taskTimeLineData = Object.assign({},
        ...allResults.map(x => x.taskTimeLineData)
      );
      // refresh刷新时重置，其他的数据追加
      if (mode === 'refresh') {
        that.setData({
          Data: arrangeData,
          taskTimeLineData: taskTimeLineData,
        })
      } else {
        that.setData({
          Data: that.data.Data.concat(arrangeData),
          taskTimeLineData: {
            ...that.data.taskTimeLineData,
            ...taskTimeLineData
          }
        })
      }
      that.setData({
        // 只记录访问成功的id
        loadedIdList: that.data.loadedIdList.concat(successIds),
        currentIndex: that.data.currentIndex + successIds.length
      });
    })
  },
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const that = this;
    const groupIdList = JSON.parse(options.groupIdList || '[]'); // 首页跳转后的存储的id值
    that.setData({
      allIdList: groupIdList, // 记录全部的id数据
    })
    this.multiIdRequest('init');
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
  // 页面上拉刷新 - 用于页面重置
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return; // 如果正在加载更多，则禁止下拉刷新
    // 重置 currentIndex 让它从头开始访问
    this.setData({
      currentIndex: 0,
      noMoreData: false,
      isLoadingReachMore: false
    })
    this.multiIdRequest('refresh');
  },
  // 页面上拉触底事件的处理函数-用于加载更多数据
  onReachBottom() {
    // 如果在下拉刷新，禁止滚动加载
    if (this.data.isDownRefreshing || this.data.noMoreData) return;
    this.multiIdRequest('more');
    if (this.data.currentIndex === this.data.allIdList.length) {
      this.setData({
        noMoreData: true
      })
    }

  },
  // 打开-上传工厂打样稿
  onOpenUploadFactorySample(e) {
    e.stopPropagation && e.stopPropagation(); // 阻止事件冒泡
    // 打开弹窗，显示upload组件
    this.setData({
      popupFactorySampleVisible: true
    });
  },
  // 关闭-上传工厂打样稿
  onCloseUploadFactorySample() {
    this.setData({
      popupFactorySampleVisible: false,
    });
    // 等动画结束后，删除imageFileList的图
    setTimeout(() => {
      this.setData({
        imageFileList: []
      })
    }, 500)
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
  // 上传图稿函数
  onImageAdd(e) {
    const {
      imageFileList
    } = this.data;
    const {
      files
    } = e.detail;
    console.log();
    // 方法1：选择完所有图片之后，统一上传，因此选择完就直接展示
    this.setData({
      imageFileList: [...imageFileList, ...files], // 此时设置了 fileList 之后才会展示选择的图片
    });
    // 方法2：每次选择图片都上传，展示每次上传图片的进度
    // files.forEach(file => this.uploadFile(file))
  },
  // 提交上传数据-未完成提交样品图
  onSubmitFactorySample(e) {
    const that = this;
    this.setData({
      popupFactorySampleVisible: false,
      UpdatefactorySampleStatus: "已上传",
      swiperImages2: ['https://xcx.1bizmail.com:8153/static/images/wpb_images/D51_ResinGlitter_Ornament_CS25-SKR-120_HgS7tjR.jpg']
    });
    const message = "已上传样品图";
    utils.showToast(that, message);
    setTimeout(() => {
      this.setData({
        imageFileList: []
      })
    }, 500)
  },
  // 选择工厂关闭-筛选器
  onClosePicker(e) {
    /*
      pickerVisible：筛选器显示变量
    */
    this.setData({
      pickerVisible: false,
    });
  },
  // 选择工厂打开-筛选器
  onOpenPicker() {
    /*
      pickerVisible：筛选器显示变量
      实际情况下需要加入一个默认值
    */
    this.setData({
      pickerVisible: true
    });
  },
  // 选择工厂确定-筛选器-未完成指定工厂
  onPickerChange(e) {
    /*
      pickerVisible：筛选器显示变量
      pickerValue： 选中的值
    */
    const that = this;
    const {
      value,
      label
    } = e.detail;
    this.setData({
      pickerVisible: false,
      pickerValue: value,
      pickerLabel: label
    });
    const message = `已选择${label}`
    utils.showToast(that, message);
  },


  // 下拉菜单
  onArtworkChange(e) {
    this.setData({
      'dropdownArtwork.value': e.detail.value,
    });
  },
  // 下拉菜单
  onAssessChange(e) {
    this.setData({
      'dropdownAssess.value': e.detail.value,
    });
  },
})