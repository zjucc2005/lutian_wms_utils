<template>
    <view>
        <uni-section type="square" title="单据编号"
            :sub-title="outbound_task.bill_no"
            sub-title-color="#007aff"
            >
            <uni-list v-if="plan_form.material_no">
                <template
                    v-for="(obj, index) in outbound_task.outbound_list"
                    :key="index"
                    >
                    <uni-list-item                   
                        v-if="obj.material_no == plan_form.material_no"
                        :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                        @click="handle_material_no_click()" clickable
                        >
                        <template v-slot:body>
                            <view class="uni-list-item__body">
                                <text class="title">{{ obj.material_no }}</text>
                                <view class="note">
                                    <view>名称：{{ obj.material_name }}</view> 
                                    <view>规格：{{ obj.material_spec }}</view>
                                    <view>
                                        <uni-icons type="home" color="#007bff" ></uni-icons>
                                        <text class="stock">{{ obj.stock_name }}</text>
                                    </view>
                                </view>
                            </view>
                        </template>
                    </uni-list-item>
                </template>
            </uni-list>
            <uni-list v-else>
                <uni-list-item
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#007bff', size: '24', type: 'list' }"
                    title="点击选择物料"
                    @click="handle_material_no_click" clickable
                />
            </uni-list>         
        </uni-section>
       
        <uni-section type="square" title="当前计划明细"
            v-if="inv_plans.length"
            :class="op_mode == 'scan' ? 'above-uni-goods-nav' : ''"
            >
            <template v-slot:right>
                <view class="uni-section__right">
                    <view >
                        已计划 <text class="sum_qty">{{ _sum_planned_qty() }}</text> {{ plan_form.base_unit_name }}
                    </view>
                </view>
            </template>
            <uni-swipe-action ref="inv_plan_swipe">
                <uni-swipe-action-item
                    v-for="(inv_plan, index) in inv_plans"
                    :key="index"
                    :threshold="60"
                    :right-options="inv_plan.FDocumentStatu == 'A' ? swipe_options : []"
                    @click="swipe_action_click($event, inv_plan)"
                    >
                    <uni-list-item
                        :show-extra-icon="true"
                        :extra-icon="{ color: '#4cd964', size: '24', type: 'arrow-down' }"
                        :title="inv_plan['FStockLocId.FNumber']"
                        :note="`批次：${inv_plan.FBatchNo}`"
                    >
                        <template v-slot:footer>
                            <view class="uni-list-item__foot">
                                <text class="op_qty">{{ inv_plan.FOpQTY }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                                <text class="status">{{ inv_plan.status }}</text>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
        
        <uni-section title="当前库存信息"
            v-if="op_mode == 'check'"
            class="above-uni-goods-nav">
            <template v-slot:decoration>
                <view class="uni-section__decoration">
                    <uni-icons type="search" size="30" color="#007aff"
                        @click="search_invs(plan_form.material_no)" />
                </view>                
            </template>
            <template v-slot:right>
                <view class="uni-section__right">
                    <view >
                        已选择 <text class="sum_qty">{{ _sum_checked_qty() }}</text> {{ plan_form.base_unit_name }}
                    </view>
                </view>
            </template>
            
            <uni-list>
                <uni-list-item
                    v-for="(inv, index) in invs"
                    :key="index"
                    :title="inv['FStockLocId.FNumber']"
                    :note="`批次：${inv.FBatchNo}`"
                    :right-text="[inv.FQty, inv['FStockUnitId.FName']].join(' ')"
                    >
                    <template v-slot:header>
                        <view class="uni-list-item__head">
                            <checkbox
                                :checked="inv.checked"
                                :disabled="inv.disabled"
                                @click="handle_checkbox_click"
                                :data-id="inv.FID"
                            />
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot" style="text-align: right;">
                            <text class="op_qty">
                                <template v-if="inv.planned_qty">({{ inv.FQty - inv.planned_qty }})</template>
                                {{ inv.FQty }} {{ inv['FStockUnitId.FName'] }}
                            </text>
                            <text v-if="inv.checked_qty" class="status">-{{ inv.checked_qty }} {{ inv['FStockUnitId.FName'] }}</text>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @button-click="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { Inv, InvLog, InvPlan } from '@/utils/model'
    import { play_audio_prompt, is_material_no_format, is_loc_no_std_format, is_decimal_unit } from '@/utils'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        data() {
            return {
                op_mode: 'scan',
                outbound_task: {},
                invs: [],
                inv_plans: [],
                plan_form: {
                    material_no: '',
                    loc_no: '',
                    op_qty: '',
                    remark: '',
                    base_unit: 'Pcs',
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                },
                swipe_options: [
                    { text: '删除', style: { backgroundColor: '#dd524d' } }
                ],
                goods_nav: {
                    options: [
                        { icon: 'list', text: '物料' }, // icon: 选择物料
                        { icon: 'scan', text: '模式' } // icon: 选择模式 scan/checkbox
                    ],
                    button_group: [
                        {
                            text: '扫码',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '保存',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('sendOutboundTask', res => {
                console.log('eventChannel.on sendOutboundTask', res)
                this.outbound_task = res.outbound_task
                if (res.material_no) {
                    this.set_plan_form(res.material_no)
                    this.load_data(res.material_no)
                }
            })
        },
        mounted() {
            this.set_op_mode('check')
        },
        methods: {
            // >>> binding
            swipe_action_click(e, inv_plan) {
               if (e.index === 0) this.submit_delete(inv_plan) // btn:删除
            },
            goods_nav_click(e) {
                if (e.index == 0) this.handle_material_no_click() // btn:选择物料
                if (e.index == 1) {
                    uni.showActionSheet({
                        itemList: ['勾选模式', '扫码模式'],
                        success: (e) => {
                            play_audio_prompt('success')
                            if (e.tapIndex == 0) this.set_op_mode('check')
                            if (e.tapIndex == 1) this.set_op_mode('scan')
                        }
                    })
                }
            },
            goods_nav_button_click(e) {
                if (e.index == 0) {
                    if (this.op_mode == 'check') this.if_auto_allocate() // btn:一键分配
                    // if (this.op_mode == 'scan') this.scan_code() // btn:扫码
                } 
                // if (e.index === 1) this.submit_save() // btn:保存
                if (e.index == 1) {
                    this.submit_save()
                    // console.log('this.$data', this.$data)
                } 
            },
            handle_checkbox_click(e) {
                let inv = this.invs.find(x => x.FID == e.target.dataset.id)
                // cond - 禁用
                if (!inv || inv.disabled) {
                    return
                }
                // cond - 去勾选
                if (inv.checked) {
                    inv.checked = false
                    inv.checked_qty = 0
                    this.invs.forEach(inv => {
                        if (inv.FQty > inv.planned_qty || 0) inv.disabled = false
                    })
                    return
                }
                // cond - 勾选
                let outbound_obj = this.outbound_task.outbound_list.find(x => x.material_no == this.plan_form.material_no)
                let planned_qty = this._sum_planned_qty() // 已计划数
                let plan_qty = outbound_obj.base_unit_qty - planned_qty // 待计划数
                let sum_checked_qty = this.invs.filter(x => x.checked).map(x => x.checked_qty).concat([0]).reduce((x,y) => x + y)
                let checking_qty = Math.min(inv.FQty, plan_qty - sum_checked_qty)
                inv.checked = true
                inv.checked_qty = checking_qty
                if (sum_checked_qty + checking_qty >= plan_qty) {
                    this.invs.forEach(x =>  x.disabled = !x.checked)
                }
            },
            handle_material_no_click() {
                let list = this.outbound_task.outbound_list.filter(x => x.stock_id == store.state.cur_stock.FStockId).map(x => x.material_no)
                uni.showActionSheet({
                    itemList: list,
                    success: (e) => {
                        play_audio_prompt('success')
                        let material_no = list[e.tapIndex]
                        this.set_plan_form(material_no)
                        this.load_data(material_no)
                    }
                })
            },
            set_op_mode(mode) {
                if (mode == 'check') {
                    this.op_mode = 'check'
                    this.goods_nav.options[1].icon = 'checkbox'
                    this.goods_nav.button_group[0].text = '一键分配'
                    this.goods_nav.button_group[0].backgroundColor = 'linear-gradient(90deg, #FFCD1E, #FF8A18)'
                }
                if (mode == 'scan') {
                    this.op_mode = 'scan'
                    this.goods_nav.options[1].icon = 'scan'
                    this.goods_nav.button_group[0].text = '扫码'
                    this.goods_nav.button_group[0].backgroundColor = 'linear-gradient(90deg, #FE6035, #EF1224)'
                }
            },
            if_auto_allocate() {
                uni.showModal({
                    title: '一键分配注意事项',
                    content: '一键分配会按先入先出原则，自动生成当前单据中所有物料的出库计划。如果之前已有部分计划，则将计划补充完整。',
                    success: (res) => {
                        if (res.confirm) this.auto_allocate()
                    },
                    fail: (err) => {}
                })
            },
            auto_allocate() {
                // 自动分配处理逻辑
                // 1. 遍历所有物料，生成计划
                // 2. 如果已有部分计划，则只生成剩余部分
                // 3. 如果某物料库存不足，则暂时忽略，待其余处理完毕，切换至该物料的页面，并提示，duration: 5000
                console.log('this.$data', this.$data)
            },
            async load_data(material_no) {
                await this.load_invs(material_no)
                await this.load_inv_plans(material_no)
                this._update_inv_status()
            },
            async load_invs(material_no) {
                const options = {
                    FStockId: store.state.cur_stock.FStockId,
                    'FMaterialId.FNumber': material_no,
                    FQty_gt: 0,
                }
                const meta = { order: 'FBatchNo ASC, FStockLocId.FNumber ASC' }
                uni.showLoading({ title: 'Loading' })
                return Inv.query(options, meta).then(res => {
                    uni.hideLoading()
                    this.invs = res.data
                })
            },
            async load_inv_plans(material_no) {
                const options = { 
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.outbound_task.bill_no,
                    'FMaterialId.FNumber': material_no,
                    FOpType: 'out',
                }
                const meta = { order: 'FBatchNo ASC' }
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query(options, meta).then(res => {
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        if (inv_plan.FDocumentStatu != 'A') {
                            inv_plan.status = store.state.inv_plan_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
                })
            },
            search_invs(material_no) {
                if (!material_no) {
                    uni.showToast({ icon: 'none', title: '请先选择物料' })
                }
                uni.navigateTo({ url: '/pages/operation/manage/inv_search?t=' + material_no })
            },
            set_plan_form(material_no) {
                let obj = this.outbound_task.outbound_list.find(x => x.material_no == material_no)
                if (obj) {
                    this.plan_form.material_no = obj.material_no
                    this.plan_form.base_unit_name = obj.base_unit_name
                    this.plan_form.decimal_unit = is_decimal_unit(obj.base_unit_name)
                } else {
                    this.plan_form.material_no = ''
                    this.plan_form.base_unit_name = 'Pcs'
                    this.plan_form.decimal_unit = false
                }
            },
            async submit_delete(inv_plan) {
                // console.log('submit_delete', inv_plan)
                if (inv_plan.FDocumentStatu == 'A') {
                    uni.showLoading({ title: 'Loading' })
                    return InvPlan.delete([inv_plan.FID]).then(res => {
                        uni.hideLoading()
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            play_audio_prompt('delete')
                            this.$refs.inv_plan_swipe.closeAll()
                            this.load_data(this.plan_form.material_no)
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    })
                } else {
                    uni.showToast({ icon: 'error', title: 'ERROR' })
                }
            },
            async submit_save() {
                if (this.op_mode == 'check') {
                    console.log('check模式保存')
                    console.log('this.invs', this.invs)
                    uni.showLoading({ title: 'Loading' })
                    for (var i = 0; i < this.invs.length; i++) {
                        let inv = this.invs[i]
                        if (inv.checked && inv.checked_qty > 0) {
                            let inv_plan = new InvPlan({
                                FOpType: 'out',
                                FStockId: store.state.cur_stock.FStockId,
                                FStockLocNo: inv['FStockLocId.FNumber'],
                                FMaterialId: inv.FMaterialId,
                                FOpQTY: inv.checked_qty,
                                FBatchNo: inv.FBatchNo,
                                FBillNo: this.outbound_task.bill_no,
                                FOpStaffNo: store.state.cur_staff.FNumber
                            })
                            await inv_plan.save()
                        }
                    }
                    uni.hideLoading()
                    await this.load_inv_plans(this.plan_form.material_no)
                    play_audio_prompt('success')
                    this._update_inv_status() // 根据已建计划，更新库存列表的界面和操作限制
                }
                if (this.op_mode == 'scan') {
                    console.log('scan模式保存')
                }
            },
            _sum_checked_qty() {
                return this.invs.map(x => x.checked_qty || 0).concat([0]).reduce((x, y) => x + y)
            },
            _sum_planned_qty() {
                return this.inv_plans.map(x => x.FOpQTY).concat([0]).reduce((x, y) => x + y)
            },
            _update_inv_status() {
                this.invs.forEach(inv => {
                    inv.checked = false
                    inv.disabled = false
                    inv.checked_qty = 0
                    inv.planned_qty = 0
                    this.inv_plans.forEach(inv_plan => {
                        if (inv['FStockLocId.FNumber'] == inv_plan['FStockLocId.FNumber'] && inv.FBatchNo == inv_plan.FBatchNo) {
                            inv.planned_qty += inv_plan.FOpQTY
                            if (inv.planned_qty >= inv.FQty) inv.disabled = true
                        }
                    })
                })
            }
        }
    }
</script>

<style lang="scss">

</style>
