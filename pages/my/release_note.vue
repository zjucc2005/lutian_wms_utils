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
                    { version: '1.4.2', content: ['1.生产用料清单页面-按单汇总统计（更新统计字段）;'], timestamp: '2025-09-13' }
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
