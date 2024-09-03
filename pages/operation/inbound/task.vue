<template>
    <view>
        <uni-section title="进行中的入库任务" type="line">
            <uni-list>
                <uni-list-item title="入库日期" :rightText="cur_inbound_task.inbound_date" />
                <uni-list-item title="批次号" :rightText="cur_inbound_task.batch_no" />
                <uni-list-item title="单据编号" :rightText="cur_inbound_task.bill_no" />
            </uni-list>
        </uni-section>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                cur_inbound_task: {}
            }
        },
        onShow() {
            uni.getStorage({
                key: 'cur_inbound_task',
                success: (res) => {
                    this.cur_inbound_task = res.data //读取当前入库任务
                },
                fail: (err) => {
                    this.cur_inbound_task = {}
                }
            })
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
