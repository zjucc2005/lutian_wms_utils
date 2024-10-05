<template>
    <view>
        <uni-section title="操作日志" type="line">
            <uni-swipe-action ref="c_inv_log_swipe">
                <uni-swipe-action-item
                    v-for="(inv_log, index) in inv_logs"
                    :key="index"
                    :threshold="60"
                    :right-options="inv_log.FOpType == 'out' && !inv_log.status ? log_options : []"
                    @click="swipe_action_click($event, inv_log.FID)"
                >
                    <uni-list-item 
                        :title="formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss')"
                        :note="describe_inv_log(inv_log)"
                        :rightText="inv_log.status">
                        <template v-slot:footer>
                            <text class="uni-list-item-right-text">{{ inv_log.status }}</text>
                        </template>
                    </uni-list-item>
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
    </view>
</template>

<script>
    import store from '@/store'
    import InvLog from '@/utils/model/inv_log'
    import { describe_inv_log } from '@/utils';
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_outbound_task: {},
                inv_logs: [],
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
            this.cur_outbound_task = uni.getStorageSync('cur_outbound_task')
            this.load_inv_logs()
        },
        methods: {
            describe_inv_log,
            formatDate,
            load_inv_logs () {
                InvLog.query(
                    { FStockId: this.cur_stock.FStockId, FBillNo: this.cur_outbound_task.bill_no, FOpType_in: ['out', 'out_cl'] }, 
                    { order: 'FCreateTime DESC' }).then(res => {
                    res.data.reverse().forEach(log => this.unshift_inv_log(log))
                })
            },
            swipe_action_click(e, inv_log_id) {
               if (e.index === 0) {
                   this.cancel(inv_log_id) // 取消
               }
            },
            cancel(inv_log_id) {
                let c_inv_log = this.inv_logs.find(x => x.FID === inv_log_id)
                if (c_inv_log.FOpType == 'out' && !c_inv_log.status) {
                    let inv_log = new InvLog({
                        FOpType: 'out_cl',
                        FStockId: c_inv_log.FStockId,
                        FStockLocNo: c_inv_log['FStockLocId.FNumber'],
                        FMaterialId: c_inv_log.FMaterialId,
                        FOpQTY: c_inv_log.FOpQTY,
                        FBatchNo: c_inv_log.FBatchNo,
                        FBillNo: c_inv_log.FBillNo,
                        FOpStaffNo: this.cur_staff.FNumber,
                        FReferId: c_inv_log.FID
                    })
                    inv_log.save().then(save_res => {
                        this.after_save(save_res)
                        this.$refs.c_inv_log_swipe.closeAll() // 关闭滑动操作
                    })
                } else {
                    uni.showToast({ icon: 'error', title: 'ERROR' })
                }
            },
            // 提交上架or取消上架后，获取新增日志并插入下方日志列表中
            after_save(save_res) {
                if (save_res.data.Result.ResponseStatus.IsSuccess) {
                    InvLog.find(save_res.data.Result.Id).then(find_res => {
                        if (find_res.data[0]) {
                            this.unshift_inv_log(find_res.data[0])
                            uni.showToast({
                                title: '提交成功'
                            })                           
                        } 
                    })
                } else {
                    uni.showToast({
                        title: '提交失败'
                    })
                }
            },
            // 日志逐条插入列表中，判断是否取消
            unshift_inv_log(c_inv_log) {
                if (c_inv_log.FOpType == 'out_cl') {
                    let refer_inv_log = this.inv_logs.find(x => x.FID === c_inv_log.FReferId )
                    if (refer_inv_log) refer_inv_log.status = '已取消'
                }
                this.inv_logs.unshift(c_inv_log)
            }
        }
    }
</script>

<style>
    .uni-list-item-right-text {
        color: #dd524d;
        font-size: 12px;
        display: flex;
        align-items: center;
    }
</style>
