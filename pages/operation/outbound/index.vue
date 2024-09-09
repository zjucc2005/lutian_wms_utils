<template>
    <view v-if="!cur_outbound_task.bill_no">
        <uni-section title="出库设定" type="line">
            <view class="container">
                <uni-forms ref="outbound_task_form" :model="outbound_task_form" :rules="outbound_task_form_rules" labelWidth="80px">
                    <uni-forms-item label="单据编号" name="bill_no" required>
                        <uni-easyinput 
                            v-model="outbound_task_form.bill_no" 
                            trim="both"
                            @change="handle_bill_no_change"
                            @clear="handle_bill_no_clear"
                        />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-section>
        
        <uni-section v-if="outbound_task_form.outbound_list?.length" title="待出库信息" type="circle">
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in outbound_task_form.outbound_list"
                    :key="index"
                    :title="obj.material_no"
                    :note="[obj.material_name, obj.material_spec].join('\n')"
                    :rightText="[obj.base_unit_qty, obj.base_unit_name].join(' ')" />
            </uni-list>
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
        <uni-section 
            title="进行中的出库任务"
            :sub-title="cur_outbound_task.bill_no"
            type="line">
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in cur_outbound_task.outbound_list"
                    :key="index"
                    :title="obj.material_no"
                    :note="[obj.material_name, obj.material_spec].join('\n')"
                    :rightText="[obj.base_unit_qty, obj.base_unit_name].join(' ')" />
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
    import { get_sal_deliverynotice } from '@/utils/api'
    import { OutboundTask } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                cur_outbound_task: {},
                outbound_task_form: {
                    bill_no: '',
                    outbound_list: []
                },
                outbound_task_form_rules: {
                    bill_no: {
                        rules: [
                            { required: true, errorMessage: '单据编号不能为空' }
                        ]
                    }
                },
                // batch_no_opts: [],
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
                            text: '结束出库任务',
                            backgroundColor: 'linear-gradient(90deg, #999, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '继续出库任务',
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
            // 新增出库任务 goods_nav
            goods_nav_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码                                                         
            },
            goods_nav_button_click(e) {               
                if (e.index === 0) {
                    if (this.outbound_task_form.bill_no) {
                        this.get_outbound_list_by_bill_no()
                    } else {
                        uni.showToast({ icon: 'error', title: '未输入单据编号' })
                    }
                } else if (e.index === 1) {                  
                    this.$refs.outbound_task_form.validate().then(e => {                            
                        this.create_outbound_task()
                        uni.navigateTo({ url: '/pages/operation/outbound/allocate' })                    
                    }).catch(err => { console.log('err', err) })
                }
            },
            // 继续出库任务 goods_nav
            goods_nav_click_2(e) {
                console.log('click e:', e)
                console.log('data:', this.$data)
                uni.navigateTo({
                    url: './task'
                })
            },
            goods_nav_button_click_2(e) {
                if (e.index === 0) {
                    uni.showActionSheet({
                        title: '',
                        itemList: ['结束出库任务'],
                        popover: {},
                        success: (e) => {
                            if (e.tapIndex === 0) this.finish_outbound_task()
                        }
                    })
                } else if (e.index === 1) {         
                    // this.continue_inbound_task() // 继续出库任务
                    uni.navigateTo({
                        url: '/pages/operation/outbound/allocate'
                    })
                }
            },
            handle_bill_no_change() {
                this.get_outbound_list_by_bill_no()
            },
            handle_bill_no_clear() {
                this.outbound_task_form.outbound_list = []
            },
            scan_code() {
                uni.scanCode({
                    success: (res) => {
                        // console.log("uni.scanCode res:", res)
                        this.outbound_task_form.bill_no = res.result
                        if (res.result) this.get_outbound_list_by_bill_no()
                    }
                })
            },
            get_outbound_list_by_bill_no() {
                const bill_no = this.outbound_task_form.bill_no
                if (bill_no.startsWith('FHTZD')) {
                    // 发货通知单
                    uni.showLoading({ title: 'Loading' })
                    get_sal_deliverynotice(bill_no).then(res => {
                        this.handle_fhtzd_data(res)
                        uni.hideLoading()
                    })
                }
            },
            handle_fhtzd_data(response) { 
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    const data = response.data.Result.Result
                    let outbound_list = []
                    data.SAL_DELIVERYNOTICEENTRY.forEach(obj => {
                        outbound_list.push({
                            material_no: obj.MaterialID.Number,
                            material_name: obj.MaterialID.Name[0]?.Value,
                            material_spec: obj.MaterialID.Specification[0]?.Value,
                            base_unit_qty: obj.BaseUnitQty,
                            base_unit_name: obj.BaseUnitID.Name[0]?.Value,
                            base_unit_no: obj.BaseUnitID.Number
                        })
                    })
                    this.outbound_task_form.outbound_list = outbound_list
                    // console.log('sale info:', data.SAL_DELIVERYNOTICEENTRY)
                    // console.log('$data:', this.$data)
                } else {
                    uni.showToast({ icon: 'error', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            },
            create_outbound_task() {
                const options = {
                    f_stock_id: store.state.cur_stock.FStockId,
                    staff_no: store.state.cur_staff.FNumber,
                    bill_no: this.outbound_task_form.bill_no,
                    outbound_list: this.outbound_task_form.outbound_list
                }
                console.log('create_outbound_task options:', options)
                let outbound_task = new OutboundTask(options)
                outbound_task.save()
                this.cur_outbound_task = outbound_task  // 赋值cur_outbound_task，解决VUE设置空值对象时console报错
                console.log('新建出库任务', outbound_task)
            },
            finish_outbound_task() {
                OutboundTask.destroy_all()
                this.cur_outbound_task= {}
                console.log('结束出库任务')
            }
        }
    }
</script>

<style>

</style>
