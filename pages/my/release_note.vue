<template>
    <uni-collapse>
        <uni-collapse-item v-for="(note, index) in notes" :title="`V${note.version}`" :key="index" open>
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
                    { version: '1.4.6', content: ['1.APP版本增加简易扫码入库；'], timestamp: '2025-11-04' },
                    { version: '1.4.5', content: ['1.根据收料通知单打印物料标签，增加建议打印张数；'], timestamp: '2025-11-03' },
                    { version: '1.4.4(patch)', content: ['1.登录增加密码认证，默认密码为工号；', '2.物料页面修改权限调整；'], timestamp: '2025-11-01' },
                    { version: '1.4.3(patch)', content: ['1.库存查询，库存总览增加适配物料标识卡二维码格式；', '2.库存查询页面默认列表模式；'], timestamp: '2025-10-29' },
                    { version: '1.4.2', content: ['1.生产用料清单页面-按单汇总统计（更新统计字段）；'], timestamp: '2025-09-13' }
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
