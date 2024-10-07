<template>
    <view>
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
                        @click="material_no_click()" clickable
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
                    @click="material_no_click" clickable
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
                        :localdata="$store.state.stock_loc_opts"
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
        
        <uni-section title="库存信息"
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
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '新增',
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
            swipe_action_click(e, inv_plan) {
               if (e.index === 0) this.submit_delete(inv_plan) // btn:删除
            },
            goods_nav_click(e) {
                if (e.index == 0) this.material_no_click() // btn:选择物料
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
                if (sum_checked_qty + checking_qty >= plan_qty) {
                    this.invs.forEach(x =>  x.disabled = !x.checked)
                }
            },
            material_no_click() {
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
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') this.handle_scan_code(res.result)
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        this.handle_scan_code(res.result)
                    }
                })
                // #endif
            },
            async auto_allocate() {
                // 自动分配处理逻辑
                // 1. 遍历所有物料，生成计划
                // 2. 如果已有部分计划，则只生成剩余部分？
                // 3. 如果某物料库存不足，则暂时忽略，待其余处理完毕，切换至该物料的页面，并提示
                console.log('>>> 一键分配开始')
                uni.showLoading({ title: 'Loading' })
                let lack_material = ''
                for (let i = 0; i < this.outbound_task.outbound_list.length; i++) { 
                    let obj = this.outbound_task.outbound_list[i]
                    // console.log("一键分配", obj.material_no)
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
                if (lack_material) {
                    this.set_plan_form(lack_material)
                    this.load_data(lack_material)
                    uni.showToast({ icon: 'none', title: '该物料库存不足' })
                } else {
                    this.set_plan_form(this.outbound_task.outbound_list[0].material_no)
                    this.load_data(this.outbound_task.outbound_list[0].material_no)
                    uni.showToast({ title: '一键分配完毕' })
                }
                console.log('>>> 一键分配结束')
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
                            inv_plan.status = store.state.inv_plan_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
                    return res.data
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
                if (this.op_mode == 'check') {
                    let checked_invs = this.invs.filter(inv => inv.checked && inv.checked_qty > 0)
                    if (checked_invs.length == 0) {
                        uni.showToast({ icon: 'none', title: '选择库存数为0' })
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
                                FOpStaffNo: store.state.cur_staff.FNumber
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
                        console.log('validate plan form:', this.plan_form)
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
                } else if (!plan.mount_form.loc_no) {
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
            search_invs(material_no) {
                if (!material_no) uni.showToast({ icon: 'none', title: '请先选择物料' })
                uni.navigateTo({ url: '/pages/operation/manage/inv_search?t=' + material_no })
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
                    this.plan_form.material_no = obj.material_no
                    this.plan_form.base_unit_name = obj.base_unit_name
                    this.plan_form.decimal_unit = is_decimal_unit(obj.base_unit_name)
                } else {
                    this.plan_form.material_no = ''
                    this.plan_form.base_unit_name = 'Pcs'
                    this.plan_form.decimal_unit = false
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
                        if (inv_plan['FStockLocId.FNumber'] == inv['FStockLocId.FNumber'] && inv_plan.FBatchNo ==  inv.FBatchNo && ['A', 'B'].includes(inv_plan.FDocumentStatu)) {
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
