const app = getApp(); // 用户信息
const utils = require('../../../utils/util')

const swiperImages = [
  'https://picsum.photos/800/600?random=1',  // 横版
  // 物品类
  'https://picsum.photos/700/900?random=5',  // 长竖版
];
Page({
  data: {
    Data: [], // 页面渲染数据存储列表
    pageSize: 2, // 每次加载几个ID
    currentIndex: 0, // 当前加载到第几个ID
    allIdList: [], // 首页跳转后的存储的ID值列表
    loadedIdList: [], // 已经读取渲染到页面的ID
    skeletonLoading: true, // 骨架屏控制变量

    // 筛选框变量-1
    dropdownDesigner: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部',
        },
        {
          value: 'NAQ',
          label: '宁安琪',
        },
        {
          value: 'LSL',
          label: '黎善玲',
        },
        {
          value: 'HYJ',
          label: '韩奕君'
        }
      ],
    },
    // 筛选框变量-2
    dropdownStatus: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部状态',
        },
        {
          value: 'discard',
          label: '舍弃',
        },
        {
          value: 'reserve',
          label: '保留',
        },
      ],
    },
    // 轮播图变量
    current: 0, // 当前轮播在哪一项（下标）默认第0个索引
    autoplay: false, // 是否启动自动播放
    duration: 500, // 滑动动画时长
    interval: 5000, // 轮播间隔时间，只有开启自动播放才有用
    swiperImages, // 轮播图 url变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    // 回到顶部变量
    scrollTop: 0,
    // 评论弹出层变量
    dialogVisible: false,
    dialogValue: "",
    dialogId: null, // 当前点击的id
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      let data_dict = {
        id: task_list[index].id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
      }
      for (const timeline in task_list[index].timeline_list) {
        data_dict["comment"] = task_list[index].timeline_list[timeline].comment; // kyle评审信息
        const confirmed = task_list[index].timeline_list[timeline].confirmed; // 标记舍弃(3)还是保留(1)
        data_dict["confirmed"] = confirmed;
        if (confirmed === 0) {
          data_dict["confirmed_text"] = "未标记";
        } else if (confirmed === 1) {
          data_dict["confirmed_text"] = "保留";
        } else if (confirmed === 3) {
          data_dict["confirmed_text"] = "舍弃";
        }
        const image_list = task_list[index].timeline_list[timeline].image_list;
        if (image_list.length === 0) {
          data_dict["picture_list"] = [];
        } else {
          data_dict["picture_list"] = [image_url + image_list[0].imageURL];
        }
        data_dict["timeline_id"] = task_list[index].timeline_list[timeline].id;
      }
      arrangeData.push(data_dict);
    }
    return arrangeData; // 返回整理的结构体
  },
  // 读取访问ID处理
  readIdStructure(that) {
    const { allIdList, pageSize, currentIndex } = that.data;
    if (allIdList.length === 0) {
      utils.showToast(this.page, "无数据", "warning");
      that.setData({
        skeletonLoading: false
      })
      return
    }
    const nextIds = allIdList.slice(currentIndex, currentIndex + pageSize); // 取读取id的范围
    return nextIds; // 返回需要读取的id列表
  },
  // 请求后端接口数据处理
  multiIdRequest(mode) {
    const that = this;
    // 读取id
    const nextIds = that.readIdStructure(that);
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
        data: { type: "getTaskByLinePlan", username: "admin", "lp_id": id, },
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
      const arrangedData = results.flatMap(list => that.dataStructure(list));
      // refresh刷新时重置，其他的数据追加
      if (mode === 'refresh') {
        that.setData({
          Data: arrangedData,
        })
      } else {
        that.setData({
          Data: that.data.Data.concat(arrangedData),
        })
      }
      that.setData({
        // 只记录访问成功的id
        loadedIdList: that.data.loadedIdList.concat(successIds),
        currentIndex: that.data.currentIndex + successIds.length
      });
    })
  },
  // 页面初次加载数据
  onLoad(options) {
    const that = this;
    const groupIdList = JSON.parse(options.groupIdList || '[]'); // 首页跳转后的存储的id值
    that.setData({
      allIdList: groupIdList, // 记录全部的id数据
    })
    this.multiIdRequest('init');
  },
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
  // 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    utils.ImagesPreview(el, that);
  },
  // 回到顶部
  onToTop(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },
  //  实时监听滚动距离，把这个值传给回到顶部的按钮，让它知道是否应该出现
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop
    });
  },
  // 下拉菜单-设计师
  onDesignerChange(e) {
    this.setData({
      'dropdownDesigner.value': e.detail.value,
    });
  },
  // 下拉菜单-状态
  onStatusChange(e) {
    this.setData({
      'dropdownStatus.value': e.detail.value,
    });
  },
  // 弹窗-评论-打开
  onOpenDialog(e) {
    const { timelineid, comment } = e.currentTarget.dataset;
    // 展示评审信息
    if (comment) {
      this.setData({ dialogValue: comment });
    }
    this.setData({ dialogVisible: true, dialogId: timelineid });
  },
  // 弹窗-评论-双向绑定
  onDialogInput(e) {
    this.setData({
      dialogValue: e.detail.value
    });
  },
  // 弹窗-评论-关闭（包含提交功能）
  onCloseDialog(e) {
    const that = this;
    const { dialogValue, dialogId } = this.data; // 输入的评论的数据
    const action = e.type; // "confirm" 或 "cancel"
    if (action === 'confirm') {
      utils.UpdateData({
        page: that,
        data: {
          "type": "update_timeline",
          "timeLine_id": dialogId,
          "username": "admin",
          "name": "管理员",
          "comment": dialogValue
        },
        message: "评审记录完成"
      })
      // 数据更新
      const updatedData = that.data.Data.map(item => {
        if (item.timeline_id === dialogId) {
          item["comment"] = dialogValue;
        }
        return item;
      })
      this.setData({
        Data: updatedData
      });
    } else if (action === 'cancel') {
      const theme = "warning"
      const message = "评审记录取消"
      utils.showToast(that, message, theme);
    }
    this.setData({ dialogVisible: false, dialogId: null });
    setTimeout(() => {
      this.setData({ dialogValue: "", })
    }, 500)
  },
  // 修改当前图稿状态（舍弃与保留，默认都是保留）- 小问题，需要修改
  onModifyArtworkStatus(e) {
    const that = this;
    const { timelineid, contentStatus } = e.currentTarget.dataset;
    if (contentStatus === "Y") {
      wx.showModal({
        title: '提示',
        content: '是否"保留"当前图稿',
        success(res) {
          if (res.confirm) {
            utils.UpdateData({
              page: that,
              data: {
                "type": "update_timeline",
                "timeLine_id": timelineid,
                "username": "admin",
                "name": "管理员",
                "confirmed": 1
              },

              message: "图稿已标记保留"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.timeline_id === timelineid) {
                item["confirmed"] = 1;
                item["confirmed_text"] = "保留";
              }
              return item;
            })
            that.setData({
              Data: updatedData
            });
          } else if (res.cancel) {
            // 取消
            const theme = "warning"
            const message = "用户已取消操作"
            utils.showToast(that, message, theme);
          }
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '是否"舍弃"当前图稿',
        success(res) {
          if (res.confirm) {
            utils.UpdateData({
              page: that,
              data: {
                "type": "update_timeline",
                "timeLine_id": timelineid,
                "username": "admin",
                "name": "管理员",
                "confirmed": 3
              },
              message: "图稿已标记舍弃"
            })
            const updatedData = that.data.Data.map(item => {
              if (item.timeline_id === timelineid) {
                item["confirmed"] = 3;
                item["confirmed_text"] = "舍弃";
              }
              return item;
            })
            that.setData({
              Data: updatedData
            });
          } else if (res.cancel) {
            // 取消
            const theme = "warning"
            const message = "用户已取消操作"
            utils.showToast(that, message, theme);
          }
        }
      })
    }

  },
})