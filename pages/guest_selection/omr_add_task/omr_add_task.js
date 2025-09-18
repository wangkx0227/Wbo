const app = getApp();
const utils = require('../../../utils/util')
Page({
  data: {
    line_plan_id: null, // lp id
    Data: [], // 页面展示数据变量
    allData: [],// 全部的数据
    userRole: null, // 角色
    userName: null, // 名称
    filteredData: [], // 筛选后的数据
    pageSize: 10, // 每次加载多少条数据
    currentIndex: 0, // 加载到数据的第几个索引
    // 下拉刷新与滚动底部刷新使用变量
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    noMoreData: false,    // 数据是否全部加载完毕
    skeletonLoading: true, // 骨架控制变量
    scrollTop: 0, // 回到顶部变量
    seriesValue: null,  // 系列内容
    showSeriesDialog: false, // 系列弹出框
    seriesList: [], // 系列列表
    showFileDataDialog: false, // 附件弹出框
    fileList: [], // 附件列表
    fileDataList: [], // 资料列表
    showTaskDialog: false, // task弹窗
    taskValue: null, // task数量
    leaderPickerVisible: false, // task分配公司
    tdUserRoleList: [], // 组长列表
    titleValue: null, // 标题
    showTileDialog: false, // 标题弹窗
    materialList: [], // 材质列表
    seriesPickerVisible: false,// 系列
    materialPickerVisible: false,// 材质
    showCodeDialog: false, // code
    codeValue: null, // code 值
  },
  // 补充函数 
  shortenFileName(filename, frontLen = 10, backLen = 8) {
    if (filename.length <= frontLen + backLen) {
      return filename; // 太短就不省略
    }
    return filename.substring(0, frontLen) + "..." + filename.substring(filename.length - backLen);
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
    const material_list = dataList.material_names_list; // 材质列表
    const task_list = dataList.task_list;// task数据

    task_list.forEach(item => {
      const task_id = item.id; // taks 的id
      const task_code = item.code || "未生成"; // taks 的code
      const task_leader = item.leader || "未指派"; // 指派的组长
      const task_series = item.series || "未指定";// 系列
      const task_title = item.title || "未填写";// 名称
      const task_material = item.material || "未选择";// 材质
      arrangeData.push({
        line_plan_type: line_plan_type,
        task_id: task_id,
        task_code: task_code,
        task_leader: task_leader,
        task_series: task_series,
        task_title: task_title,
        task_material: task_material
      })
    })
    // TD组长处理
    let tdUserRoleList = [];
    td_user_role_list.forEach(item => {
      tdUserRoleList.push({
        label: item.name,
        value: item.name,
      })
    });
    // 资料处理
    let fileDataList = [];
    trends_images.forEach(item => {
      const filename = item.imageURL.split("/").pop();
      const shortName = this.shortenFileName(filename);
      fileDataList.push({
        "file_id": item.id,
        "file_name": shortName,
      })
    });
    // 系列处理
    let seriesList = [];
    series_names_list.forEach(item => {
      seriesList.push({
        "value": item.id,
        "label": item.name,
      })
    });
    // 材质处理
    let materialList = [];
    material_list.forEach(item => {
      materialList.push({
        label: item,
        value: item,
      })
    });
    // 设置值
    this.setData({
      seriesList: seriesList,
      fileDataList: fileDataList,
      materialList: materialList,
      tdUserRoleList: tdUserRoleList,
    });
    return arrangeData.sort((a, b) => a.task_id - b.task_id); // 进行排序
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
    const userName = that.data.userName;
    const fileList = that.data.fileList; // 系列的值
    const line_plan_id = that.data.line_plan_id;
    const montageUrl = app.globalData.montageUrl; // 请求后端接口
    if (fileList.length === 0) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    }
    const fileUrls = fileList.map(f => f.url || f.response.url); // 文件临时路径
    // 附件上传
    wx.uploadFile({
      url: montageUrl + '/wbo/upload_create_lp_task_image/',
      filePath: fileUrls[0], // 临时文件路径
      name: 'file',       // 与接口的 file 字段一致
      formData: {
        image_type: 2,
        lp_id: line_plan_id,   // task ID
        username: userName || "Jasonyu",
      },
      success(res) {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            let fileDataList = [];
            data.lp_data.trends_images.forEach(item => {
              const filename = item.imageURL.split("/").pop();
              const shortName = that.shortenFileName(filename);
              fileDataList.push({
                "file_id": item.id,
                "file_name": shortName,
              })
            });
            that.setData({
              fileDataList: fileDataList
            });
            utils.showToast(that, "上传成功");
            that.closeFileDataDialog();
          } else {
            utils.showToast(that, "上传失败", "error");
          }
        } catch (e) {
          utils.showToast(that, "返回数据解析失败", "error");
        }
      },
      fail(err) {
        console.log(err);
        utils.showToast(that, "接口调用失败", "error");
      }
    });
  },
  // 资料-删除
  onDeleteFileDataClick(e) {
    const that = this;
    const userName = that.data.userName;
    const { file_id } = e.target.dataset;
    wx.showModal({
      title: '提示',
      content: '是否删除资料',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '加载中...' });
          utils.UpdateData({
            page: that,
            data: {
              "type": "update_create_lp_image",
              "image_id": file_id,
              "hide": 1,
              "username": userName || "Jasonyu"
            },
            toastShow: false
          }).then(item => {
            const data = item.data;
            if (data.code === 200) {
              const updatedFileDataList = that.data.fileDataList.filter(item => item.file_id !== file_id);
              that.setData({
                fileDataList: updatedFileDataList
              });
              utils.showToast(that, "删除成功")
            } else {
              utils.showToast(that, "删除失败", "error");
            }
            wx.hideLoading();
          })

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
    const userName = that.data.userName;
    const line_plan_id = that.data.line_plan_id;
    const seriesValue = that.data.seriesValue; // 系列的值
    if (!seriesValue) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    }
    utils.UpdateData({
      page: that,
      data: {
        "type": "add_create_lp_series",
        "lp_id": line_plan_id,
        "name": seriesValue,
        "username": userName || "Jasonyu"
      },
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const seriesList = data.lp_data.series_names_list.map(item => {
          return { value: item.id, label: item.name }
        })
        that.setData({
          seriesList: seriesList
        });
        utils.showToast(that, "添加成功");
        that.closeSeriesDialog();
      } else {
        utils.showToast(that, "添加失败", "error");
      }
    })
  },
  // 系列-删除
  onDeleteSeriesDataClick(e) {
    const that = this;
    const userName = that.data.userName;
    const { series_id } = e.target.dataset;
    // 假数据
    wx.showModal({
      title: '提示',
      content: '是否删除系列',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '加载中...' });
          utils.UpdateData({
            page: that,
            data: {
              "type": "update_create_lp_series",
              "series_id": series_id,
              "hide": 1,
              "username": userName || "Jasonyu"
            },
            toastShow: false
          }).then(item => {
            const data = item.data;
            if (data.code === 200) {
              const updatedSeriesList = that.data.seriesList.filter(item => item.value !== series_id);
              that.setData({
                seriesList: updatedSeriesList
              });
              utils.showToast(that, "删除成功")
            } else {
              utils.showToast(that, "删除失败", "error");
            }
            wx.hideLoading();
          })
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
  // TASK - 提交导入-暂时不用
  onTaskSubmit() {
    const that = this;
    utils.showToast(that, "提交")
  },
  // TASK - 删除
  onDeleteTaskClick(e) {
    const that = this;
    const task_id = e.target.dataset.task_id;
    const userName = that.data.userName;
    wx.showModal({
      title: '提示',
      content: '是否删除TASK',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '加载中...' });
          utils.UpdateData({
            page: that,
            data: {
              "type": "update_create_lp_task",
              "task_id": task_id,
              "hide": 1,
              "username": userName || "Jasonyu"
            },
            toastShow: false
          }).then(item => {
            const data = item.data;
            if (data.code === 200) {
              const updatedData = that.data.Data.filter(item => item.task_id !== task_id);
              that.setData({
                Data: updatedData
              });
              utils.showToast(that, "删除成功");
            } else {
              utils.showToast(that, "删除失败", "error");
            }
            wx.hideLoading();
          })
        }
      }
    })

  },
  // task-提交
  onTasksDialogConfirm() {
    const that = this;
    const userName = that.data.userName;
    const taskValue = that.data.taskValue; // 系列的值
    const line_plan_id = that.data.line_plan_id; // lp的id
    const userInfo = wx.getStorageSync('userInfo');
    if (!taskValue) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    };
    let user_id = null;
    if (userInfo) {
      user_id = userInfo.fmr.user_id;
    };
    let post_data = {
      "type": "add_create_lp_task",
      "lp_id": line_plan_id,
      "number": parseInt(taskValue),
      "user_role_id": user_id || 5,
      "username": userName || "Jasonyu"
    };
    wx.showLoading({ title: '加载中...' });
    utils.UpdateData({
      page: that,
      data: post_data,
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const dataList = data.data;
        const arrangeData = that.dataStructure(dataList);
        that.setData({
          allData: arrangeData, // 初始数据保持不变
          filteredData: arrangeData,
          currentIndex: 0, // 索引重置
        })
        // 分页基于 filteredData
        const pageData = utils.readPageStructure(that); // 分页数据
        let totalRequests = that.data.pageSize;
        if (pageData.length !== totalRequests) {
          totalRequests = pageData.length;
        };
        that.setData({
          Data: pageData,
        })
        that.setData({
          currentIndex: that.data.currentIndex + pageData.length // 记录下标索引
        });
        utils.showToast(that, "提交成功")
        that.closeTaskDialog();
      } else {
        utils.showToast(that, "选择失败", "error");
      };
      wx.hideLoading();
    })
  },
  // 图稿组长-选择
  onAllocateClick(e) {
    const task_id = e.target.dataset.task_id;
    this.setData({
      task_id: task_id,
      leaderPickerVisible: true
    });
  },
  // 图稿组长-关闭
  onAllocateClosePicker() {
    this.setData({
      task_id: null,
      leaderPickerVisible: false,
    });
  },
  // 图稿组长-提交
  onAllocatePickerChange(e) {
    const that = this;
    const userName = that.data.userName;
    const task_id = that.data.task_id;
    const { value } = e.detail;
    utils.UpdateData({
      page: that,
      data: {
        "type": "update_create_lp_task",
        "task_id": task_id,
        "leader": value[0],
        "username": userName || "Jasonyu"
      },
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const updatedData = that.data.Data.map(item => {
          if (item.task_id === task_id) {
            item["task_leader"] = value;
          };
          return item;
        })
        that.setData({
          Data: updatedData
        });
        utils.showToast(that, "选择成功");
        that.onAllocateClosePicker();
      } else {
        utils.showToast(that, "选择失败", "error");
      }
    })
  },
  // 标题-选择
  onTitleClick(e) {
    const task_id = e.target.dataset.task_id;
    this.setData({
      task_id: task_id,
      showTitleDialog: true
    });
  },
  // 标题-关闭
  closeTitleDialog() {
    this.setData({
      task_id: null,
      titleValue: null,
      showTitleDialog: false,
    });
  },
  // 标题监听
  onTitleInputChange(e) {
    this.setData({
      titleValue: e.detail.value, // TDesign Input 取值用 e.detail.value
    });
  },
  // 标题提交
  onTitleDialogConfirm() {
    const that = this;
    const task_id = that.data.task_id;
    const userName = that.data.userName;
    const titleValue = that.data.titleValue; // 系列的值
    if (!titleValue) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    };
    utils.UpdateData({
      page: that,
      data: {
        "type": "update_create_lp_task",
        "task_id": task_id,
        "title": titleValue,
        "username": userName || "Jasonyu"
      },
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const updatedData = that.data.Data.map(item => {
          if (item.task_id === task_id) {
            item["task_title"] = titleValue;
          };
          return item;
        })
        that.setData({
          Data: updatedData
        });
        utils.showToast(that, "提交成功")
        that.closeTitleDialog();
      } else {
        utils.showToast(that, "提交失败", "error");
      }
    })


  },
  // 系列-打开
  onSeriesClick(e) {
    const task_id = e.target.dataset.task_id;
    this.setData({
      task_id: task_id,
      seriesPickerVisible: true
    });
  },
  //系列-关闭
  onSeriesClosePicker() {
    this.setData({
      task_id: null,
      seriesPickerVisible: false,
    });
  },
  // 系列-提交
  onSeriesPickerChange(e) {
    const that = this;
    const userName = that.data.userName;
    const task_id = that.data.task_id;
    const { value, label } = e.detail;
    utils.UpdateData({
      page: that,
      data: {
        "type": "update_create_lp_task",
        "task_id": task_id,
        "series": value[0],
        "username": userName || "Jasonyu"
      },
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const updatedData = that.data.Data.map(item => {
          if (item.task_id === task_id) {
            item["task_series"] = label;
          };
          return item;
        })
        that.setData({
          Data: updatedData
        });
        utils.showToast(that, "选择成功");
        that.onAllocateClosePicker();
      } else {
        utils.showToast(that, "选择失败", "error");
      }
    })
  },
  // 材质-打开
  onMaterialClick(e) {
    const task_id = e.target.dataset.task_id;
    this.setData({
      task_id: task_id,
      materialPickerVisible: true
    });
  },
  //材质-关闭
  onMaterialClosePicker() {
    this.setData({
      task_id: null,
      materialPickerVisible: false,
    });
  },
  // 材质-提交
  onMaterialPickerChange(e) {
    const that = this;
    const userName = that.data.userName;
    const task_id = that.data.task_id;
    const { value, label } = e.detail;
    utils.UpdateData({
      page: that,
      data: {
        "type": "update_create_lp_task",
        "task_id": task_id,
        "material": value[0],
        "username": userName || "Jasonyu"
      },
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const updatedData = that.data.Data.map(item => {
          if (item.task_id === task_id) {
            item["task_material"] = label;
          };
          return item;
        })
        that.setData({
          Data: updatedData
        });
        utils.showToast(that, "选择成功");
        that.onAllocateClosePicker();
      } else {
        utils.showToast(that, "选择失败", "error");
      }
    })
  },
  // code-选择
  onCodeClick(e) {
    const task_id = e.target.dataset.task_id;
    this.setData({
      task_id: task_id,
      showCodeDialog: true
    });
  },
  // code-关闭
  closeCodeDialog() {
    this.setData({
      task_id: null,
      codeValue: null,
      showCodeDialog: false,
    });
  },
  // code-监听
  onCodeInputChange(e) {
    this.setData({
      codeValue: e.detail.value, // TDesign Input 取值用 e.detail.value
    });
  },
  // code-提交
  onCodeDialogConfirm() {
    const that = this;
    const task_id = that.data.task_id;
    const userName = that.data.userName;
    const codeValue = that.data.codeValue; // 系列的值
    if (!codeValue) {
      utils.showToast(that, "填写后再提交", "error")
      return;
    };
    
    utils.UpdateData({
      page: that,
      data: {
        "type": "update_create_lp_task",
        "task_id": task_id,
        "code": codeValue,
        "username": userName || "Jasonyu"
      },
      toastShow: false
    }).then(item => {
      const data = item.data;
      if (data.code === 200) {
        const updatedData = that.data.Data.map(item => {
          if (item.task_id === task_id) {
            item["task_code"] = codeValue;
          };
          return item;
        })
        that.setData({
          Data: updatedData
        });
        utils.showToast(that, "提交成功")
        that.closeCodeDialog();
      } else {
        utils.showToast(that, "提交失败", "error");
      }
    })
  },
})
