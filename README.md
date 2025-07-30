# 采用的组件

```tex
组件文档地址：
	https://tdesign.tencent.com/miniprogram/getting-started 

主要使用当前组件的 排版，筛选，搜索，提示等功能。
```

# pages页面说明

## 1.wbo_artowrk_index
```tex
针对文档功能：
  1.STEP 1 - 概念创作与打包，列表页面

```
## 2.kyle_artowrk_primary_details
```tex
针对 kyle 的第一阶段 图稿过滤
针对文档功能：
  1.STEP 2 - 初步创意评审与预选定稿，内部的图稿详情页面

```

## 3.kyle_artowrk_ultimate_details
```tex
针对 kyle 的第二阶段 图稿过滤（最终的审稿）
针对文档功能：
  1.STEP 5 - Kyle 最终创意审查
```
## 4.shelley_artwork_detail

```bash
针对 shelley的可行分析响应界面，可以实现指派fmr与对图稿的可行性分析评估
针对文档：
	1.STEP 3 - 可行性与价格审核（WBO系统内）
```

## 5.fmr_artwork_detail

```bash
针对 fmr 的可行分析响应界面,由shelley进行指派后fmr才可以进行操作
针对文档：
	1.STEP 3 - 可行性与价格审核（WBO系统内）
```

## 6.wbo_to_do与wbo_to_do_detail

```bash
作用：
	wbo_to_do展示待处理页面和最新页面，wbo_to_do_detail展示最新的页面，也就是可以看到整个图稿整体审核流程。
	具体还是需要待商议。
```

## 4.方法

```JavaScript
// 存
wx.setStorageSync('userInfo', { name: 'Tom', age: 18 })

// 取
const user = wx.getStorageSync('userInfo') || {}
console.log(user)   // { name: 'Tom', age: 18 }

// 删
wx.removeStorageSync('userInfo')

// 清空所有
wx.clearStorageSync()
```

