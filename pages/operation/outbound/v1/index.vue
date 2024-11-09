<template>
    <view v-if="!cur_outbound_task.bill_no">
        <uni-section title="出库设定" type="line">
            <view class="container">
                <uni-forms ref="outbound_task_form" :model="outbound_task_form" :rules="outbound_task_form_rules" labelWidth="80px">
                    <uni-forms-item label="单据编号" name="bill_no" required>
                        <uni-easyinput 
                            v-model="outbound_task_form.bill_no" 
                            prefixIcon="search"
                            trim="both"
                            @change="handle_bill_no_change"
                            @clear="handle_bill_no_clear"
                        />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-section>
        
        <uni-section v-if="outbound_task_form.outbound_list?.length" title="出库物料信息" type="line" style="padding-bottom: 60px;">
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
    import K3CloudApi from '@/utils/k3cloudapi'
    import { OutboundTask } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import scan_code from '@/utils/scan_code'
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
                            { required: true, errorMessage: '单据编号不能为空' },
                            { minLength: 8, errorMessage: '单据编号不能小于8位' }
                        ]
                    }
                },
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
                            text: '新建出库任务',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
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
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.cur_outbound_task = OutboundTask.current() || {} //读取当前出库任务
            if (this.cur_outbound_task.stock_id && this.cur_outbound_task.stock_id != store.state.cur_stock.FStockId) {
                uni.showModal({
                    title: "注意",
                    content: "本机中有其他仓库的出库任务，不能操作，将终止此出库任务",
                    showCancel: false,
                    success: (res) => {
                        if (res.confirm) this.finish_outbound_task()
                    }
                })
            }
        },
        methods: {
            // >>> component
            goods_nav_click(e) {
                if (e.index === 0) this.get_outbound_list_by_bill_no() // btn:查询
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.create_outbound_task() // btn:新建出库任务
            },
            goods_nav_click_2(e) {
                if (e.index === 0) uni.navigateTo({ url: '/pages/operation/outbound/v1/task' })
            },
            goods_nav_button_click_2(e) {
                if (e.index === 0) this.if_finish_outbound_task()
                if (e.index === 1) this.continue_outbound_task()
            },
            // >>> action
            handle_bill_no_change() {
                this.get_outbound_list_by_bill_no()
            },
            handle_bill_no_clear() {
                this.outbound_task_form.outbound_list = []
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(text) {
                this.outbound_task_form.bill_no = text
                if (text) this.get_outbound_list_by_bill_no()
            },
            get_outbound_list_by_bill_no() {
                const bill_no = this.outbound_task_form.bill_no
                if (!bill_no) return
                if (bill_no.startsWith('FHTZD')) {
                    // 发货通知单
                    uni.showLoading({ title: 'Loading' })
                    K3CloudApi.view('SAL_DELIVERYNOTICE', { Number: bill_no }).then(res => {
                        this.handle_fhtzd_data(res)
                        uni.hideLoading()
                    })
                } else {
                    this.outbound_task_form.outbound_list = []
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
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
                } else {
                    this.outbound_task_form.outbound_list = []
                    uni.showToast({ icon: 'none', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            },
            create_outbound_task() {
                this.$refs.outbound_task_form.validate().then(e => {
                    play_audio_prompt('success')
                    const options = {
                        stock_id: store.state.cur_stock.FStockId,
                        staff_no: store.state.cur_staff.FNumber,
                        bill_no: this.outbound_task_form.bill_no,
                        outbound_list: this.outbound_task_form.outbound_list
                    }
                    let outbound_task = new OutboundTask(options)
                    outbound_task.save()
                    this.cur_outbound_task = outbound_task // 赋值cur_outbound_task，解决VUE设置空值对象时console报错
                    uni.navigateTo({ url: '/pages/operation/outbound/v1/allocate' })                    
                }).catch(err => {})                
            },
            continue_outbound_task() {
                play_audio_prompt('success')
                uni.navigateTo({ url: '/pages/operation/outbound/v1/allocate' })
            },
            if_finish_outbound_task() {
                uni.showActionSheet({
                    itemList: ['结束出库任务'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.finish_outbound_task()
                    }
                })
            },
            finish_outbound_task() {
                OutboundTask.destroy_all()
                this.cur_outbound_task= {}
                this.outbound_task_form = { bill_no: '', outbound_list: [] }
            }
        }
    }
</script>

<style>

</style>
