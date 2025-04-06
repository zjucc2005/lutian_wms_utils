<template>
    <uni-section type="square" title="新增计划明细"
        :sub-title="outbound_task.bill_no"
        sub-title-color="#007aff">
        <uni-list v-if="plan_form.material_no">
            <template
                v-for="(obj, index) in outbound_task.outbound_list"
                :key="index"
                >
                <uni-list-item
                    v-if="obj.material_no == plan_form.material_no"
                    :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                    @click="$refs.material_drawer.open()" clickable
                    show-arrow
                    >
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <text class="title">{{ obj.material_no }}</text>
                            <view class="note">
                                <view>名称：{{ obj.material_name }}</view> 
                                <view>规格：{{ obj.material_spec }}</view>
                                <view>出货仓库：<text class="text-primary">{{ obj.stock_name }}</text></view>
                                <view>未出库数量（仅供参考）：{{ obj.remain_out_qty }}</view>
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
                @click="$refs.material_drawer.open()" clickable
                show-arrow
            />
        </uni-list>
    </uni-section>
    
    <!-- plan form -->
    <view v-if="op_mode == 'scan'" class="container">
        <uni-forms ref="plan_form" :model="plan_form" :rules="plan_form_rules" labelWidth="80px">
            <uni-forms-item name="material_no" style="height: 0;"></uni-forms-item>
            <uni-forms-item label="库位号" name="loc_no" required>
                <uni-data-picker
                    v-model="plan_form.loc_no"
                    :localdata="stock_loc_opts"
                    split="-"
                    popup-title="请选择库位"
                />
            </uni-forms-item>
            <uni-forms-item label="下架数量" name="op_qty" required>
                <uni-easyinput v-model="plan_form.op_qty" type="number">
                    <template #right>
                        <text class="easyinput-suffix-text">{{ plan_form.base_unit_name }}</text>
                    </template>
                </uni-easyinput>
            </uni-forms-item>
            <uni-forms-item label="备注" name="remark">
                <uni-easyinput v-model="plan_form.remark" trim="both" />
            </uni-forms-item>
        </uni-forms>
    </view>
   
    <uni-section type="square" title="当前计划明细"
        :sub-title="$store.state.device_type == 'app-plus' ? '左滑可删除' : ''"
        v-if="inv_plans.length"
        :class="op_mode == 'scan' ? 'above-uni-goods-nav' : ''">
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
                :right-options="swipe_options"
                @click="swipe_action_click($event, inv_plan)"
                >
                <uni-list-item
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#4cd964', size: '24', type: 'arrow-down' }"
                    :title="inv_plan['FStockLocId.FNumber']"
                    :note="`批次：${inv_plan.FBatchNo}, 计划新建时间：${formatDate(inv_plan.FCreateTime, 'yyyy-MM-dd hh:mm:ss')}`"
                >
                    <template v-slot:footer>
                        <view class="uni-list-item__foot" style="flex-direction: row;">
                            <view>
                                <view class="op_qty">{{ inv_plan.FOpQTY }} {{ inv_plan['FStockUnitId.FName'] }}</view>
                                <view class="status">{{ inv_plan.status }}</view>
                            </view>
                            <view v-if="$store.state.device_type == 'h5' && !inv_plan.status">
                                <uni-icons type="trash" size="24" color="#dd524d" @click="submit_delete(inv_plan)" class="uni-ml-5" />
                            </view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-swipe-action-item>
        </uni-swipe-action>
    </uni-section>
    
    <uni-section title="库存信息"
        sub-title="点击勾选的行，修改选择的库存数"
        v-if="op_mode == 'check'"
        class="above-uni-goods-nav">
        <template v-slot:decoration>
            <view class="uni-section__decoration">
                <uni-icons type="search" size="30" color="#007aff" @click="inv_menu" />
            </view>
        </template>
        <template v-slot:right>
            <view class="uni-section__right">
                <view>
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
                @click="edit_checked_qty(inv)" clickable
                :show-arrow="inv.checked"
                >
                <template v-slot:header>
                    <view class="uni-list-item__head">
                        <checkbox
                            :checked="inv.checked"
                            :disabled="inv.disabled"
                            @click="checkbox_click"
                            :data-id="inv.FID"
                        />
                    </view>
                </template>
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <text class="op_qty">
                            <template v-if="inv.planned_qty">({{ inv.FQty - inv.planned_qty }})</template>
                            {{ inv.FQty }} {{ inv['FStockUnitId.FName'] }}
                        </text>
                        <text v-if="inv.checked_qty" class="status">-{{ inv.checked_qty }} {{ inv['FStockUnitId.FName'] }}</text>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
        <uni-load-more
            v-if="invs.length == 0"
            status="nomore"
            :content-text="{ contentnomore: '没有相关数据' }"
        />
    </uni-section>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @button-click="goods_nav_button_click"
        />
    </view>
    
    <uni-drawer ref="material_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="出库物料列表" type="square" sub-title="点击切换当前物料">
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="20" color="#333" @click="$refs.material_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list>
                    <template
                        v-for="(obj, index) in outbound_task.outbound_list"
                        :key="index"
                        >
                        <uni-list-item
                            v-if="obj.stock_id == $store.state.cur_stock.FStockId"
                            :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                            @click="material_no_click(obj.material_no)" clickable
                            show-arrow
                            >
                            <template v-slot:body>
                                <view class="uni-list-item__body">
                                    <view class="title">
                                        <uni-icons v-if="this.plan_form.material_no == obj.material_no" type="checkbox-filled" color="#007aff" />
                                        {{ obj.material_no }}
                                    </view>
                                    <view class="note">
                                        <view>名称：{{ obj.material_name }}</view> 
                                        <view>规格：{{ obj.material_spec }}</view>
                                    </view>
                                </view>
                            </template>
                        </uni-list-item>
                    </template>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>

    <!-- 修改checked_qty -->
    <uni-popup ref="checked_qty_dialog" type="dialog">
        <uni-popup-dialog title="修改选择的库存数" type="error" :show-close="false">
            <view class="plan-form">
                <uni-number-box 
                    v-model="inv_editing.checked_qty" 
                    :min="0" :max="inv_editing.FQty - inv_editing.planned_qty"
                    @change="change_checked_qty"
                />
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import { Inv, InvLog, InvPlan, StockLoc } from '@/utils/model'
    import { play_audio_prompt, is_material_no_format, is_loc_no_std_format, is_decimal_unit, link_to } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                op_mode: 'scan',
                outbound_task: {},
                invs: [],
                inv_editing: {},
                inv_plans: [],
                inv_plans_ex: [],
                plan_form: {
                    material_no: '',
                    loc_no: '',
                    op_qty: '',
                    remark: '',
                    base_unit: 'Pcs',
                    base_unit_name: 'Pcs',
                    decimal_unit: false,
                    is_complete: false
                },
                plan_form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编号不能为空'},
                        ]
                    },
                    loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let stock_loc = store.state.stock_locs.find(x => x.FNumber == value)
                                    if (stock_loc.FDocumentStatus != 'C') {
                                        return callback('此库位号未审核')
                                    }
                                    let inv_plan = this.inv_plans.find(x => x['FStockLocId.FNumber'] == value)
                                    if (inv_plan) {
                                        return callback('此库位号已有计划明细')
                                    }
                                }
                            }
                        ]
                    },
                    op_qty: {
                        rules: [
                            { required: true, errorMessage: '计划上架数量不能为空' },
                            { format: 'number', errorMessage: '计划上架数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('计划上架数量必须大于0')
                                    if (!this.plan_form.decimal_unit && !Number.isInteger(value)) {
                                        return callback('计划上架数量必须为整数')
                                    }
                                    let outbound_obj = this.outbound_task.outbound_list.find(x => x.material_no == this.plan_form.material_no)
                                    let planned_qty = this._sum_planned_qty()
                                    if (planned_qty + value > outbound_obj.base_unit_qty) {
                                        return callback('计划下架数量超过上限')
                                    }
                                    let invs = this.invs.filter(inv => inv['FStockLocId.FNumber'] == this.plan_form.loc_no)
                                    let inv_qty = invs.map(inv => inv.FQty).concat([0]).reduce((x, y) => x + y)
                                    if (planned_qty + value > inv_qty) {
                                        return callback('库存数量不足')
                                    }
                                }
                            }
                        ]
                    }
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
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        },
                        {
                            text: '保存',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('sendOutboundTask', res => {
                this.$logger.info('eventChannel.on sendOutboundTask', res)
                this.outbound_task = res.outbound_task
                if (res.material_no) {
                    this.set_plan_form(res.material_no)
                    this.load_data(res.material_no)
                }
            })
        },
        mounted() {
            this.set_op_mode('check')
            StockLoc.query({ FStockId: store.state.cur_stock.FStockId, FForbidStatus: 'B' }).then(res => {
                this.$logger.info('>>> 更新库位禁用信息')
                store.commit('update_stock_locs', res.data) // 只查询禁用库存
            }) 
        },
        computed: {
            stock_loc_opts() {
                return this.invs.map(inv => {
                    return { text: inv['FStockLocId.FNumber'], value: inv['FStockLocId.FNumber'] }
                })
            }
        },
        methods: {
            formatDate,
            swipe_action_click(e, inv_plan) {
               if (e.index === 0) this.submit_delete(inv_plan) // btn:删除
            },
            goods_nav_click(e) {
                if (e.index == 0) this.$refs.material_drawer.open()  // this.material_no_click() // btn:选择物料
                if (e.index == 1) this.mode_click() // btn:选择模式
            },
            goods_nav_button_click(e) {
                if (e.index == 0) {
                    if (this.op_mode == 'check') this.if_auto_allocate() // btn:一键分配
                    if (this.op_mode == 'scan') this.scan_code() // btn:扫码
                } 
                if (e.index == 1) this.submit_save() // btn:保存
            },
            checkbox_click(e) {
                let inv = this.invs.find(x => x.FID == e.target.dataset.id)
                // cond - 禁用
                if (!inv || inv.disabled) return
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
                // if (sum_checked_qty + checking_qty >= plan_qty) {
                //     this.invs.forEach(x =>  x.disabled = !x.checked)
                // }
            },
            edit_checked_qty(inv) {
                if (inv.checked) {
                    this.$refs.checked_qty_dialog.open()
                    this.inv_editing = inv
                }
            },
            change_checked_qty(e) {
                this.inv_editing.checked = e > 0
            },
            material_no_click(material_no) {
                this.$refs.material_drawer.close()
                if (this.plan_form.material_no == material_no) return
                this.set_plan_form(material_no)
                this.load_data(material_no)
                play_audio_prompt('success')
            },
            mode_click() {
                uni.showActionSheet({
                    itemList: ['勾选模式', '扫码模式'],
                    success: (e) => {
                        play_audio_prompt('success')
                        if (e.tapIndex == 0) this.set_op_mode('check')
                        if (e.tapIndex == 1) this.set_op_mode('scan')
                    }
                })
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
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            async auto_allocate() {
                // 自动分配处理逻辑
                // 1. 遍历所有物料，生成计划
                // 2. 如果已有部分计划，则只生成剩余部分？
                // 3. 如果某物料库存不足，则暂时忽略，待其余处理完毕，切换至该物料的页面，并提示
                this.$logger.info('>>> 一键分配开始')
                uni.showLoading({ title: 'Loading' })
                let lack_material = ''
                let outbound_list = this.outbound_task.outbound_list.filter(x => x.stock_id == store.state.cur_stock.FStockId)
                for (let i = 0; i < outbound_list.length; i++) { 
                    let obj = outbound_list[i]
                    this.set_plan_form(obj.material_no)
                    await this.load_inv_plans(obj.material_no)
                    let planned_qty = this._sum_planned_qty() // 已计划数
                    if (planned_qty >= obj.base_unit_qty) continue // 若已计划数满足需求，则跳过此条
                    await this.load_invs(obj.material_no)
                    let plan_qty = obj.base_unit_qty - planned_qty // 待计划数
                    for (let j = 0; j < this.invs.length; j++) {
                        if (plan_qty == 0) break
                        let inv = this.invs[j]
                        let inv_plan = this.inv_plans.find(x => inv['FStockLocId.FNumber'] == x['FStockLocId.FNumber'] && inv.FBatchNo == x.FBatchNo)
                        if (inv_plan) {
                            // 已有部分计划数，更新其数量
                            let checking_qty = Math.min(inv.FQty - inv_plan.FOpQTY, plan_qty)
                            plan_qty -= checking_qty
                            await InvPlan.update(inv_plan.FID, { FOpQTY: inv_plan.FOpQTY + checking_qty })
                        } else {
                            let checking_qty = Math.min(inv.FQty, plan_qty)
                            plan_qty -= checking_qty
                            let inv_plan = new InvPlan({
                                FOpType: 'out',
                                FStockId: store.state.cur_stock.FStockId,
                                FStockLocNo: inv['FStockLocId.FNumber'],
                                FMaterialId: inv.FMaterialId,
                                FOpQTY: checking_qty,
                                FBatchNo: inv.FBatchNo,
                                FBillNo: this.outbound_task.bill_no,
                                FOpStaffNo: store.state.cur_staff.FNumber
                            })
                            await inv_plan.save()
                        }
                    }
                    if (plan_qty > 0) {
                        lack_material = lack_material || obj.material_no // 若库存不足，则记录
                    }
                }
                uni.hideLoading()
                if (lack_material) {
                    this.set_plan_form(lack_material)
                    this.load_data(lack_material)
                    uni.showToast({ icon: 'none', title: '该物料库存不足' })
                } else {
                    this.set_plan_form(outbound_list[0].material_no)
                    this.load_data(outbound_list[0].material_no)
                    uni.showToast({ title: '一键分配完毕' })
                }
                this.$logger.info('>>> 一键分配结束')
            },
            async load_data(material_no) {
                await this.load_invs(material_no)
                await this.load_inv_plans(material_no)
                await this.load_inv_plans_ex(material_no)
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
                    return res.data
                })
            },
            async load_inv_plans(material_no) {
                const options = { 
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.outbound_task.bill_no,
                    'FMaterialId.FNumber': material_no,
                    FOpType: 'out',
                }
                const meta = { order: 'FBatchNo ASC, FStockLocId.FNumber ASC' }
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query(options, meta).then(res => {
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        if (inv_plan.FDocumentStatu != 'A') {
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
                    let outbound_obj = this.outbound_task.outbound_list.find(x => x.material_no == this.plan_form.material_no)
                    this.plan_form.is_complete = this._sum_planned_qty() >= outbound_obj.base_unit_qty
                    this._toggle_save_btn()
                    return res.data
                })
            },
            async load_inv_plans_ex(material_no) {
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query({
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo_ne: this.outbound_task.bill_no,
                    'FMaterialId.FNumber': material_no,
                    FOpType_in: ['out', 'mv', 'sub'],
                    FDocumentStatu_in: ['A', 'B']
                }, { order: 'FCreateTime ASC' }).then(res => {
                    this.$logger.info('>>> 加载其余入库计划，完毕')
                    uni.hideLoading()
                    this.inv_plans_ex = res.data
                })
            },
            async submit_delete(inv_plan) {
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
                    this.$refs.inv_plan_swipe.closeAll()
                    uni.showToast({ icon: 'error', title: '只能删除新增的计划' })
                }
            },
            async submit_save() {
                if (this.plan_form.is_complete) {
                    uni.showToast({ icon: 'none', title: '计划完毕'})
                    return
                }
                if (this.op_mode == 'check') {
                    let checked_invs = this.invs.filter(inv => inv.checked && inv.checked_qty > 0)
                    if (checked_invs.length == 0) {
                        uni.showToast({ icon: 'none', title: '未勾选库存' })
                        return
                    } 
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
                                FOpStaffNo: store.state.cur_staff.FNumber,
                                FReceiver: this.outbound_task.receiver
                            })
                            await inv_plan.save()
                        }
                    }
                    uni.hideLoading()
                    play_audio_prompt('success')
                    await this.load_inv_plans(this.plan_form.material_no)
                    this._update_inv_status() // 根据已建计划，更新库存列表的界面和操作限制
                }
                if (this.op_mode == 'scan') {
                    try {
                        let validate_res = await this.$refs.plan_form.validate()
                        let obj = this.outbound_task.outbound_list.find(x => x.material_no == this.plan_form.material_no)
                        // 1. 查询库存，指定物料+库位
                        // 2. 类似自动分配
                        let plan_qty = this.plan_form.op_qty * 1
                        for (let i = 0; i < this.invs.length; i++) {
                            if (plan_qty == 0) break
                            let inv = this.invs[i]
                            if (inv['FStockLocId.FNumber'] == this.plan_form.loc_no) {
                                let checking_qty = Math.min(inv.FQty, plan_qty)
                                plan_qty -= checking_qty
                                let inv_plan = new InvPlan({
                                    FOpType: 'out',
                                    FStockId: store.state.cur_stock.FStockId,
                                    FStockLocNo: inv['FStockLocId.FNumber'],
                                    FMaterialId: inv.FMaterialId,
                                    FOpQTY: checking_qty,
                                    FBatchNo: inv.FBatchNo,
                                    FBillNo: this.outbound_task.bill_no,
                                    FOpStaffNo: store.state.cur_staff.FNumber
                                })
                                await inv_plan.save()
                            }
                        }
                        this.plan_form.loc_no = ''
                        this.plan_form.op_qty = ''
                        await this.load_inv_plans(this.plan_form.material_no)
                        this._update_inv_status()
                    } catch (err) {  }
                }
            },
            handle_scan_code(text) {
                let type = ''
                if (is_material_no_format(text)) {
                    type = 'material_no'
                } else if (is_loc_no_std_format(text)) {
                    type = 'loc_no'
                } else if (!this.plan_form.material_no) {
                    type = 'material_no'
                } else if (!this.plan_form.loc_no) {
                    type = 'loc_no'
                }
                if (type == 'material_no') {
                    let obj = this.outbound_task.outbound_list.find(x => x.material_no == text.trim())
                    if (obj) {
                        this.set_plan_form(obj.material_no)
                        this.load_data(obj.material_no)
                    } else {
                        uni.showToast({ icon: 'none', title: '单据中没有该物料' })
                    }
                } else if (type == 'loc_no') {                    
                    let stock_loc = store.state.stock_locs.find(x => x.FNumber == text.trim())
                    if (stock_loc) {
                        this.plan_form.loc_no = stock_loc.FNumber
                    } else {
                        uni.showToast({ icon: 'none', title: '未知库位号' })
                    }
                } else {
                    uni.showToast({ icon: 'none', title: '未知号码' })
                } 
            },
            inv_menu() {
                if (!this.plan_form.material_id) {
                    uni.showToast({ icon: 'none', title: '请先选择物料' })
                    return
                }
                uni.showActionSheet({
                    itemList: ['库存明细', '物料详情'],
                    success: (e) => {
                        if (e.tapIndex === 0) link_to(`/pages/operation/manage/inv_search?t=${this.plan_form.material_no}`)
                        if (e.tapIndex === 1) link_to(`/pages/operation/material/show?id=${this.plan_form.material_id}`)
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
            set_plan_form(material_no) {
                let obj = this.outbound_task.outbound_list.find(x => x.material_no == material_no)
                if (obj) {
                    this.plan_form.material_id = obj.material_id
                    this.plan_form.material_no = obj.material_no
                    this.plan_form.base_unit_name = obj.base_unit_name
                    this.plan_form.decimal_unit = is_decimal_unit(obj.base_unit_name)
                } else {
                    this.plan_form.material_id = ''
                    this.plan_form.material_no = ''
                    this.plan_form.base_unit_name = 'Pcs'
                    this.plan_form.decimal_unit = false
                }
            },
            _toggle_save_btn() {
                if (this.plan_form.is_complete) {
                    this.goods_nav.button_group[1].backgroundColor = 'linear-gradient(90deg, #AAA, #606266)'
                } else {
                    this.goods_nav.button_group[1].backgroundColor = 'linear-gradient(90deg, #1E83FF, #0053B8)'
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
                        if (inv_plan['FStockLocId.FNumber'] == inv['FStockLocId.FNumber'] && inv_plan.FBatchNo == inv.FBatchNo && ['A', 'B'].includes(inv_plan.FDocumentStatu)) {
                            inv.planned_qty += inv_plan.FOpQTY
                            if (inv.planned_qty >= inv.FQty) inv.disabled = true
                        }
                    })
                    this.inv_plans_ex.forEach(inv_plan => {
                        if (inv_plan['FStockLocId.FNumber'] == inv['FStockLocId.FNumber'] && inv_plan.FBatchNo == inv.FBatchNo && ['A', 'B'].includes(inv_plan.FDocumentStatu)) {
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
    .uni-list-item__foot {
        align-items: center;
    }
    .plan-form {
        width: 100%;
        display: flex;
        justify-content: center;
    }
</style>
