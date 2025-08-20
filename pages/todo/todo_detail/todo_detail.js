const utils = require('../../../utils/util')

Page({
  data: {
    lineplan_id: null, // 存储的lp id值
    Data: [], // 页面渲染数据存储列表
    allData: [], // 全部的数据
    filteredData: [], // 筛选后的数据
    pageSize: 6, // 每次加载几条数据
    currentIndex: 0, // 当前加载到第几个ID
    skeletonLoading: true, // 骨架屏控制变量
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    userRole: null, // 用户角色
    userName: null, // 用户名称
    // 回到顶部变量
    scrollTop: 0,
    // 筛选框变量-1
    dropdownMaterial: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部',
        },
      ],
    },
    filterMaterialValue: null,
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
          label: '从低到高排序',
        },
      ],
    },
    filterSorter: null,
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
  // 点击轮播图 - 图片预览
  onSwiperImagesTap(e) {
    const el = e;
    const that = this;
    // utils.ImagesPreview(el, that);
    utils.onSwiperImagesTap(el, that);
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = []; // 显示数据
    let material_list = [];
    const taskTimeLineData = {}; // 时间线数据
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    for (const index in task_list) {
      const task_id = task_list[index].id;
      const fmr2 = task_list[index].fmr2;
      const be_chosen2 = task_list[index].be_chosen2;
      const whether_to_proof = task_list[index].whether_to_proof;
      const be_ordered2 = task_list[index].be_ordered2;
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIE_designer1,
        fmr: task_list[index].fmr,
        fmr2: task_list[index].fmr2,
        be_chosen2: be_chosen2,
        whether_to_proof: whether_to_proof,
        be_ordered2: be_ordered2
      }
      if (fmr2 === 1) {
        data_dict["fmr2_text"] = "可生产";
      } else if (fmr2 === 2) {
        data_dict["fmr2_text"] = "不可生产";
      } else {
        data_dict["fmr2_text"] = "未标记";
      }
      if (be_chosen2 === 1) {
        data_dict["be_chosen2_text"] = "已选中";
      } else if (be_chosen2 === 2) {
        data_dict["be_chosen2_text"] = "未选中";
      } else {
        data_dict["be_chosen2_text"] = "未标记";
      }
      if (whether_to_proof === 1) {
        data_dict["whether_to_proof_text"] = "是";
      } else {
        data_dict["whether_to_proof_text"] = "否";
      }
      if (be_ordered2 === 1) {
        data_dict["be_ordered2_text"] = "已完成";
      } else if (be_ordered2 === 2) {
        data_dict["be_ordered2_text"] = "未选中";
      } else {
        data_dict["be_ordered2_text"] = "未标记";
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
          continue; // 跳过倒序的第2个及以后
        }
        const confirmed = task_list[index].timeline_list[i].confirmed; // 标记舍弃(3)还是保留(1)
        const confirmed2 = task_list[index].timeline_list[i].confirmed2; // 标记舍弃(3)还是保留(1)
        data_dict["confirmed"] = confirmed;
        // 初选与终选
        if (confirmed >= 3) {
          data_dict["confirmed_text_1"] = "保留";
        } else {
          data_dict["confirmed_text_1"] = "舍弃";
        }
        if (confirmed === 3) {
          data_dict["confirmed_text_2"] = "保留";
        } else if (confirmed === 4) {
          data_dict["confirmed_text_2"] = "舍弃";
        } else {
          data_dict["confirmed_text_2"] = "未标记";
        }
        // shelley可行性分析
        if (confirmed2 === 1) {
          data_dict["confirmed2_text"] = "可生产";
        } else if (confirmed === 2) {
          data_dict["confirmed2_text"] = "需要小幅度修改";
        } else if (confirmed === 3) {
          data_dict["confirmed2_text"] = "不具备可行性";
        } else {
          data_dict["confirmed2_text"] = "未标记";
        }
        data_dict["picture_list"] = picture_list;
        data_dict["timeline_id"] = timeline_id;
        data_dict["timeline_type"] = timeline_type; // 图稿类型
      }
      // 时间线数据
      taskTimeLineData[`${task_id}`] = timeLineData;
      material_list.push(data_dict["texture"].trim());
      arrangeData.push(data_dict);
    }
    // 筛选条件加入
    const material = utils.filterDataProcess(material_list);
    const options = this.data.dropdownMaterial.options;
    // 只有 筛选框的列表为1（内部默认有一条数据）才会添加
    if (options.length === 1) {
      this.setData({
        "dropdownMaterial.options": options.concat(material)
      })
    }
    return { arrangeData, taskTimeLineData }; // 返回整理的结构体
  },
  // 后端请求
  dataRequest(mode) {
    const that = this;
    const lineplan_id = that.data.lineplan_id;
    utils.LoadDataList({
      page: that,
      data: { type: "getTaskByLinePlan", username: "admin", "lp_id": lineplan_id, },
      mode: mode
    }).then(list => { // list 就是data数据
      const allResults = that.dataStructure(list);
      const arrangeData = allResults.arrangeData; // 展示数据
      const taskTimeLineData = allResults.taskTimeLineData; // 时间线
      that.setData({
        allData: arrangeData,
        filteredData: arrangeData,
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
  onLoad(options) {
    const that = this;
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const lineplan_id = options.lineplan_id || ''; // 首页跳转后的存储的id值
    that.setData({
      lineplan_id: lineplan_id, // 记录全部的id数据
    })
    that.dataRequest('init');
  },
  // 打开抽屉，查看历史时间线
  onOpenHistoryTimeLine(e) {
    const { taskId } = e.currentTarget.dataset;
    const taskTimeLineData = this.data.taskTimeLineData;
    const timeLineValue = taskTimeLineData[`${taskId}`];
    this.setData({ popupTimeLineVisible: true, timeLineValue: timeLineValue });
  },
  // 关闭抽屉
  onCloseHistoryTimeLine(e) {
    // 打开弹窗，显示upload组件
    this.setData({ popupTimeLineVisible: false });
    setTimeout(() => {
      this.setData({ timeLineValue: [] });
    }, 500)
  },
  // 空方法，避免抽屉的滚动
  onDummyTouchMove() { },
  // 下拉菜单-材质
  onMaterialChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterSorter = that.data.filterSorter; // 排序
    const filtered = that.data.allData.filter(item => {
      const matchMaterial = (value === 'all') ? true : item.texture === value;
      return matchMaterial;
    });
    that.setData({
      filteredData: filterSorter ? filtered.reverse() : filtered, // 记录筛选数据
      Data: [],
      currentIndex: 0,
      noMoreData: false,
      filterMaterialValue: value
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
      'dropdownMaterial.value': value,
    });
  },
  // 下拉菜单-排序
  onSorterChange(e) {
    const that = this;
    let sorted = [...that.data.filteredData]; // 拷贝一份，避免直接改动原数组
    const filterMaterialValue = that.data.filterMaterialValue; // 排序
    const filtered = sorted.filter(item => {
      const matchMaterial = (value === 'all') ? true : item.texture === filterMaterialValue;
      return matchMaterial;
    });
    const data = filtered.reverse(); // 生成一个新的
    that.setData({
      Data: [],
      currentIndex: 0,
      filterSorter: true,
      filteredData: data, // 存储筛选记录数据
      'dropdownSorter.value': e.detail.value,
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
    });
  },
})