<template>
    <view >
        <uni-section title="输入单据编号" type="line" class="container">
            <uni-easyinput v-model="identifier" focus></uni-easyinput>
            <button type="primary" @click="create_inbound_task" style="margin-top: 20px;">生成入库任务</button>
        </uni-section>
        <uni-section title="存在未完成的入库任务" type="line" class="container">
            <uni-title type="h4" title="h2 二级标题"></uni-title>
            <button type="primary" @click="create_inbound_task" style="margin-top: 20px;">继续入库任务</button>
        </uni-section>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                identifier: '',
            }
        },
        methods: {
            create_inbound_task() {
                // logic code
                uni.navigateTo({
                    url: '/pages/operation/inbound/mount'
                })
            }
        }
    }
</script>

<style>

</style>
