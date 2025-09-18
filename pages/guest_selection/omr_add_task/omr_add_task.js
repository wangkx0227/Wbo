const utils = require('../../../utils/util')
Page({
  data: {
    line_plan_id: null, // lp id
    Data: [], // 页面展示数据变量
    allData: [],// 全部的数据
    userRole: null, // 角色
    userName: null, // 名称
    filteredData: [], // 筛选后的数据
    pageSize: 6, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    skeletonLoading: false, // 骨架控制变量
    scrollTop: 0, // 回到顶部变量
    seriesValue: null,  // 系列内容
    showSeriesDialog: false, // 系列弹出框
    seriesList: [], // 系列列表
    showFileDataDialog: false, // 附件弹出框
    fileList: [], // 附件列表
    fileDataList: [], // 资料列表
    showTaskDialog: false, // task弹窗
    taskValue: null, // task数量
    allocatePickerVisible: false, // task分配公司
    allocatePickerItemList: [
      {
        label: "南宁TD",
        value: "南宁TD",
      }, {
        label: "长沙TD",
        value: "长沙TD",
      }
    ],
    tdUserRoleList: [],
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
  // 首页数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    const line_plan_type = dataList.line_plan_type;// 当前的LP类型是TD还是AIE
    const trends_images = dataList.trends_images; // 资料
    const series_names_list = dataList.series_names_list; // 系列
    const td_user_role_list = dataList.td_user_role_list; // TD组长
    const task_list = dataList.task_list;// task数据
    task_list.forEach(item => {
      const task_id = item.id; // taks 的id
      const task_code = item.code || "暂无"; // taks 的code
      const task_leader = item.leader || "暂无"; // 指派的组长
      arrangeData.push({
        line_plan_type: line_plan_type,
        task_id: task_id,
        task_code: task_code,
        task_leader: task_leader,
        task_allocate: "暂无",
      })
    })
    // TD组长处理
    let tdUserRoleList = [];
    td_user_role_list.forEach(item => {
      tdUserRoleList.push({
        label: item.name,
        value: item.id,
      })
    });
    // 资料处理
    let fileDataList = [];
    trends_images.forEach(item => {
      fileDataList.push({
        "file_id": item.id,
        "file_name": item.imageURL.split("/").pop(),
      })
    });
    // 系列处理
    let seriesList = [];
    series_names_list.forEach(item => {
      seriesList.push({
        "series_id": item.id,
        "series_name": item.name,
      })
    });
    // 设置值
    this.setData({
      seriesList: seriesList,
      fileDataList: fileDataList,
      tdUserRoleList: tdUserRoleList,
    });
    return arrangeData // 全部数据
  },
  // 数据分页显示处理
  dataRequest(mode) {
    const that = this;
    const apiUserName = that.data.apiUserName;
    const line_plan_id = that.data.line_plan_id;
    utils.LoadDataList({
      page: that,
      data: { type: "get_create_lp_data", username: apiUserName, lp_id: line_plan_id },
      mode: mode
    }).then(list => { // list 就是data数据
      const arrangeData = that.dataStructure(list);
      that.setData({
        allData: arrangeData, // 初始数据保持不变
        filteredData: arrangeData
      })
      // 分页基于 filteredData
      const pageData = utils.readPageStructure(that); // 分页数据
      let totalRequests = that.data.pageSize;
      if (pageData.length !== totalRequests) {
        totalRequests = pageData.length;
      }
      // 针对刷新和第一次加载使用，tab切换使用
      if (mode === 'refresh' || mode === 'switch') {
        that.setData({
          Data: pageData
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
  // 生命周期函数
  onLoad(options) {
    const that = this;
    // if (!utils.LoginStatusAuthentication(that)) {
    //   // 未登录状态，函数已处理跳转逻辑
    //   return;
    // }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const apiUserName = wx.getStorageSync('apiUserName');
    const line_plan_id = options.line_plan_id; // lp的id
    that.setData({
      userRole: userRole,
      userName: userName,
      apiUserName: apiUserName,
      line_plan_id: line_plan_id,
    });
    this.dataRequest("init");
  },
  // 页面下拉刷新
  onPullDownRefresh() {
    if (this.data.isLoadingReachMore) return; // 如果正在加载更多，则禁止下拉刷新
    // 重置 currentIndex 让它从头开始访问
    this.setData({
      searchValue: "",
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
    console.log(111);
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
    if (that.data.currentIndex === that.data.filteredData.length) {
      that.setData({
        noMoreData: true
      })
    }
  },

  // 资料-打开
  onUpdateFileDataClick() {
    console.log(11);
    this.setData({ showFileDataDialog: true });
  },
  // 资料-关闭
  closeFileDataDialog() {
    this.setData({ showFileDataDialog: false });
  },
  // 资料上传-删除
  fileDataRemove(e) {
    const { index } = e.detail;
    const { fileList } = this.data;
    fileList.splice(index, 1);
    this.setData({
      fileList,
    });
  },
  // 资料上传-赋值
  fileDataSuccess(e) {
    const { files } = e.detail;
    this.setData({
      fileList: files,
    });
  },
  // 资料上传-提交
  onFileDataConfirm() {
    const that = this;
    const fileList = that.data.fileList; // 系列的值
    if (fileList.length === 0) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    }
    const fileUrls = fileList.map(f => f.url || f.response.url); // 文件临时路径
    const fileName = fileList.map(f => f.name || f.response.name); // 文件名称
    const line_plan_id = that.data.line_plan_id; // lp的id

    // 假数据
    that.setData({
      fileDataList: [{
        "file_id": 100,
        "file_name": fileName,
      }, ...that.data.fileDataList]
    })
    // 附件上传
    // wx.uploadFile({
    //   url: montageUrl + '/wbo/upload_task_image/',
    //   filePath: imageFileList[0].url, // 临时文件路径
    //   name: 'file',       // 与接口的 file 字段一致
    //   formData: {
    //     task_id: task_id,   // task ID
    //     AIT_designer2: true, // 默认设计师选中
    //   },
    //   success(res) {
    //     try {
    //       const data = JSON.parse(res.data);
    //       if (data.code === 200) {
    //         // 修改设计师标记状态，默认标记
    //         const data = {
    //           "type": "update_task",
    //           "task_id": task_id,
    //           "username": userName,
    //           "AIT_designer2": true,
    //         }
    //         // 数据提交
    //         utils.UpdateData({
    //           page: that,
    //           data: data,
    //           toastShow: false
    //         });
    //         // 更新数据
    //         const updatedData = that.data.Data.map(item => {
    //           if (item.id === task_id) {
    //             item["AIT_designer2"] = true;
    //             item["AIT_designer2_text"] = "已上传图稿";
    //           }
    //           if (item.timeline_id === timeline_id) {
    //             return {
    //               ...item,
    //               picture_list: [...item.picture_list, imageFileList[0].url]
    //             };
    //           }
    //           return item;
    //         })
    //         that.setData({
    //           Data: updatedData,
    //           popupFactoryArtworkVisible: false,
    //         });
    //         utils.showToast(that, "上传成功");
    //       } else {
    //         utils.showToast(that, "上传失败", "error");
    //       }
    //     } catch (e) {
    //       utils.showToast(that, "返回数据解析失败", "error");
    //     }
    //   },
    //   fail(err) {
    //     utils.showToast(that, "接口调用失败", "error");
    //   }
    // });
    utils.showToast(that, "提交成功")
    // setTimeout(() => {
    //   utils.showToast(that, "提交失败", "error")
    // }, 1000)
    that.closeFileDataDialog();
  },
  // 资料-删除
  onDeleteFileDataClick(e) {
    const that = this;
    const { file_id } = e.target.dataset;
    // 假数据
    wx.showModal({
      title: '提示',
      content: '是否删除资料',
      success(res) {
        if (res.confirm) {
          const updatedFileDataList = that.data.fileDataList.filter(item => item.file_id !== file_id);
          that.setData({
            fileDataList: updatedFileDataList
          });
          utils.showToast(that, "删除成功")
        }
      }
    })
  },

  // 系列-打开
  onCatectSeriesClick() {
    this.setData({ showSeriesDialog: true });
  },
  // 系列-监听输入框
  onSeriesInputChange(e) {
    this.setData({
      seriesValue: e.detail.value, // TDesign Input 取值用 e.detail.value
    });
  },
  // 系列-关闭
  closeSeriesDialog() {
    this.setData({ showSeriesDialog: false });
    setTimeout(() => {
      this.setData({ seriesValue: null, });
    }, 500)
  },
  // 系列-提交
  onSeriesDialogConfirm() {
    const that = this;
    const seriesValue = that.data.seriesValue; // 系列的值
    if (!seriesValue) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    }
    const line_plan_id = that.data.line_plan_id; // lp的id
    // 假数据
    that.setData({
      seriesList: [{
        "series_id": 110,
        "series_name": seriesValue,
      }, ...that.data.seriesList]
    })
    utils.showToast(that, "提交成功")
    // setTimeout(() => {
    //   utils.showToast(that, "提交失败", "error")
    // }, 1000)
    that.closeSeriesDialog();
  },
  // 资料-删除
  onDeleteSeriesDataClick(e) {
    const that = this;
    const { series_id } = e.target.dataset;
    // 假数据
    wx.showModal({
      title: '提示',
      content: '是否删除系列',
      success(res) {
        if (res.confirm) {
          const updatedSeriesList = that.data.seriesList.filter(item => item.series_id !== series_id);
          that.setData({
            seriesList: updatedSeriesList
          });
          utils.showToast(that, "删除成功")
        }
      }
    })
  },

  // task-弹窗
  onCreateTaskClick() {
    this.setData({ showTaskDialog: true });
  },
  // task-监听输入框
  onTaskInputChange(e) {
    let value = e.detail.value.replace(/\D/g, ""); // 去掉非数字
    this.setData({
      taskValue: value, // TDesign Input 取值用 e.detail.value
    });
  },
  // task-关闭
  closeTaskDialog() {
    this.setData({ showTaskDialog: false });
    setTimeout(() => {
      this.setData({ taskValue: null, });
    }, 500)
  },
  // task-提交
  onTasksDialogConfirm() {
    const that = this;
    let new_data = [];
    const taskValue = that.data.taskValue; // 系列的值
    if (!taskValue) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    };
    const line_plan_id = that.data.line_plan_id; // lp的id
    // 假数据添加
    for (let i = 0; i < taskValue; i++) {
      new_data.push({
        task_id: i + 1,
        task_code: `Jasonyu_2025_30296_00${i}`,
        allocate: "暂无"
      })
    }
    if (new_data.length !== 0) {
      that.setData({
        Data: [...new_data, ...that.data.Data]
      })
    }
    utils.showToast(that, "提交成功")
    // setTimeout(() => {
    //   utils.showToast(that, "提交失败", "error")
    // }, 1000)
    that.closeTaskDialog();
  },
  // TASK - 提交导入
  onTaskSubmit() {
    const that = this;
    utils.showToast(that, "提交")
  },
  // TASK - 删除
  onDeleteTaskClick(e) {
    const that = this;
    const task_id = e.target.dataset.task_id;
    wx.showModal({
      title: '提示',
      content: '是否删除TASK',
      success(res) {
        if (res.confirm) {
          const updatedData = that.data.Data.filter(item => item.task_id !== task_id);
          that.setData({
            Data: updatedData
          });
          utils.showToast(that, "删除成功")
        }
      }
    })

  },

  // 图稿公司分配
  onAllocateClick(e) {
    const task_id = e.target.dataset.task_id;
    this.setData({
      task_id: task_id,
      allocatePickerVisible: true
    });
  },
  // 关闭 AIT筛选器
  onAllocateClosePicker() {
    this.setData({
      task_id: null,
      allocatePickerValue: null,
      allocatePickerVisible: false,
    });
  },
  // 提交 AIT筛选器
  onAllocatePickerChange(e) {
    const that = this;
    const userName = that.data.userName;
    const task_id = that.data.task_id;
    const { value } = e.detail;
    const updatedData = that.data.Data.map(item => {
      if (item.task_id === task_id) {
        item["allocate"] = value;
      };
      return item;
    })
    that.setData({
      Data: updatedData
    });
    that.onAllocateClosePicker();
  },
})
