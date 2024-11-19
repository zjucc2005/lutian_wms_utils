<template>
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
    
    <uni-section title="入库物料信息" type="square"
        v-if="inbound_task.inbound_list?.length" 
        class="above-uni-goods-nav"
        >
        <uni-list>
            <uni-list-item
                v-for="(obj, index) in inbound_task.inbound_list"
                :key="index"
                @click="new_plan(obj.material_no)"
                :clickable="obj.dest_stock_id == $store.state.cur_stock.FStockId"
                :disabled="obj.dest_stock_id != $store.state.cur_stock.FStockId"
                show-arrow
                >
                <template v-slot:body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ obj.material_name }}</view>
                            <view>规格：{{ obj.material_spec }}</view>
                            <view>
                                <uni-icons type="home" color="#999"></uni-icons>
                                <text class="src-stock">{{ obj.src_stock_name || '?' }}</text>
                                <uni-icons type="redo" color="#007bff" style="margin: 0 5px;"></uni-icons> 
                                <uni-icons type="home" color="#007bff" ></uni-icons>
                                <text class="dest-stock">{{ obj.dest_stock_name }}</text>
                            </view>
                            <view>批次：{{ obj.batch_no }}</view>
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
                            :active="true"
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
</template>

<script>
    import store from '@/store'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { play_audio_prompt } from '@/utils'
    import { InboundTask, InvPlan } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                inbound_task: {},
                inv_plans: [],
                is_completed: false,
                search_form: {
                    bill_no: ''
                },
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
            this.inbound_task = new InboundTask()
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
                if (e.index === 1) this.new_plan() // btn:新建
            },
            new_plan(material_no) {
                if (!this.search_form.bill_no) {
                    uni.showToast({ icon: 'none', title: '单据编号不能为空' })
                    return
                }
                if (this.inbound_task.inbound_list.length == 0) {
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
                    return
                }
                if (this.is_completed) {
                    uni.showToast({ icon: 'none', title: '该计划已完成' })
                    return
                }
                uni.navigateTo({
                    url: '/pages/operation/inbound/v2/plan_new_pallet',
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('sendInboundTask', { inbound_task: this.inbound_task, material_no: material_no })
                    }
                })
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            async handle_search() {
                this.is_completed = false
                this.inbound_task = new InboundTask()
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
                if (bill_no.startsWith('ZJDB')) { // 直接调拨单
                    uni.showLoading({ title: 'Loading' })
                    return K3CloudApi.view('STK_TransferDirect', { Number: bill_no }).then(res => {
                        uni.hideLoading()
                        this._handle_zjdbd_data(res)
                    }).catch(err => {
                        uni.showToast({ icon: 'none', title: err })
                    })
                } else {
                    this.inbound_task = new InboundTask()
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
                }
            },
            async load_inv_plans() {
                let bill_no = this.search_form.bill_no
                if (bill_no.startsWith('ZJDB')) {
                    return InvPlan.query({
                        FStockId: store.state.cur_stock.FStockId,
                        FBillNo: bill_no,
                        FOpType: 'in',
                    }, {}).then(res => { 
                        this.inv_plans = res.data
                        this._calc_progress(res.data) // 判定计划比率和是否已完成
                    })
                } else {
                    this.inv_plans = []
                }
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
                if (this.inbound_task.inbound_list.length == 0) {
                    this.goods_nav.options[0].info = ''
                    this.is_completed = false
                    return
                }
                let inbound_qty = this.inbound_task.inbound_list.map(x => x.base_unit_qty).concat([0]).reduce((x,y) => x + y)
                let plan_qty = 0
                let complete_qty = 0
                inv_plans.forEach(x => {
                    plan_qty += x.FOpQTY
                    if (x.FDocumentStatu == 'C') complete_qty += x.FOpQTY
                })
                let plan_percentage = Math.floor(plan_qty / inbound_qty * 100)
                this.goods_nav.options[0].info = `${plan_percentage}%`
                this.is_completed = inbound_qty == complete_qty
            },
            _handle_zjdbd_data(response) {
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    const data = response.data.Result.Result
                    let inbound_list = []
                    data.TransferDirectEntry.forEach(obj => {
                        let inbound_obj = inbound_list.find(x => x.material_id == obj.MaterialID_Id)
                        if (inbound_obj) {
                            inbound_obj.base_unit_qty += obj.BaseQty // 合同相同物料ID
                        } else {
                            inbound_list.push({
                                material_id: obj.DestMaterialId_Id, // 物料编码，采用调入仓库对应的ID
                                material_no: obj.MaterialId.Number,
                                material_name: obj.MaterialId.Name[0]?.Value,
                                material_spec: obj.MaterialId.Specification[0]?.Value,
                                base_unit_qty: obj.BaseQty,
                                base_unit_name: obj.BaseUnitId.Name[0]?.Value,
                                base_unit_no: obj.BaseUnitId.Number,
                                src_stock_id: obj.SrcStockId.Id,
                                src_stock_name: obj.SrcStockId.Name[0]?.Value,
                                dest_stock_id: obj.DestStockId.Id,
                                dest_stock_name: obj.DestStockId.Name[0]?.Value,
                                batch_no: formatDate(obj.BusinessDate || Date.now(), 'yyyyMMdd'), // 优先继承调拨单中入库时间作为批次号
                                planned_qty: 0
                            })
                        }
                    })
                    this.inbound_task.bill_no = data.BillNo
                    this.inbound_task.stock_id = store.state.cur_stock.FStockId
                    this.inbound_task.staff_no = store.state.cur_staff.FNumber
                    this.inbound_task.inbound_list = inbound_list
                } else {
                    this.inbound_task = new InboundTask()
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
