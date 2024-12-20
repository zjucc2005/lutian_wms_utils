<template>
    <view>
        <uni-notice-bar single scrollable text="扫码获取单据中物料清单后，下一步新增计划明细" />
        
        <uni-section title="查询单据编号" type="square">
            <view class="searchbar-container">
                <uni-easyinput
                    v-model="search_form.bill_no" 
                    placeholder="请输入搜索内容"
                    prefix-icon="scan"
                    @confirm="handle_search"
                    @clear="handle_search"
                    @icon-click="searchbar_icon_click"
                    primary-color="rgb(238, 238, 238)"
                    :styles="{
                        color: '#000',
                        backgroundColor: 'rgb(238, 238, 238)',
                        borderColor: 'rgb(238, 238, 238)'
                    }"
                />
            </view>
        </uni-section>
        
        <uni-section title="出库物料信息" type="square"
            v-if="outbound_task.outbound_list?.length"
            class="above-uni-goods-nav"
            >
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in outbound_task.outbound_list"
                    :key="index"
                    show-arrow
                    @click="new_plan(obj.material_no)"
                    :clickable="obj.stock_id == $store.state.cur_stock.FStockId"
                    :disabled="obj.stock_id != $store.state.cur_stock.FStockId"
                    >
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <text class="title">{{ obj.material_no }}</text>
                            <view class="note">
                                <view>名称：{{ obj.material_name }}</view> 
                                <view>规格：{{ obj.material_spec }}</view>
                                <view>出货仓库：<text class="text-primary">{{ obj.stock_name }}</text></view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <text>{{ obj.base_unit_qty }} {{ obj.base_unit_name }}</text>
                            <progress 
                                :percent="_calc_percentage(obj)" 
                                stroke-width="2"
                                :active-color="_calc_percentage(obj) == 100 ? '#4cd964' : '#f0ad4e'"
                            />
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                :fill="$store.state.goods_nav_fill"
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
        
        <cover-image
            v-if="is_completed" 
            src="/static/icon/yiwancheng_stamp.png"
            class="cover-image">
        </cover-image>
    </view>
</template>

<script>
    import store from '@/store'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { OutboundTask, InvPlan } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                outbound_task: {},
                inv_plans: [],
                search_form: {
                    bill_no: ''
                },
                is_completed: false,
                goods_nav: {
                    options: [
                        { icon: 'cart', text: '计划', info: '' }
                    ],
                    button_group: [
                        {
                            text: '扫码查询单据',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        },
                        {
                            text: '新增计划明细',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.handle_search()
        },
        mounted() {
            this.outbound_task = new OutboundTask()
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
                if (e.index === 1) this.new_plan() // btn:新增计划明细
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            async handle_search(e) {
                this.is_completed = false
                this.outbound_task = new OutboundTask()
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim().toUpperCase()
                    await this.load_bill()
                    await this.load_inv_plans()
                } else {
                    this._calc_progress()
                }
            },
            async load_bill() {
                let bill_no = this.search_form.bill_no
                if (bill_no.startsWith('FHTZD')) { // 发货通知单
                    uni.showLoading({ title: 'Loading' })
                    return K3CloudApi.view('SAL_DELIVERYNOTICE', { Number: bill_no }).then(res => {
                        uni.hideLoading()
                        this._handle_fhtzd_data(res)
                    }).catch(err => {
                        uni.showToast({ icon: 'none', title: err })
                    })
                } else {
                    this.outbound_task = new OutboundTask()
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
                }
            },
            async load_inv_plans() {
                let bill_no = this.search_form.bill_no
                if (bill_no.startsWith('FHTZD')) {
                    uni.showLoading({ title: 'Loading' })
                    return InvPlan.query({
                        FStockId: store.state.cur_stock.FStockId,
                        FBillNo: bill_no,
                        FOpType: 'out',
                    }, {}).then(res => { 
                        uni.hideLoading()
                        this.inv_plans = res.data
                        this._calc_progress(res.data) // 判定计划比率和是否已完成
                    })
                } else {
                    this.inv_plans = []
                }
            },
            new_plan(material_no) {
                if (!this.search_form.bill_no) {
                    uni.showToast({ icon: 'none', title: '单据编号不能为空' })
                    return
                }
                if (this.outbound_task.outbound_list.length == 0) {
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
                    return
                }
                if (this.is_completed) {
                    uni.showToast({ icon: 'none', title: '该单据已完成' })
                    return
                }
                uni.navigateTo({
                    url: '/pages/operation/outbound/v2/plan_new',
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('sendOutboundTask', { outbound_task: this.outbound_task, material_no: material_no })
                    }
                })
            },
            _calc_percentage(obj) {
                let planned_qty = 0
                this.inv_plans.forEach(inv_plan => {
                    if (inv_plan.FMaterialId == obj.material_id) {
                        planned_qty += inv_plan.FOpQTY
                    }
                })
                return (planned_qty / obj.base_unit_qty) * 100
            },
            _calc_progress(inv_plans=[]) {
                if (this.outbound_task.outbound_list.length == 0) {
                    this.goods_nav.options[0].info = ''
                    this.is_completed = false
                    return
                }
                let outbound_qty = this.outbound_task.outbound_list.map(x => x.base_unit_qty).concat([0]).reduce((x,y) => x + y)
                let plan_qty = 0
                let complete_qty = 0
                inv_plans.forEach(x => {
                    plan_qty += x.FOpQTY
                    if (x.FDocumentStatu == 'C') complete_qty += x.FOpQTY
                })
                let plan_percentage = Math.floor(plan_qty / outbound_qty * 100)
                this.goods_nav.options[0].info = `${plan_percentage}%`
                this.is_completed = outbound_qty == complete_qty
            },
            _handle_fhtzd_data(response) {
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    const data = response.data.Result.Result
                    let outbound_list = []
                    data.SAL_DELIVERYNOTICEENTRY.forEach(obj => {
                        let outbound_obj = outbound_list.find(x => x.material_id == obj.MaterialID_Id)
                        if (outbound_obj) {
                            outbound_obj.base_unit_qty += obj.BaseUnitQty // 合同相同物料ID
                        } else {
                            outbound_list.push({
                                material_id: obj.MaterialID.Id,
                                material_no: obj.MaterialID.Number,
                                material_name: obj.MaterialID.Name[0]?.Value,
                                material_spec: obj.MaterialID.Specification[0]?.Value,
                                base_unit_qty: obj.BaseUnitQty,
                                base_unit_name: obj.BaseUnitID.Name[0]?.Value,
                                base_unit_no: obj.BaseUnitID.Number,
                                stock_id: obj.StockID.Id,
                                stock_name: obj.StockID.Name[0]?.Value,
                                planned_qty: 0
                            })
                        }
                    })
                    this.outbound_task.bill_no = data.BillNo
                    this.outbound_task.stock_id = store.state.cur_stock.FStockId
                    this.outbound_task.staff_no = store.state.cur_staff.FNumber
                    this.outbound_task.outbound_list = outbound_list
                } else {
                    this.outbound_task = new OutboundTask()
                    uni.showToast({ icon: 'none', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            }
        }
    }
</script>

<style lang="scss">
    .cover-image {
        position: absolute;
        top: 80px;
        right: 50px;
        width: 128px;
        height: 128px;
    }
</style>
