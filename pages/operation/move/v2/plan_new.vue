<template>
    <uni-notice-bar single scrollable text="查询物料获取库存信息，然后点击库存明细新增计划" />
    <uni-section title="查询物料" type="square">
        <template v-slot:right>
            <view class="uni-section__right">
                <uni-data-checkbox multiple
                    v-model="search_form.ex_cond"
                    :localdata="[{ text: '只查询成品', value: '3.' }]"
                    @change="ex_cond_change"
                    style="margin-right: -20px;"
                    >
                </uni-data-checkbox>
            </view>
        </template>
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.no" 
                placeholder="请输入搜索内容"
                prefix-icon="scan"
                @confirm="search"
                @clear="search"
                @icon-click="searchbar_icon_click"
                primary-color="rgb(238, 238, 238)"
                :styles="{
                    color: '#000',
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgb(238, 238, 238)'
                }"
                class="uni-mb-5"
            />
        </view>
    </uni-section>
    
    <uni-section title="物料信息" type="square" v-if="material.material_no">
        <uni-list>
            <uni-list-item
                :title="material.material_no"
                :note="[
                    `名称：${material.material_name}`, 
                    `规格：${material.material_spec}`
                ].join('\n')"
                :thumb="thumbnail_url(material.material_image)"
                thumb-size="lg"
            />
        </uni-list>
    </uni-section>
    
    <uni-section title="当前计划明细" type="square"
        sub-title="左滑可删除"
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
                                <template v-if="inv_plan.FOpType == 'mv'">
                                    <uni-icons type="redo" size="20" color="#007aff"></uni-icons>
                                    {{ inv_plan['FDestStockLocId.FNumber'] }}
                                </template>
                            </view>
                            <view class="note">
                                <view>批次：{{ inv_plan.FBatchNo }}</view>
                                <view v-if="inv_plan.FRemark?.trim()">备注：{{ inv_plan.FRemark }}</view>
                            </view>
                        </view>
                    </template>
                    
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <view class="op_qty">
                                <text v-if="inv_plan.FOpType == 'mv'" class="text-primary">移动 </text>
                                <text v-if="inv_plan.FOpType == 'add'" class="text-error">增加 </text>
                                <text v-if="inv_plan.FOpType == 'sub'" class="text-success">减少 </text>
                                <text>{{ inv_plan.FOpQTY }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                            </view>
                            <text class="status">{{ inv_plan.status }}</text>
                        </view>
                    </template>
                </uni-list-item>
            </uni-swipe-action-item>
        </uni-swipe-action>
    </uni-section>
    
    <uni-section title="库存信息" type="square"
        v-if="material.material_no" 
        class="above-uni-goods-nav">
        <template v-slot:right>
            <view class="uni-section__right">
                <view class="text-md text-primary" @click="open_move_dialog(null)">
                    <uni-icons type="plusempty" color="#007aff"></uni-icons>
                    新增库存
                </view>
            </view>
        </template>
        
        <uni-list v-if="invs.length">
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
        <uni-load-more
            v-else
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
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <!-- 搜索候选列表 -->
    <uni-drawer ref="search_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="搜索结果" type="square"
                sub-title="最多展示20条匹配结果"
                >
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.search_drawer.close()"/>
                    </view>
                </template>
                <uni-list>
                    <uni-list-item
                        v-for="(material, index) in search_form.candidates"
                        :key="index"
                        :title="material.FNumber"
                        :note="[
                            `名称：${material.FName}`, 
                            `规格：${material.FSpecification}`
                        ].join('\n')"
                        :thumb="thumbnail_url(material.FImageFileServer)"
                        thumb-size="lg"
                        @click="load_data(material.FNumber)" clickable
                        show-arrow
                        >
                    </uni-list-item>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
    
    <uni-popup ref="move_dialog" type="dialog">
        <uni-popup-dialog
            type="error"
            title="调整计划"
            cancelText="关闭"
            :confirmText="move_dialog.confirm_text"
            @close="close_move_dialog"
            @confirm="confirm_move_dialog"
            :beforeClose="true"
            style="width: 360px;"
            >
            <view class="move-form">
                <uni-data-checkbox
                    v-model="move_form.type" 
                    :localdata="[
                        { text: '转移库位', value: 'move', disable: edit_mode == 'new' },
                        { text: '调整数量', value: 'edit', disable: edit_mode == 'new' },
                        { text: '新增库存', value: 'new' }
                    ]"
                    class="uni-mb-10"
                    >
                </uni-data-checkbox>
                <uni-forms ref="move_form" :model="move_form" :rules="move_form_rules">
                    <template v-if="move_form.type == 'move'">
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
                                        :min="1"
                                        :max="move_form.inv.FQty - move_form.inv.planned_qty"
                                        :width="60"
                                    />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                    </template>
                    
                    <template v-if="move_form.type == 'edit'">
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                {{ move_form.inv['FStockLocId.FNumber'] || '-' }}                            
                            </uni-col>
                        </uni-row>
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                {{ move_form.inv['FBatchNo'] || '-' }}
                            </uni-col>
                        </uni-row>
                        <uni-row>
                            <uni-col :span="8" class="move-form-left">
                                <text>{{ move_form.inv.FQty - move_form.inv.planned_qty || '-' }}</text>
                                <text v-if="move_form.edit_qty > move_form.inv.FQty" class="moving-qty"> 
                                + {{ move_form.edit_qty - move_form.inv.FQty }}
                                </text>
                                <text v-if="move_form.edit_qty < move_form.inv.FQty" class="moving-qty">
                                - {{ move_form.inv.FQty - move_form.edit_qty }}
                                </text>
                            </uni-col>
                            <uni-col :span="4" class="move-form-center">
                                <uni-icons type="redo" :size="20" color="#007bff"></uni-icons>
                            </uni-col>
                            <uni-col :span="12" class="move-form-right">   
                                <uni-forms-item name="edit_qty" style="padding-top: 5px; line-height: 25px;">
                                    <template v-slot:label>
                                        <view></view><!-- 取消label高度限制 -->
                                    </template>
                                    <uni-number-box 
                                        v-model="move_form.edit_qty"
                                        :min="0"
                                        :max="9999"
                                        :width="60"
                                    />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                    </template>
                    
                    <template v-if="move_form.type == 'new'">
                        <uni-row>
                            <uni-forms-item label="库位" name="new_loc_no" label-width="40px">
                                <uni-data-picker
                                    v-model="move_form.new_loc_no"
                                    :localdata="$store.state.stock_loc_opts"
                                    split="-"
                                    popup-title="请选择库位"
                                />
                            </uni-forms-item>
                        </uni-row>
                        <uni-row>
                            <uni-forms-item label="批次" name="new_batch_no" label-width="40px">
                                <uni-datetime-picker
                                    v-model="move_form.new_batch_no" 
                                    type="date" return-type="string"
                                />
                            </uni-forms-item>
                        </uni-row>
                        <uni-row>
                            <uni-forms-item label="数量" name="new_qty" label-width="40px" >
                                <uni-number-box
                                    v-model="move_form.new_qty"
                                    :min="1"
                                    :max="9999"
                                    :width="60"
                                    style="padding-top: 5px; line-height: 25px;"
                                />
                            </uni-forms-item>
                        </uni-row>
                    </template>
                    
                    <uni-row>
                        <uni-forms-item label="备注" name="remark" label-width="40px" style="margin-bottom: 0;">
                            <uni-easyinput v-model="move_form.remark" type="textarea" auto-height trim="both" />
                        </uni-forms-item>
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { play_audio_prompt } from '@/utils'
    import { get_bd_material, search_bd_materials } from '@/utils/api'
    import { Inv, InvPlan } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                edit_mode: 'edit', // edit,new
                invs: [],
                inv_plans: [],
                material: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    base_unit_name: '',
                    material_image: ''
                },
                search_form: {
                    no: '',
                    ex_cond: uni.getStorageSync('mv_ex_cond') || [], // get
                    candidates: []
                },
                move_dialog: {
                    confirm_text: '新增'
                },
                move_form: {
                    type: 'move', // move: 改库位, edit: 改数量, new: 新增库位批次
                    inv: {},
                    dest_loc_no: '', // move
                    op_qty: 0, // move
                    edit_qty: 0, // edit
                    new_loc_no: '', // new
                    new_batch_no: '', // new
                    new_qty: 0, // new
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
                    new_loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                        ]
                    },
                    new_batch_no: {
                        rules: [
                            { required: true, errorMessage: '批次号不能为空' },
                        ]
                    },
                    op_qty: {
                        rules: [
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0 && this.move_form.type == 'move') return callback('移库数量必须大于0')
                                    // if (value < 0 && this.move_form.type == 'edit') return callback('调整数量必须大于等于0')
                                    if (value > this.move_form.inv.FQty - this.move_form.inv.planned_qty) {
                                        return callback('调整总数超过上限')
                                    }
                                }
                            }
                        ]
                    },
                    edit_qty: {
                        rules: [
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value === this.move_form.inv.FQty) return callback('库存数量没有变化')
                                }
                            }
                        ]
                    },
                    new_qty: {
                        rules: [
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('新增数量必须大于0')
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
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            if (this.search_form.no) this.load_data()
        },
        methods: {
            swipe_action_click(e, inv_plan) {
               if (e.index === 0) this.submit_delete(inv_plan) // btn:删除
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            ex_cond_change(e) {
                uni.setStorageSync('mv_ex_cond', e.detail.value) // set
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.no = res.result
                    this.search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            open_move_dialog(inv) {
                if (inv) {
                    this.edit_mode = 'edit'
                    this.move_form.inv = inv
                    this.move_form.edit_qty = inv.FQty
                } else {
                    this.edit_mode = 'new'
                    this.move_form.type = 'new'
                }
                this.$refs.move_dialog.open()
            },
            close_move_dialog() {
                this.$refs.move_dialog.close()
                this.move_form = { type: 'move', inv: {}, dest_loc_no: '', op_qty: 0 }
            },
            // 物料模糊匹配
            async search() {
                this._set_material()
                this.invs = []
                this.inv_plans = []
                this.search_form.no = this.search_form.no.trim()
                if (!this.search_form.no) return
                let options = { 
                    no: this.search_form.no, 
                    FUseOrgId: store.state.cur_stock.FUseOrgId,
                }
                if (this.search_form.ex_cond.includes('3.')) options.FNumber_pre = '3.'
                let meta = { per_page: 20, order: 'FMaterialId DESC' }
                uni.showLoading({ title: 'Loading' })
                search_bd_materials(options, meta).then(res => {
                    uni.hideLoading()
                    this.search_form.candidates = res.data
                    if (res.data.length > 1) this.$refs.search_drawer.open()
                    if (res.data.length === 1) this.load_data(res.data[0]?.FNumber)
                    if (res.data.length < 1) uni.showToast({ icon: 'none', title: '无匹配结果' })
                })
            },
            async confirm_move_dialog() {
                try {
                    await this.$refs.move_form.validate()
                    let inv_plan = new InvPlan()
                    if (this.move_form.type == 'move') {
                        inv_plan = new InvPlan({
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
                    } else if (this.move_form.type == 'edit') {
                        let diff = this.move_form.edit_qty - this.move_form.inv.FQty
                        inv_plan = new InvPlan({
                            FOpType: diff > 0 ? 'add' : 'sub',
                            FStockId: store.state.cur_stock.FStockId,
                            FStockLocNo: this.move_form.inv['FStockLocId.FNumber'],
                            FMaterialId: this.move_form.inv.FMaterialId,
                            FOpQTY: Math.abs(diff),
                            FBatchNo: this.move_form.inv.FBatchNo,
                            FOpStaffNo: store.state.cur_staff.FNumber,
                            FRemark: this.move_form.remark?.trim()
                        })
                    } else if (this.move_form.type == 'new') {
                        inv_plan = new InvPlan({
                            FOpType: 'add',
                            FStockId: store.state.cur_stock.FStockId,
                            FStockLocNo: this.move_form.new_loc_no,
                            FMaterialId: this.material.material_id,
                            FOpQTY: this.move_form.new_qty,
                            FBatchNo: this.move_form.new_batch_no.replace(/-/g, ''),
                            FOpStaffNo: store.state.cur_staff.FNumber,
                            FRemark: this.move_form.remark?.trim()
                        })
                    }
                    uni.showLoading({ title: 'Loading' })
                    let res = await inv_plan.save()
                    uni.hideLoading()
                    play_audio_prompt('success')
                    this.close_move_dialog()
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        await this.load_inv_plans(this.material.material_no)
                        this._update_inv_status()
                        // this._event_channel_reload_inv_plans()
                        uni.showToast({ title: '保存成功' }) 
                    } else {
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                    
                } catch (err) {}
            },
            async load_data(material_no) {
                if (!material_no) {
                    this._set_material()
                    this.invs = []
                    this.inv_plans = []
                    return
                }
                this.$refs.search_drawer.close()
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
                    FOpType_in: ['mv', 'add', 'sub'],
                    FDocumentStatu_in: ['A', 'B']
                }
                const meta = { order: 'FStockLocId.FNumber ASC, FBatchNo ASC' }
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query(options, meta).then(res => {
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        if (inv_plan.FDocumentStatu != 'A') {
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
                    return res.data
                })
            },
            async load_material(material_no) {
                let bd_material = this.search_form.candidates.find(x => x.FNumber == material_no)
                if (bd_material) return bd_material
                let res = await get_bd_material(material_no, store.state.cur_stock.FUseOrgId)
                if (res.data[0]) {                  
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
                    this.material.material_id = bd_material.FMaterialId
                    this.material.material_no = bd_material.FNumber
                    this.material.material_name = bd_material.FName
                    this.material.material_spec = bd_material.FSpecification
                    this.material.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.material.material_image = bd_material.FImageFileServer
                } else {
                    this.material.material_id = ''
                    this.material.material_no = ''
                    this.material.material_name = ''
                    this.material.material_spec = ''
                    this.material.base_unit_name = 'Pcs'
                    this.material.material_image = ''
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
            thumbnail_url(file_id) {
                return K3CloudApi.thumbnail_url(file_id)
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
            margin-bottom: 22px;
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
