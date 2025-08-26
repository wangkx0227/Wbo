const app = getApp();
const utils = require('../../../utils/util')
Page({
  data: {
    lineplan_id: null, // 存储的lp id值
    Data: [], // 页面渲染数据存储列表
    allData: [], // 全部的数据
    filteredData: [],
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
    // 筛选框变量-材质
    dropdownMaterial: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部材质',
        },
      ],
    },
    filterMaterialValue: "all", // 筛选存储变量
    // 图稿状态
    dropdownArtworkStatus: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部状态',
        },
        {
          value: true,
          label: '已上传图稿',
        },
        {
          value: false,
          label: '未上传图稿',
        },
      ],
    },
    filterArtworkStatusValue: "all", // 筛选存储变量
    // 设计师分配人与设计师列表
    pickerTitle: "",
    pickerVisible: false,
    pickerItemList: [], // 全部的用户列表的数据
    AITDesignerList: [],
    AITManagerList: [],
    // 设计师分配人对图稿的修改意见填写
    dialogVisible: false, // 评论弹出层变量
    dialogValue: "",
  },
  // 数据结构处理
  dataStructure(dataList) {
    let arrangeData = [];
    let material_list = [];
    const taskTimeLineData = {}; // 时间线数据
    const image_url = dataList.WBO_URL
    const task_list = dataList.task_list
    const userName = this.data.userName;
    const position_type = this.data.position_type;
    for (const index in task_list) {
      const task_id = task_list[index].id;
      const AIT_designer1 = task_list[index].AIT_designer1; // 设计师
      const AIT_designer2 = task_list[index].AIT_designer2; // 设计师标记
      const AIT_manager1 = task_list[index].AIT_manager1; // 设计师分配人
      const AIT_manager2 = task_list[index].AIT_manager2; // 设计师manager确认
      let data_dict = {
        id: task_id,
        code: task_list[index].code,
        title: task_list[index].title,
        texture: task_list[index].texture,
        name: task_list[index].AIT_designer1 || "未指定请选择",
        AIT_designer2: AIT_designer2,
        AIT_designer2_text: AIT_designer2 ? "已上传图稿" : "未上传图稿",
        AIT_manager1: AIT_manager1 || "未指定请选择",
        AIT_manager2_text: AIT_manager2 ? "已确认" : "未确认",
      }
      // 可行性分析，shelley 选3直接跳过，不在显示
      if (data_dict["confirmed2"] === 3) {
        continue
      }
      /*
      只有当前用户才可以看到自己的图稿并上传
      设计师：只显示自己的
      设计部经理：只显示被分配的
      AIT分配人：显示全部的
    */
      if (position_type === "设计经理") {
        if (AIT_manager1 === userName) {
          arrangeData.push(data_dict);
        }
      } else if (position_type === "AIT") {
        if (AIT_designer1 === userName) {
          arrangeData.push(data_dict);
        }
      } else if (position_type === "AIT分配人") {
        arrangeData.push(data_dict);
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
        // shelley 标记
        data_dict["confirmed2"] = confirmed2;
        data_dict["picture_list"] = picture_list;
        // 第一条时间线的id
        data_dict["timeline_id"] = timeline_id;
      }
      // 时间线数据
      taskTimeLineData[`${task_id}`] = timeLineData;
      // 材质
      material_list.push(data_dict["texture"].trim());
    }
    // 筛选条件加入过滤整合
    const material = utils.filterDataProcess(material_list);
    const options = this.data.dropdownMaterial.options;
    // 只有 筛选框的列表为1（内部默认有一条数据）才会添加
    if (options.length === 1) {
      this.setData({
        "dropdownMaterial.options": options.concat(material)
      })
    }
    return {
      arrangeData,
      taskTimeLineData
    }; // 返回整理的结构体
  },
  // 后端设计师分配人与设计师图稿请求
  dataDesignerRequest(mode) {
    const that = this;
    const development_id = that.data.development_id;
    utils.LoadDataList({
      page: that,
      data: {
        "type": "get_lps_data",
        "project_id": development_id,
        "username": "Jasonyu" // 访问人必须是管理员
      },
      mode: mode,
      showLoading: false,
      showSkeleton: false,
    }).then(list => { // list 就是data数据
      if (list.lps.length !== 0) {
        let AITDesignerList = [];
        let AITManagerList = [];
        const lp_members = list.lps[0].lp_members;
        for (let i = 0; i < lp_members.length; i++) {
          const name = lp_members[i][0];
          const role = lp_members[i][1];
          if (role === 'AIT') {
            AITDesignerList.push({
              label: name,
              value: name
            })
          }
          if (role === 'AIT分配人') {
            AITManagerList.push({
              label: name,
              value: name
            })
          }
          if (role === '设计经理') {
            AITManagerList.push({
              label: name,
              value: name
            })
          }
        }
        that.setData({
          AITDesignerList: AITDesignerList,
          AITManagerList: AITManagerList
        })
      }
    });
  },
  // 后端数据请求
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
  /* 生命周期函数--监听页面加载 */
  onLoad(options) {
    const that = this;
    if (!utils.LoginStatusAuthentication(that)) {
      // 未登录状态，函数已处理跳转逻辑
      return;
    }
    const userRole = wx.getStorageSync('userRole');
    const userName = wx.getStorageSync('userName');
    const position_list = wx.getStorageSync('position_list'); // 实际的权限列表
    const position_type = position_list.find(item =>
      ["设计经理", "AIT", "AIT分配人"].includes(item)
    ) || "";
    const lineplan_id = options.lineplan_id || ''; // 首页跳转后的存储的id值
    const development_id = options.development_id || ''; // 整个开发案的id
    that.setData({
      lineplan_id: lineplan_id, // 记录全部的id数据
      development_id: development_id, // 开发案id，通过它获取设计师
      userRole: userRole,
      userName: userName,
      position_list: position_list,
      position_type: position_type
    })
    that.dataRequest('init');
    that.dataDesignerRequest('init');
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
    const montageUrl = app.globalData.montageUrl; // 请求后端接口
    const task_id = that.data.task_id;
    const userName = that.data.userName;
    const timeline_id = that.data.timeline_id;
    const imageFileList = that.data.imageFileList;
    if (imageFileList.length === 0) {
      utils.showToast(that, "选择图片后上传", "error");
      return;
    }
    wx.uploadFile({
      url: montageUrl + '/wbo/upload_task_image/',
      filePath: imageFileList[0].url, // 临时文件路径
      name: 'file',       // 与接口的 file 字段一致
      formData: {
        task_id: task_id,   // task ID
        AIT_designer2: true, // 默认设计师选中
      },
      success(res) {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            // 修改设计师标记状态，默认标记
            const data = {
              "type": "update_task",
              "task_id": task_id,
              "username": userName,
              "AIT_designer2": true,
            }
            // 数据提交
            utils.UpdateData({
              page: that,
              data: data,
              toastShow: false
            });
            // 更新数据
            const updatedData = that.data.Data.map(item => {
              if (item.id === task_id) {
                item["AIT_designer2"] = true;
                item["AIT_designer2_text"] = "已上传图稿";
              }
              if (item.timeline_id === timeline_id) {
                return {
                  ...item,
                  picture_list: [...item.picture_list, imageFileList[0].url]
                };
              }
              return item;
            })
            that.setData({
              Data: updatedData,
              popupFactoryArtworkVisible: false,
            });
            utils.showToast(that, "上传成功");
          } else {
            utils.showToast(that, "上传失败", "error");
          }
        } catch (e) {
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
  // 下拉菜单-材质
  onMaterialChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterArtworkStatusValue = that.data.filterArtworkStatusValue;
    const filtered = that.data.allData.filter(item => {
      const matchMaterial = (value === 'all') ? true : item.texture === value;
      const matchArtworkStatus = (filterArtworkStatusValue === 'all') ? true : item.AIT_designer2 === filterArtworkStatusValue;
      return matchMaterial && matchArtworkStatus;
    });
    that.setData({
      filteredData: filtered, // 记录筛选数据
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
  // 下拉菜单-图稿上传状态
  onStatusChange(e) {
    const that = this;
    const value = e.detail.value; // 筛选框内容
    const filterMaterialValue = that.data.filterMaterialValue;
    const filtered = that.data.allData.filter(item => {
      const matchArtworkStatus = (value === 'all') ? true : item.AIT_designer2 === value;
      const matchMaterial = (filterMaterialValue === 'all') ? true : item.texture === filterMaterialValue;
      return matchMaterial && matchArtworkStatus;
    });
    that.setData({
      filteredData: filtered, // 记录筛选数据
      Data: [],
      currentIndex: 0,
      noMoreData: false,
      filterArtworkStatusValue: value
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
      'dropdownArtworkStatus.value': value,
    });
  },
  // 关闭 选择器
  onClosePicker(e) {
    /*
      pickerVisible：筛选器显示变量
    */
    this.setData({
      task_id: null,
      pickerVisible: false,
    });
    setTimeout(() => {
      this.setData({
        pickerTitle: "",
        pickerItemList: [],
      });
    }, 500)
  },
  // 打开 选择器
  onOpenPicker(e) {
    const {
      type,
      taskId
    } = e.currentTarget.dataset; // task id值
    if (type === "manager") {
      this.setData({
        pickerTitle: "请选择图稿分配人",
        pickerItemList: this.data.AITManagerList,
      });
    } else {
      this.setData({
        pickerTitle: "请选择图稿设计师",
        pickerItemList: this.data.AITDesignerList,
      });
    }
    this.setData({
      type: type, // 选中类型
      task_id: taskId,
      pickerVisible: true,
    });
  },
  // 提交 选择器
  onPickerChange(e) {
    /*
      pickerVisible：筛选器显示变量
      pickerValue： 选中的值
    */
    const that = this;
    const type = that.data.type;
    const task_id = that.data.task_id;
    const userName = that.data.userName;
    const {
      value,
      label
    } = e.detail;
    let data = {
      "type": "update_task",
      "task_id": task_id,
      "username": userName
    }
    if (type === "designer") {
      data["AIT_designer1"] = value[0]
    } else {
      data["AIT_manager1"] = value[0]
    }
    this.setData({
      task_id: null,
      pickerVisible: false,
    });
    utils.UpdateData({
      page: that,
      data: data,
      message: `已指派${label}`
    });
    // 修改新的fmr时，重置之前的选中
    const updatedData = that.data.Data.map(item => {
      if (item.id === task_id) {
        if (type === "designer") {
          item["name"] = value[0];
        } else {
          item["AIT_manager1"] = value[0];
        }
      }
      return item;
    })
    that.setData({
      Data: updatedData
    });
  },
  // 修改建议-评论-打开
  onOpenDialog(e) {
    const {
      taskId,
      timelineId,
      designerName
    } = e.currentTarget.dataset;
    this.setData({
      dialogVisible: true,
      timeline_id: timelineId,
      task_id: taskId,
      designer_name: designerName
    });
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
    const action = e.type; // "confirm" 或 "cancel"
    const {
      task_id,
      timeline_id,
      dialogValue,
      userName,
      designer_name
    } = that.data; // 输入的评论的数据

    if (action === 'confirm') {
      if (!dialogValue) {
        utils.showToast(that, "无建议无法提交", "warning");
        return;
      }
      if (!designer_name) {
        utils.showToast(that, "请选择设计师", "error");
        return;
      } else {
        utils.UpdateData({
          page: that,
          data: {
            "type": "update_timeline",
            "timeLine_id": timeline_id,
            "username": userName, // 参数需要修改
            "name": userName, // 参数需要修改
            "name_str": userName, // 评论人
            "comment": dialogValue, // 内容
          },
          message: "修改建议填写完成"
        })
        // 改变原来设计师确认状态
        utils.UpdateData({
          page: that,
          data: {
            "type": "update_task",
            "task_id": task_id,
            "username": userName,
            "AIT_designer2": false, // 重置设计师确认状态
          },
          toastShow: false
        });
        // 重置设计师图稿上传状态
        const updatedData = that.data.Data.map(item => {
          if (item.id === task_id) {
            item["AIT_designer2"] = false;
            item["AIT_designer2_text"] = "未上传图稿";
          }
          return item;
        })
        // 保存状态
        that.setData({
          Data: updatedData,
        });
        // 更新时间线
        utils.updateTimeLine(that, task_id, timeline_id, dialogValue, userName);
      }
    } else if (action === 'cancel') {
      utils.showToast(that, "修改建议取消", "warning");
    }
    this.setData({
      dialogId: null,
      dialogVisible: false,
    });
    setTimeout(() => {
      this.setData({
        dialogValue: "",
      })
    }, 500)
  },
  // 主管提交确认
  managerConfirmStatus() {

  }
})