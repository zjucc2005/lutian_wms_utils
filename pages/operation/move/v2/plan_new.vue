<template>
    <view>
        <uni-notice-bar single scrollable text="查询物料编码获取库存信息，然后点击库存明细新增计划" />
        <uni-section title="查询物料编码" type="square">
            <uni-search-bar
                v-model="search_form.no"
                bgColor="#EEEEEE"
                cancelButton="none"
                @confirm="handle_search"
                @clear="handle_search"
            />
            <uni-list v-if="material.material_no">
                <uni-list-item
                    :title="material.material_no"
                    :note="[
                        `名称：${material.material_name}`, 
                        `规格：${material.material_spec}`
                    ].join('\n')"
                />
            </uni-list>
        </uni-section>
        
        <uni-section title="当前计划明细" type="square"
            v-if="inv_plans.length">
            <template v-slot:right>
                <view class="uni-section__right">
                    <view >
                        已计划 <text class="sum_qty">{{ _sum_planned_qty() }}</text> {{ material.base_unit_name }}
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
                    <uni-list-item>
                        <template v-slot:body>
                            <view class="uni-list-item__body">
                                <view class="title">
                                    {{ inv_plan['FStockLocId.FNumber'] }}
                                    <uni-icons type="redo" size="20" color="#007aff"></uni-icons>
                                    {{ inv_plan['FDestStockLocId.FNumber'] }}
                                </view>
                                <view class="note">
                                    <view>批次：{{ inv_plan.FBatchNo }}</view>
                                    <view v-if="inv_plan.FRemark?.trim()">备注：{{ inv_plan.FRemark }}</view>
                                </view>
                            </view>
                        </template>
                        
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
        
        <uni-section title="库存信息" type="square"
            v-if="invs.length" 
            class="above-uni-goods-nav">
            <uni-list>
                <template v-for="(inv, index) in invs" :key="index">
                    <uni-list-item
                        :title="inv['FStockLocId.FNumber']"
                        :note="`批次：${inv['FBatchNo']}`"
                        :rightText="[inv['FQty'], inv['FStockUnitId.FName']].join(' ')"
                        @click="open_move_dialog(inv)" clickable
                        showArrow
                        :show-extra-icon="true"
                        :extra-icon="{ type: 'location', size: '24' }">
                        
                        <template v-slot:footer>
                            <view class="uni-list-item__foot">
                                <text class="op_qty">
                                    <template v-if="inv.planned_qty">({{ inv.FQty - inv.planned_qty }})</template>
                                    {{ inv.FQty }} {{ inv['FStockUnitId.FName'] }}
                                </text>
                            </view>
                        </template>
                    </uni-list-item>
                </template>
                
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
        
        <uni-popup ref="move_dialog" type="dialog">
            <uni-popup-dialog
                type="error"
                title="调整计划"
                cancelText="关闭"
                :confirmText="move_dialog.confirm_text"
                @close="close_move_dialog"
                @confirm="confirm_move_dialog"
                :beforeClose="true"
                >
                <view class="move-form">
                    <uni-forms ref="move_form" :model="move_form" :rules="move_form_rules">
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                {{ move_form.inv['FStockLocId.FNumber'] || '-' }}                            
                            </uni-col>
                            <uni-col :span="4" class="move-form-center">
                                <uni-icons type="redo" :size="20" color="#007bff"></uni-icons>
                            </uni-col>
                            <uni-col :span="12" class="move-form-right">
                                <uni-forms-item name="dest_loc_no">
                                    <uni-data-picker
                                        v-model="move_form.dest_loc_no"
                                        :localdata="$store.state.stock_loc_opts"
                                        split="-"
                                        popup-title="请选择库位"
                                        :readonly="this.move_form.action == 'edit'"
                                    />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                {{ move_form.inv['FBatchNo'] || '-' }}
                            </uni-col>
                            <uni-col :span="4" class="move-form-center">
                                <uni-icons type="redo" :size="20" color="#007bff"></uni-icons>
                            </uni-col>
                            <uni-col :span="12" class="move-form-right">
                                {{ move_form.inv['FBatchNo'] }}
                            </uni-col>
                        </uni-row>
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                <text>{{ move_form.inv.FQty - move_form.inv.planned_qty || '-' }}</text>
                                <text v-if="move_form.op_qty" class="moving-qty"> - {{ move_form.op_qty }}</text>
                            </uni-col>
                            <uni-col :span="4" class="move-form-center">
                                <uni-icons type="redo" :size="20" color="#007bff"></uni-icons>
                            </uni-col>
                            <uni-col :span="12" class="move-form-right">   
                                <uni-forms-item name="op_qty" style="padding-top: 5px; line-height: 25px;">
                                    <template v-slot:label>
                                        <view></view><!-- 取消label高度限制 -->
                                    </template>
                                    <uni-number-box 
                                        v-model="move_form.op_qty"
                                        :min="0"
                                        :max="move_form.inv.FQty - move_form.inv.planned_qty"
                                        :width="60"
                                    />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                        <uni-row>
                            <uni-forms-item label="备注" name="remark" label-width="40px" style="margin-bottom: 0;">
                                <uni-easyinput v-model="move_form.remark" type="textarea" auto-height trim="both" />
                            </uni-forms-item>
                        </uni-row>
                    </uni-forms>
                </view>
            </uni-popup-dialog>
        </uni-popup>
    </view>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { get_bd_material } from '@/utils/api'
    import { Inv, InvPlan } from '@/utils/model'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif 
    export default {
        data() {
            return {
                bd_materials: [], // 物料基础数据Array，cache
                invs: [],
                inv_plans: [],
                material: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    base_unit_name: ''
                },
                search_form: {
                    no: ''
                },
                move_dialog: {
                    confirm_text: '新增'
                },
                move_form: {
                    action: 'new',
                    inv: {},
                    dest_loc_no: '',
                    op_qty: 0,
                    remark: ''
                },
                move_form_rules: {
                    dest_loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value == this.move_form.inv['FStockLocId.FNumber']) {
                                        return callback('库位号不能相同')
                                    }
                                    if (this._exist_inv_plan()) {
                                        return callback('目标库存号已有计划')
                                    }
                                }
                            }
                        ]
                    },
                    op_qty: {
                        rules: [
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('调整数量必须大于0')
                                    if (value > this.move_form.inv.FQty - this.move_form.inv.planned_qty) {
                                        return callback('调整总数超过上限')
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
                        { icon: 'cart', text: '计划', info: 0 }
                    ],
                    button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            if (this.search_form.no) this.handle_search()
        },
        methods: {
            swipe_action_click(e, inv_plan) {
               if (e.index === 0) this.submit_delete(inv_plan) // btn:删除
            },
            goods_nav_click(e) {
                // if (e.index === 0) this.preview_cart()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    // console.log('myScanCode res:', res)
                    if (res.success == 'true') {
                        this.search_form.no = res.result
                        this.handle_search()
                    }
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        // console.log('uni.scanCode res:', res)
                        this.search_form.no = res.result
                        this.handle_search()
                    }
                })
                // #endif
            },
            open_move_dialog(inv) {
                // console.log('open_move_dialog inv:', inv)
                this.move_form.inv = inv
                this.$refs.move_dialog.open()
            },
            close_move_dialog() {
                // console.log('close_move_dialog')
                this.$refs.move_dialog.close()
                this.move_form = { inv: {}, dest_loc_no: '', op_qty: 0 }
            },
            async confirm_move_dialog() {
                try {
                    await this.$refs.move_form.validate()
                    let inv_plan = new InvPlan({
                        FOpType: 'mv',
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: this.move_form.inv['FStockLocId.FNumber'],
                        FDestStockLocNo: this.move_form.dest_loc_no,
                        FMaterialId: this.move_form.inv.FMaterialId,
                        FOpQTY: this.move_form.op_qty,
                        FBatchNo: this.move_form.inv.FBatchNo,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                        FRemark: this.move_form.remark?.trim()
                    })
                    uni.showLoading({ title: 'Loading' })
                    let res = await inv_plan.save()
                    uni.hideLoading()
                    play_audio_prompt('success')
                    this.close_move_dialog()
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        await this.load_inv_plans(this.material.material_no)
                        this._update_inv_status()
                        this._event_channel_reload_inv_plans()
                        uni.showToast({ title: '保存成功' }) 
                    } else {
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                    
                } catch (err) { console.log('err', err) }
            },
            async handle_search() {
                if (!this.search_form.no) {
                    this._set_material()
                    this.invs = []
                    this.inv_plans = []
                    return
                }
                let material_no = this.search_form.no
                uni.showLoading({ title: 'Loading' })
                let bd_material = await this.load_material(material_no)
                this._set_material(bd_material)
                if (bd_material) {
                    await this.load_invs(material_no)
                    await this.load_inv_plans(material_no)
                    this._update_inv_status()
                } else {
                    this.invs = []
                    this.inv_plans = []
                }
                uni.hideLoading()
            },
            async load_invs(material_no) {
                const options = {
                    FStockId: store.state.cur_stock.FStockId,
                    'FMaterialId.FNumber': material_no,
                    FQty_gt: 0,
                }
                const meta = { order: 'FStockLocId.FNumber ASC, FBatchNo ASC' }
                return Inv.query(options, meta).then(res => { 
                    this.invs = res.data
                })
            },
            async load_inv_plans(material_no) {
                const options = {
                    FStockId: store.state.cur_stock.FStockId,
                    'FMaterialId.FNumber': material_no,
                    FOpType: 'mv',
                    FDocumentStatus_in: ['A', 'B']
                }
                const meta = { order: 'FStockLocId.FNumber ASC, FBatchNo ASC' }
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
            async load_material(material_no) {
                let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                if (bd_material) return bd_material
                let res = await get_bd_material(material_no, store.state.cur_stock.FUseOrgId)
                if (res.data[0]) {                  
                    this.bd_materials.push(res.data[0])
                    return res.data[0]
                }
            },
            async submit_delete(inv_plan) {
                if (inv_plan.FDocumentStatu == 'A') {
                    uni.showLoading({ title: 'Loading' })
                    let res = await InvPlan.delete([inv_plan.FID])
                    uni.hideLoading()
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        play_audio_prompt('delete')
                        this.$refs.inv_plan_swipe.closeAll()
                        await this.load_inv_plans(this.material.material_no)
                        this._update_inv_status()
                        this._event_channel_reload_inv_plans()
                    } else {
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                } else {
                    this.$refs.inv_plan_swipe.closeAll()
                    uni.showToast({ icon: 'error', title: '只能删除新增的计划' })
                }
            },
            _exist_inv_plan() {
                return this.inv_plans.find(inv_plan => { 
                    return inv_plan.FBatchNo == this.move_form.inv.FBatchNo
                    && inv_plan['FStockLocId.FNumber'] == this.move_form.inv['FStockLocId.FNumber'] 
                    && inv_plan['FDestStockLocId.FNumber'] == this.move_form.dest_loc_no
                })
            },
            _set_material(bd_material) {
                if (bd_material) {
                    this.material.material_id = bd_material.FID
                    this.material.material_no = bd_material.FNumber
                    this.material.material_name = bd_material.FName
                    this.material.material_spec = bd_material.FSpecification
                    this.material.base_unit_name = bd_material['FBaseUnitId.FName']
                } else {
                    this.material.material_id = ''
                    this.material.material_no = ''
                    this.material.material_name = ''
                    this.material.material_spec = ''
                    this.material.base_unit_name = 'Pcs'
                }
            },
            _sum_planned_qty() {
                return this.inv_plans.map(x => x.FOpQTY).concat([0]).reduce((x, y) => x + y)
            },
            _update_inv_status() {
                this.invs.forEach(inv => {
                    inv.planned_qty = 0
                    this.inv_plans.forEach(inv_plan => {
                        if (inv_plan['FStockLocId.FNumber'] == inv['FStockLocId.FNumber'] && inv_plan.FBatchNo ==  inv.FBatchNo) {
                            inv.planned_qty += inv_plan.FOpQTY
                        }
                    })
                })
            },
            _event_channel_reload_inv_plans() {
                const eventChannel = this.getOpenerEventChannel();
                eventChannel.emit('reloadInvPlans', { reload: true })
            }
        }
    }
</script>

<style lang="scss">
    .move-form {
        flex: 1;
        font-size: $uni-font-size-base;
        line-height: 35px;
        .move-form-left {
            color: $uni-text-color-grey;
            .moving-qty {
                margin-left: 2px;
                color: $uni-color-error;
                font-weight: bold;
            }
        }
        .move-form-right {
            color: $uni-text-color;
            height: 50px;
        }
    }
</style>
