<template>
    <view v-if="!cur_inbound_task.batch_no">
        <uni-section title="入库设定" type="line">
            <view class="container">
                <uni-forms ref="inbound_task_form" :model="inbound_task_form" :rules="inbound_task_form_rules" labelWidth="80px">
                    <uni-forms-item label="入库日期" name="inbound_date" required>
                        <uni-datetime-picker 
                            v-model="inbound_task_form.inbound_date" 
                            type="date" return-type="string"
                            @change="handle_inbound_date_change"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="批次号" name="batch_no" required>
                        <uni-data-picker 
                            v-model="inbound_task_form.batch_no" 
                            :localdata="batch_no_opts"
                            :popup-title="inbound_task_form.inbound_date ? '请选择' : '请先选择入库日期'"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="单据编号" name="bill_no">
                        <uni-easyinput 
                            v-model="inbound_task_form.bill_no"
                            @change="handle_bill_no_change"
                            trim="both"
                        />
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
        <uni-section title="进行中的入库任务" type="line">
            <uni-list>
                <uni-list-item title="入库日期" :rightText="cur_inbound_task.inbound_date" />
                <uni-list-item title="批次号" :rightText="cur_inbound_task.batch_no" />
                <uni-list-item title="单据编号" :rightText="cur_inbound_task.bill_no" />
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options_2" 
                :button-group="goods_nav.button_group_2"
                @click="goods_nav_click_2"
                @buttonClick="goods_nav_button_click_2"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { InboundTask } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                cur_inbound_task: {},
                inbound_task_form: {
                    inbound_date: '',
                    batch_no: '',
                    bill_no: ''
                },
                inbound_task_form_rules: {
                    inbound_date: {
                        rules: [
                            { required: true, errorMessage: '入库日期不能为空' },
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
                        { icon: 'search', text: '查询' }
                    ],
                    button_group: [
                        {
                            text: '扫码',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '新建入库任务',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ],
                    options_2: [
                        { icon: 'bars', text: '详情' }
                    ],
                    button_group_2: [
                        {
                            text: '结束入库任务',
                            backgroundColor: 'linear-gradient(90deg, #AAA, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '继续入库任务',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.cur_inbound_task = InboundTask.current() || {} //读取当前入库任务
            if (this.cur_inbound_task.f_stock_id && this.cur_inbound_task.f_stock_id != store.state.cur_stock.FStockId) {
                uni.showModal({
                    title: "注意",
                    content: "本机中有其他仓库的入库任务，不能操作，将终止此入库任务",
                    showCancel: false,
                    success: (res) => {
                        if (res.confirm) this.finish_inbound_task()
                    }
                })
            }
        },
        methods: {
            // component
            goods_nav_click(e) {
                if (e.index === 0) {
                    if (this.inbound_task_form.bill_no) {
                        console.log(e.content.text, this.inbound_task_form.bill_no)
                        this.get_inbound_list_by_bill_no() // icon:查询
                    } else {
                        uni.showToast({ icon: 'none', title: '请输入单据编号' })
                    }
                }                                                        
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.create_inbound_task() // btn:新建入库任务
            },           
            goods_nav_click_2(e) {
                if (e.index === 0) uni.navigateTo({ url: '/pages/operation/inbound/task' }) // btn:详情
            },
            goods_nav_button_click_2(e) {
                if (e.index === 0) this.if_finish_inbound_task() // btn:结束入库任务
                if (e.index === 1) this.continue_inbound_task() // btn:继续入库任务
            },
            // action
            handle_inbound_date_change(e) { 
                const batch_no_opts = []
                if (e) {
                    const t = new Date(e) // 可选批次号范围为，入库日期往前3天                    
                    for (var i=0;i<3;i++) {
                        let batch_no = formatDate(t - 24 * 60 * 60 * 1000 * i , 'yyyyMMdd')
                        batch_no_opts.push({ text: batch_no, value: batch_no })
                    }
                }
                this.inbound_task_form.batch_no = batch_no_opts[0]?.value
                this.batch_no_opts = batch_no_opts
            },
            handle_bill_no_change(e) {
                console.log('bill_no_change e', e)
            },
            scan_code() {
                uni.scanCode({
                    success: (res) => {
                        console.log("uni.scanCode res:", res)
                        // if 有符合条件的单据编号，直接提取
                        // else split 字符串，供选择
                        let arr = res.result.split(/\|{2}|,|;/)
                        if (arr.length === 1) {
                            this.inbound_task_form.bill_no = arr[0]
                            this.get_inbound_list_by_bill_no()
                        } else {
                            uni.showActionSheet({
                                title: '扫码结果',
                                itemList: arr,
                                success: (e) => {
                                    this.inbound_task_form.bill_no = arr[e.tapIndex]
                                    this.get_inbound_list_by_bill_no()
                                }
                            })
                        }
                    }
                });  
            },               
            get_inbound_list_by_bill_no() {
                console.log('[该功能待定]根据单据编号查询入库信息', this.inbound_task_form.bill_no)
            },
            create_inbound_task() {
                this.$refs.inbound_task_form.validate().then(e => {
                    const options = {
                        f_stock_id: store.state.cur_stock.FStockId,
                        inbound_date: this.inbound_task_form.inbound_date,
                        batch_no: this.inbound_task_form.batch_no,
                        bill_no: this.inbound_task_form.bill_no
                    }
                    let inbound_task = new InboundTask(options)
                    inbound_task.save()
                    this.cur_inbound_task = inbound_task  // 赋值cur_inbound_task，解决VUE设置空值对象时console报错
                    // console.log('新建入库任务', inbound_task)
                    uni.navigateTo({ url: '/pages/operation/inbound/mount' })
                }).catch(err => console.log('err', err))
            },
            if_finish_inbound_task() {
                uni.showActionSheet({
                    itemList: ['结束入库任务'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.finish_inbound_task()
                    }
                })
            },
            finish_inbound_task() {
                InboundTask.destroy_all()               
                this.cur_inbound_task = {}
                this.inbound_task_form = { inbound_date: '', batch_no: '', bill_no: '' }
                console.log('结束入库任务')
            },
            continue_inbound_task() {
                uni.navigateTo({ url: '/pages/operation/inbound/mount' })
            }
        }
    }
</script>

<style>
    
</style>
