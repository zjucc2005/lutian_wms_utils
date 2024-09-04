<template>
    <view v-if="!cur_outbound_task.batch_no">
        <uni-section title="出库设定" type="line">
            <view class="container">
                <uni-forms ref="outbound_task_form" :model="outbound_task_form" :rules="outbound_task_form_rules" labelWidth="80px">
                    <uni-forms-item label="出库日期" name="outbound_date" required>
                        <uni-datetime-picker 
                            v-model="outbound_task_form.outbound_date" 
                            type="date" return-type="string"
                            @change="outbound_date_change"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="批次号" name="batch_no" required>
                        <uni-data-picker v-model="outbound_task_form.batch_no" :localdata="batch_no_opts"></uni-data-picker>
                    </uni-forms-item>
                    <uni-forms-item label="单据编号" name="bill_no">
                        <uni-easyinput v-model="outbound_task_form.bill_no" />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-section>
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
    </view>
    
    <view v-else>
        
    </view>
</template>

<script>
    import { OutboundTask } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                cur_outbound_task: {}, // 出库不需要设定批次号，此处结构待定
                outbound_task_form: {
                    outbound_date: '',
                    batch_no: '',
                    bill_no: ''
                },
                outbound_task_form_rules: {
                    outbound_date: {
                        rules: [
                            { required: true, errorMessage: '出库日期不能为空' },
                        ]
                    },
                    batch_no: {
                        rules: [
                            { required: true, errorMessage: '批次号不能为空' },
                        ]
                    }
                },
                batch_no_opts: [],
                goods_nav: {
                    options: [
                        { icon: 'scan', text: '扫码' }
                    ],
                    button_group: [
                        {
                            text: '查询单据编号',
                            backgroundColor: 'linear-gradient(90deg, #999, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '新建出库任务',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ],
                    options_2: [
                        { icon: 'bars', text: '详情' }
                    ],
                    button_group_2: [
                        {
                            text: '结束入库任务',
                            backgroundColor: 'linear-gradient(90deg, #999, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '继续入库任务',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.cur_outbound_task = OutboundTask.current() || {} //读取当前出库任务
        },
        methods: {
            outbound_date_change(e) {
                const batch_no_opts = []
                if (e) {
                    const t = new Date(e)
                    // 可选批次号范围为，出库日期 
                    for (var i=0;i<1;i++) {
                        let batch_no = formatDate(t - 24 * 60 * 60 * 1000 * i , 'yyyyMMdd')
                        batch_no_opts.push({ text: batch_no, value: batch_no })
                    }
                }
                this.outbound_task_form.batch_no = batch_no_opts[0]?.value
                this.batch_no_opts = batch_no_opts
            },
            // 新增入库任务 goods_nav
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.scan_code() // btn:扫码                                                         
                }
            },
            goods_nav_button_click(e) {
                if (e.index === 0) {
                    if (this.inbound_task_form.bill_no) {
                        console.log(e.content.text, this.inbound_task_form.bill_no)
                        // code here
                    } else {
                        uni.showToast({
                            icon: 'error',
                            title: '未找到单据编号'
                        })
                    }
                } else if (e.index === 1) {
                    this.$refs.outbound_task_form.validate().then(e => {
                        this.create_inbound_task()
                        uni.navigateTo({
                            url: '/pages/operation/outbound/unmount'
                        })
                    }).catch(err => {
                        console.log('err', err);
                    })
                }
            },
            scan_code() {
                uni.scanCode({
                    success: function (res) {
                        console.log("uni.scanCode res:", res)
                        // logic code
                    }
                })
            }
        }
    }
</script>

<style>

</style>
