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
  STEP 1 - 概念创作与打包，列表页面

```
## 2.kyle_artowrk_primary_details

```tex
针对 kyle 的第一阶段 图稿过滤
针对文档功能：
  STEP 2 - 初步创意评审与预选定稿，内部的图稿详情页面
功能：
	对图稿标记初步审查
```

## 3.kyle_artowrk_ultimate_details

```tex
针对 kyle 的第二阶段 图稿过滤（最终的审稿）
针对文档功能：
  1.STEP 5 - Kyle 最终创意审查

功能：
	对图稿标记最终审查
```
## 4.shelley_artwork_detail

```bash
针对 shelley的可行分析响应界面，可以实现指派fmr与对图稿的可行性分析评估
针对文档：
	STEP 3 - 可行性与价格审核（WBO系统内）
功能：
	1.对图稿标记可行性
	2.指定fmr
```

## 5.fmr_artwork_detail

```bash
针对 fmr 的可行分析响应界面,由shelley进行指派后fmr才可以进行操作
针对文档：
	STEP 3 - 可行性与价格审核（WBO系统内）
功能：
	对图稿标记可行性
```

## 6.wbo_to_do与wbo_to_do_detail

```bash
作用：
	wbo_to_do展示待处理页面和最新页面，wbo_to_do_detail展示最新的页面，也就是可以看到整个图稿整体审核流程。 # 是否是全流程？
	具体还是需要待商议。
```

## 7.guest_selection_final_round

```bash
作用：
	对李雯上传的图稿进行第一轮客人标记，标记选中与淘汰。以及客人的评论。
针对文档：
	STEP 7 - 客户第一轮选稿与打样（仅限 Target 项目）

功能：
	1.第一轮客人标记
	2.客人的反馈评论标记
	3.根据客人要求，新增一个图稿（之前的审核自动标记完成）
```

## 8.designer_artwork_detail

```
作用：
	工厂稿上传，第一轮选中后，需要负责这份图稿的设计师上传工厂稿
针对文档：
	STEP 7 - 客户第一轮选稿与打样（仅限 Target 项目）

功能：
	1.查看反馈建议（选中，但是有建议）
	2.工厂稿上传（最多上传5张）
```

## 9.fmr_manager_assignment

```
作用：
	负责将工厂稿上传的分配给指定的FMR
针对文档：
	1.STEP 7 - 客户第一轮选稿与打样（仅限 Target 项目）

功能：
	1.先获取全部的FMR
	2.在进行指派FMR
```

## 10.fmr_factory_samples

```
作用：
	FMR负责将样品图上传

针对文档：
	STEP 8 - 工厂打样执行与 CAD 对比审查

功能：
	1.先获取全部的工厂，需要FMR进行指定工厂
	2.FMR负责上传样品照片
	3.FMR可以看到设计师对图稿的审查意见（需要设计师进行审查后才能查看）
```

## 11.designer_review_detail

```
作用：
	设计师负责将上传的样品图进行审查

针对文档：
	STEP 8 - 工厂打样执行与 CAD 对比审查

功能：
	1.需要设计师进行标记状态
	2.如果需要重新打样，就需要填写修正建议。
```

## 12.guest_selection_first_round

```
作用：
	对最终打完样的产品进行标记状态
针对文档：
	STEP 9 - 客户第二轮选稿与最终授奖（Final Award）
功能：
	1.客户第二轮的选中标记
```

## 13.方法

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

