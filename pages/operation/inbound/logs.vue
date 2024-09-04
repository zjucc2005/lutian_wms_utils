<template>
    <view>
        <uni-section title="操作日志" type="line">
            <uni-swipe-action ref="c_inv_log_swipe">
                <uni-swipe-action-item
                    v-for="(inv_log, index) in c_inv_logs"
                    :key="index"
                    :threshold="60"
                    :right-options="inv_log.FOpType == 'in' && !inv_log.status ? log_options : []"
                    @click="swipe_action_click($event, inv_log.FID)"
                >
                    <uni-list-item 
                        :title="formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss')"
                        :note="describe_inv_log(inv_log)"
                        :rightText="inv_log.status" />
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
    </view>
</template>

<script>
    import store from '@/store'
    import InvLog from '@/utils/model/inv_log'
    import { is_material_no_format, is_loc_no_std_format, is_decimal_unit, describe_inv_log } from '@/utils';
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_inbound_task: {},
                c_inv_logs: [],
                log_options: [
                    {
                        text: '取消',
                        style: {
                            backgroundColor: '#f56c6c'
                        }
                    }
                ]
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock // 加载当前仓库
            this.cur_staff = store.state.cur_staff // 加载当前员工
            this.cur_inbound_task = uni.getStorageSync('cur_inbound_task')
            this.load_c_inv_logs()
        },
        methods: {
            describe_inv_log,
            formatDate,
            load_c_inv_logs () {
                InvLog.query(
                    { FStockId: this.cur_stock.FStockId, FBatchNo: this.cur_inbound_task.batch_no }, 
                    { order: 'FCreateTime DESC' }).then(res => {
                    res.data.reverse().forEach(log => this.unshift_inv_log(log))
                })
            },
            swipe_action_click(e, index) {
               console.log('swipe action click e:', e, index) 
            },
            // 日志逐条插入列表中，判断是否取消
            unshift_inv_log(c_inv_log) {
                if (c_inv_log.FOpType == 'in_cl') {
                    let refer_inv_log = this.c_inv_logs.find(x => x.FID === c_inv_log.FReferId )
                    if (refer_inv_log) refer_inv_log.status = '已取消'
                }
                this.c_inv_logs.unshift(c_inv_log)
            }
        }
    }
</script>

<style>
    .uni-list-item__extra-text>span {
        color: #dd524d;
    }
</style>
