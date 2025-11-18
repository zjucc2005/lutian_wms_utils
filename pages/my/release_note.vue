<template>
    <uni-collapse>
        <uni-collapse-item v-for="(note, index) in notes" :title="`V${note.ver}`" :key="index" open>
            <view class="content">
                <view v-for="line in note.content">{{ line }}</view>
            </view>
        </uni-collapse-item>
    </uni-collapse>
</template>

<script>
    export default {
        data() {
            return {
                notes: [
                    { ver: '1.5.6', timestamp: '2025-11-18',
                      content: ['1.[原料仓]增加适配采购退料单出库；',
                                '2.[原料仓]库内调拨增加多人模式，可操作其他仓管员的物料；',
                                '3.库存看板增加计时器；']},
                    { ver: '1.5.4', timestamp: '2025-11-11',
                      content: ['1.库内调拨在加载单据信息后，增加支持扫码物料编码进入选择调拨；',
                                '2.库内调拨在勾选后，可以调整选择行的调拨数量；',
                                '3.库内调拨和出库增加当日新增生产发料通知单的提醒；',
                                '4.物料详情增加产品简称字段（可编辑）；']},
                    { ver: '1.5.0', timestamp: '2025-11-06',
                      content: ['1.[原料仓]出库流程适配简易生产领料单；',
                                '2.[原料仓]修复出库时可以连点导致重复出库的问题；',
                                '3.库存看板调整；']},
                    { ver: '1.4.8', timestamp: '2025-11-05',
                      content: ['1.[原料仓]入库计划增加收料通知单；',
                                '2.[原料仓]出库流程：库内调拨+出库；',
                                '3.登录后可以在同组织下的仓库之间切换；', 
                                '4.修复APP端物料详情页图片不能放大浏览的问题；']},
                    { ver: '1.4.6', timestamp: '2025-11-04', content: ['1.APP版本增加简易扫码入库；', '2.库存调整权限调整；']},
                    { ver: '1.4.5', content: ['1.根据收料通知单打印物料标签，增加建议打印张数；'], timestamp: '2025-11-03' },
                    { ver: '1.4.4(patch)', content: ['1.登录增加密码认证，默认密码为工号；', '2.物料页面修改权限调整；'], timestamp: '2025-11-01' },
                    { ver: '1.4.3(patch)', content: ['1.库存查询，库存总览增加适配物料标识卡二维码格式；', '2.库存查询页面默认列表模式；'], timestamp: '2025-10-29' },
                    { ver: '1.4.2', content: ['1.生产用料清单页面-按单汇总统计（更新统计字段）；'], timestamp: '2025-09-13' }
                ]
            }
        },
        methods: {
            
        }
    }
</script>

<style lang="scss" scoped>
	.content {
		padding: 15px;
	}
</style>
