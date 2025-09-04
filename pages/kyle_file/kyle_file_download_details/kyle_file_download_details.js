const app = getApp();
const utils = require('../../../utils/util')
const montageUrl = app.globalData.montageUrl;
Page({
  data: {
    lineplan_id: null, // id 值
    Data: [], // 存储数据
    allData: [], // 全部的值
    filteredData: [], // 筛选后的数据
    tabBar: null, // 记录切换值
    pageSize: 10, // 每次加载几条数据
    currentIndex: 0, // 当前加载到第几个ID
    skeletonLoading: false,
    noMoreData: false, // 数据是否全部加载完毕
    isDownRefreshing: false, // 下拉刷新状态
    isLoadingReachMore: false, // 滚动底部加载数据
    userName: null, // 用户名
    userRloe: null,  // 角色名
    // 筛选框变量-1
    dropdownYear: {
      value: 'all',
      options: [
        {
          value: 'all',
          label: '全部',
        },
      ],
    },
    filterTemplate: 'all',
    // 筛选框变量-2
    dropdownSorter: {
      value: 'default',
      options: [
        {
          value: 'default',
          label: '默认',
        },
        {
          value: 'reverse',
          label: '从低到高排序',
        },
      ],
    },
    filterSorter: false, // 排序筛选条件
  },

  // 数据处理
  dataStructure(dataList) {
    let arrangeData = []; // 显示数据
    // let sort_data = {};
    // for (let i = 0; i < dataList.length; i++) {
    //   const data = dataList[i];
    //   const lp_name = dataList[i].filename.split(".")[0];
    //   dataList[i]["lp_name"] = lp_name;
    //   const uploaded_at = dataList[i].uploaded_at.split(" ")[0];
    //   const time = sort_data[uploaded_at];
    //   if (!time) {
    //     sort_data[uploaded_at] = [data,];
    //   } else {
    //     sort_data[uploaded_at].push(data)
    //   }
    // }
    // 数据处理
    for (const date in dataList) {
      const array = dataList[date];
      console.log(array);
      arrangeData.push({
        "date": date,
        "data_list": array
      });
    }
    return arrangeData
  },
  // 后端请求
  dataRequest(mode) {
    const that = this;
    const development_id = 20116;
    const requestData = {
      "path": "导出的PPT",
      "project_id": development_id,
    }
    wx.request({
      url: montageUrl + '/wbo/factory_information_app/files3/',
      method: "GET",
      data: requestData,
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data || [];
          const arrangeData = that.dataStructure(data);
          that.setData({
            allData: arrangeData,
            filteredData: arrangeData,
          });
          const pageData = utils.readPageStructure(that); // 分页数据
          let totalRequests = that.data.pageSize;
          if (pageData.length !== totalRequests) {
            totalRequests = pageData.length;
          };
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
        } else {
          utils.showToast(that, '数据请求失败', "error");
        }
      },
      fail(err) {
        utils.showToast(that, '网络连接失败', "error");
      },
      complete: () => {
        wx.hideLoading();
        that.setData({
          skeletonLoading: false,
        })
      }
    })
  },
  // 请求数据
  onLoad(options) {
    wx.showLoading({ title: '加载中...' });
    const userName = wx.getStorageSync('userName')
    const userRole = wx.getStorageSync('userRole')
    const development_id = options.development_id; // 开发案id
    this.setData({
      userName: userName,
      userRole: userRole,
      development_id: development_id,
      skeletonLoading: true,
    })
    this.dataRequest('init');
  },
  // 回到顶部
  onToTop(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
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
  //  实时监听滚动距离，把这个值传给回到顶部的按钮，让它知道是否应该出现
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop
    });
  },
  // 排序-1
  onYearChange(e) {

  },
  // 排序-2
  onSorterChange(e) {
    const that = this;
    const filterTemplate = that.data.filterTemplate;
    let sorted = [...that.data.filteredData]; // 拷贝一份，避免直接改动原数组
    // const filtered = sorted.filter(item => {
    //   const matchName = (filterTemplate === 'all') ? true : item.line_plan_client === filterTemplate;
    //   return matchName;
    // });
    // sorted = filtered.reverse(); // 生成一个新的
    that.setData({
      Data: [],
      currentIndex: 0,
      filterSorter: true,
      filteredData: sorted.reverse(), // 存储筛选记录数据
      'dropdownSorter.value': e.detail.value,
    });
    const firstPage = utils.readPageStructure(that);
    that.setData({
      Data: firstPage, // 显示
      currentIndex: firstPage.length,
    });
  },
  // 导出附件
  exportAttachments(e) {
    const that = this;
    const userName = that.data.userName;
    const fileUrl = e.currentTarget.dataset.fileUrl;
    wx.request({
      url: montageUrl + "/wbo/export-file-notification/", // 请求地址
      method: 'POST',
      data: {
        "url": [
          montageUrl + fileUrl,
        ],
        "username": userName
      },
      header: {
        'content-type': 'application/json' // 根据后端要求设置
      },
      success(res) {
        if (res.statusCode === 200) {
          utils.showToast(that, "请查看微信通知");
        } else {
          utils.showToast(that, "导出失败", "error");
        }
      },
      fail(err) {
        utils.showToast(that, "网络错误", "error");
      }
    });
  },
})