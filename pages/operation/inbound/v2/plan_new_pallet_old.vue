<template>
    <uni-section title="新增计划明细" type="square"
        :sub-title="inbound_task.bill_no"
        sub-title-color="#007aff"
        >
        <uni-steps :options="step_options" :active="step_active" class="uni-mt-5 uni-mb-5" />
        
        <uni-list v-if="plan_form.material_no">
            <template
                v-for="(obj, index) in inbound_task.inbound_list"
                :key="index"
                >
                <uni-list-item
                    v-if="obj.material_no == plan_form.material_no && obj.dest_stock_id == $store.state.cur_stock.FStockId"
                    :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                    @click="$refs.material_drawer.open()" clickable
                    show-arrow
                    >
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <view class="title">{{ obj.material_no }}</view>
                            <view class="note">
                                <view>名称：{{ obj.material_name }}</view> 
                                <view>规格：{{ obj.material_spec }}</view>
<!--                                <view>
                                    <uni-icons type="home" color="#999"></uni-icons>
                                    <text class="src-stock">{{ obj.src_stock_name || '?' }}</text>
                                    <uni-icons type="redo" color="#007bff" style="margin: 0 5px;"></uni-icons> 
                                    <uni-icons type="home" color="#007bff" ></uni-icons>
                                    <text class="dest-stock">{{ obj.dest_stock_name }}</text>
                                </view> -->
                                <!-- <view v-if="obj.src_stock_name">调出仓库：{{ obj.src_stock_name }}</view> -->
                                <view>调入仓库：<text class="text-primary">{{ obj.dest_stock_name }}</text></view>
                                <view>批次：{{ obj.batch_no }}</view>
                            </view>
                        </view>
                    </template>
                </uni-list-item>
            </template>
        </uni-list>
        <uni-list v-else>
            <uni-list-item
                :show-extra-icon="true"
                :extra-icon="{ type: 'list', size: '24', color: '#007bff' }"
                title="点击选择物料"
                @click="$refs.material_drawer.open()" clickable
                show-arrow
            />
        </uni-list>
    </uni-section>
    
    <!-- display 1: form -->
    <uni-section title="填写托盘信息" type="square"
        sub-title="‌‌总和 = ∑ (每托数量 x 托数)"
        v-if="step_active === 1"
        >
        <template v-slot:right>
            <view class="uni-section__right">
                <view >
                    总和： <text class="sum_qty">{{ _sum_qty_of_pallet_info() }}</text> {{ plan_form.base_unit_name }}
                </view>
            </view>
        </template>
        
        <view class="container">
            <uni-table ref="pallet_infos" border stripe class="pallet-infos">
                <uni-tr>
                    <uni-th align="center" width="150">每托数量</uni-th>
                    <uni-th align="center" width="150">托数</uni-th>
                    <uni-th align="center" width="50"></uni-th>
                </uni-tr>
                <uni-tr v-for="(info, index) in plan_form.pallet_infos" :key="index">
                    <uni-td align="center">
                        <uni-easyinput type="number" :clearable="false" :input-border="false"
                            v-model="info.per_qty"
                            @blur="validate_pallet_info($event, info, 'per_qty')"
                            style="text-align: center;"
                            ></uni-easyinput>
                    </uni-td>
                    <uni-td align="center">
                        <uni-easyinput type="number" :clearable="false" :input-border="false"
                            v-model="info.pallet_qty"
                            @blur="validate_pallet_info($event, info, 'pallet_qty')"
                            style="text-align: center;"
                            ></uni-easyinput>
                    </uni-td>
                    <uni-td align="center">
                        <uni-icons type="minus" size="24" color="#dd524d"
                            v-if="plan_form.pallet_infos.length > 1" disabled
                            @click="del_pallet_info(index)">
                        </uni-icons>
                    </uni-td>
                </uni-tr>
            </uni-table>
            <button type="primary" 
                v-if="plan_form.pallet_infos.length < 5"
                @click="add_pallet_info" class="add-pallet-info-btn">
                + 新增托盘规格
            </button>
        </view>
    </uni-section>
     
    <uni-section title="配置信息" type="square"
        v-if="step_active === 1"
        class="above-uni-goods-nav"
        >
        <uni-list>
            <uni-list-item title="起点库位"
                note="默认值由系统自动分配，不建议修改"
                @click="open_dialog('op_loc_no_dialog')" clickable
                show-arrow
                >
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <view class="op_qty lg">
                            <text class="status">{{ plan_form.op_loc_no }}</text>
                        </view>
                    </view>
                </template>
            </uni-list-item>
            
            <uni-list-item title="每个库位放置托盘数"
                note="默认值为2，不建议修改"
                @click="open_dialog('per_pallet_qty_dialog')" 
                :clickable="plan_form.per_pallet_qty > 0"
                show-arrow
                >
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <view class="op_qty lg">
                            <text class="status">{{ plan_form.per_pallet_qty || '∞' }}</text>
                        </view>
                    </view>
                </template>
            </uni-list-item>
            
            <uni-list-item title="灵活库位"
                note="货架库位分配完后的保留库位"
                @click="open_dialog('flex_loc_no_dialog')" clickable
                show-arrow
                >
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <view class="op_qty lg">
                            <text class="status">{{ plan_form.flex_loc_no }}</text>
                        </view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <uni-popup ref="op_loc_no_dialog" type="dialog">
        <uni-popup-dialog title="起点库位" type="error" :show-close="false">
            <view class="plan-form">
                <uni-data-picker
                    v-model="plan_form.op_loc_no"
                    :localdata="stock_loc_opts"
                    split="-"
                    popup-title="请选择起点库位"
                    :clear-icon="false"
                    @change="op_loc_no_change"
                    class="op-loc-no-data-picker"
                />
            </view>
        </uni-popup-dialog>
    </uni-popup>
    <uni-popup ref="per_pallet_qty_dialog" type="dialog">
        <uni-popup-dialog title="每个库位放置托盘数" type="error" :show-close="false">
            <view class="plan-form">
                <uni-number-box v-model="plan_form.per_pallet_qty" :min="1" />
            </view>
        </uni-popup-dialog>
    </uni-popup>
    <uni-popup ref="flex_loc_no_dialog" type="dialog">
        <uni-popup-dialog title="灵活库位" type="error" :show-close="false">
            <view class="plan-form">
               <uni-data-select
                    v-model="plan_form.flex_loc_no"
                    :localdata="loc_nos.filter(x => x.sp).map(x => {return { value: x.loc_no, text: x.loc_no }})"
                ></uni-data-select>
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
    <!-- display 2: preview -->
    <uni-section title="预览计划明细" type="square"
        sub-title="预览确认无误后，请保存计划"
        v-if="step_active === 2"
        class="above-uni-goods-nav"
        >
        <template v-slot:right>
            <view class="uni-section__right">
                <uni-icons type="closeempty" size="24" color="#333" @click="preview_close"/>
            </view>
        </template>
        
        <uni-list>
            <uni-list-item 
                v-for="(item, index) in inv_plans_preview" 
                :key="index"
                :show-extra-icon="true"
                :extra-icon="{ type: 'arrow-up', size: '24', color: '#dd524d' }"
                :title="item.loc_no"
                :note="`${item.pallet_infos.length} 托 (${item.pallet_infos.join(', ')})`"
                :right-text="`${item.qty} ${this.plan_form.base_unit_name}`"
                >
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <!-- display 3: inv_plans -->
    <uni-section title="当前计划明细" type="square"
        v-if="step_active === 3"
        class="above-uni-goods-nav">
        <template v-slot:right>
            <view class="uni-section__right">
                <view >
                    总和： <text class="sum_qty">{{ _sum_inv_plan_op_qty() }}</text> {{ plan_form.base_unit_name }}
                </view>
            </view>
        </template>
        
        <uni-list>
            <uni-list-item
                v-for="(inv_plan, index) in inv_plans.filter(x => x.FMaterialId === plan_form.material_id)"
                :key="index"
                :show-extra-icon="true"
                :extra-icon="{ type: 'arrow-up', size: '24', color: '#dd524d' }"
                :title="inv_plan['FStockLocId.FNumber']"
                :note="`${inv_plan.FPalletQty} 托(${inv_plan.FRemark})`"
                >
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <text class="op_qty">{{ inv_plan.FOpQTY }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                        <text class="status">{{ inv_plan.status }}</text>
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
            @button-click="goods_nav_button_click"
        />
    </view>
    
    <uni-drawer ref="material_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="入库物料列表" type="square" sub-title="点击切换当前物料">
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="20" color="#333" @click="$refs.material_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list>
                    <template
                        v-for="(obj, index) in inbound_task.inbound_list"
                        :key="index"
                        >
                        <uni-list-item
                            v-if="obj.dest_stock_id == $store.state.cur_stock.FStockId"
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
</template>

<script>
    import store from '@/store'
    import { InboundTask, Inv, InvPlan, StockLoc } from '@/utils/model'
    import { play_audio_prompt, is_decimal_unit, is_loc_no_std_format, compare_loc_no } from '@/utils'
    export default {
        data() {
            return {
                inbound_task: {},
                loc_nos: [], // 库位列表（正序），方便查询
                stock_loc_opts: [], // picker 库位选项
                invs: [],
                inv_plans: [],
                inv_plans_ex: [], // 其他单据未执行的计划，统计空闲库位时要考虑进去
                inv_plans_preview: [],
                plan_form: {
                    material_id: '',
                    material_no: '',
                    base_unit_name: '',
                    decimal_unit: false,
                    op_loc_no: '', // 起点库位(空闲)
                    per_pallet_qty: 2, // 每个库位放置托盘数
                    flex_loc_no: '', // 灵活库位(独立库位)
                    pallet_infos: [],
                },
                step_options: [{ title: '选择物料' }, { title: '填写表单' }, { title: '预览' }, { title: '保存' }],
                step_active: 0,
                goods_nav: {
                    options: [
                        { icon: 'list', text: '物料' }
                    ],
                    button_group: [
                        {
                            text: '返回',
                            backgroundColor: store.state.goods_nav_color.grey,
                            color: '#fff'
                        },
                        {
                            text: '预览',
                            backgroundColor: store.state.goods_nav_color.grey,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('sendInboundTask', res => {
                if (res.inbound_task) {
                    this.inbound_task = res.inbound_task
                } else {
                    this.inbound_task = InboundTask.current()
                }
                this.load_data(res.material_no)
            })
        },
        mounted() {
            StockLoc.query({ FStockId: store.state.cur_stock.FStockId, FForbidStatus: 'B' }).then(res => {
                store.commit('update_stock_locs', res.data) // 只查询禁用库存
            })
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.material_drawer.open()  // this.material_no_click() // btn:选择物料
            },
            goods_nav_button_click(e) { 
                if (this.step_active === 0) {
                    if (e.index === 0) uni.navigateBack()
                    if (e.index === 1) this.preview()
                } else if (this.step_active === 1) {
                    if (e.index === 0) uni.navigateBack()
                    if (e.index === 1) this.preview() // btn:预览
                } else if (this.step_active === 2) {
                    if (e.index === 0) this.preview_close()
                    if (e.index === 1) this.submit_save() // btn:保存
                } else if (this.step_active === 3) {
                    if (e.index === 0) uni.navigateBack()
                    if (e.index === 1) this.if_submit_delete() // btn:删除
                }
            },
            material_no_click(material_no) {
                this.$refs.material_drawer.close()
                if (this.plan_form.material_no == material_no) return
                this.init_plan_form(material_no)
                play_audio_prompt('success')
                // let list = this.inbound_task.inbound_list.
                // filter(x => x.dest_stock_id == store.state.cur_stock.FStockId).
                // map(x => this.plan_form.material_no == x.material_no ? '-> ' + x.material_no : x.material_no)
                // uni.showActionSheet({
                //     itemList: list,
                //     success: (e) => {
                //         if (list[e.tapIndex].startsWith('->')) return // 当前选中物料不变时，不做操作
                //         play_audio_prompt('success')
                //         this.plan_form.material_no = list[e.tapIndex]
                //         this.init_plan_form(list[e.tapIndex])
                //     }
                // })
            },
            preview() {
                if (this.step_active === 2) return // 已在预览页面，忽略
                if (!this.plan_form.material_no) {
                    uni.showToast({ icon: 'none', title: '请先选择物料' })
                    return
                }
                let obj = this.inbound_task.inbound_list.find(x => x.material_no == this.plan_form.material_no)
                if (this._sum_qty_of_pallet_info() !== obj.base_unit_qty) {
                    uni.showToast({ icon: 'none', title: '物料数量不一致' })
                    return
                }
                try {
                    let inv_plans_preview = []
                    let cur_loc_no = this.plan_form.op_loc_no
                    let cur_loc = { loc_no: cur_loc_no, qty: 0, pallet_infos: [] }
                    this.plan_form.pallet_infos.forEach(info => {
                        if (info.per_qty && info.pallet_qty) {
                            for (let i = 0; i < info.pallet_qty; i++) {
                                if (is_loc_no_std_format(cur_loc_no)) {
                                    if (cur_loc.pallet_infos.length >= this.plan_form.per_pallet_qty) {
                                        inv_plans_preview.push(cur_loc)
                                        cur_loc_no = this._next_idle_loc_no(cur_loc_no)
                                        cur_loc = { loc_no: cur_loc_no, qty: info.per_qty, pallet_infos: [info.per_qty] }
                                    } else {
                                        cur_loc.qty += info.per_qty
                                        cur_loc.pallet_infos.push(info.per_qty)
                                    }
                                } else {
                                    // 独立库位，托盘数无限制
                                    cur_loc.qty += info.per_qty
                                    cur_loc.pallet_infos.push(info.per_qty)
                                }
                            }
                        }
                    })
                    if (cur_loc.qty) inv_plans_preview.push(cur_loc)
                    this.inv_plans_preview = inv_plans_preview
                    this._activate_step(2) // preview
                    play_audio_prompt('success')
                } catch (err) {
                    uni.showToast({ icon: 'error', title: err.message })
                }  
            },
            preview_close() {
                this.inv_plans_preview = []
                this._activate_step(1) // form
                play_audio_prompt('delete')
            },
            if_submit_delete() {
                uni.showModal({
                    title: '删除',
                    content: '是否确定删除当前物料的全部计划明细？',
                    success: (res) => {
                        if (res.confirm) this.submit_delete()
                    },
                    fail: (err) => {}
                })
            },
            add_pallet_info() {
                this.plan_form.pallet_infos.push({ per_qty: '', pallet_qty: '' })
            },
            del_pallet_info(index) {
                this.plan_form.pallet_infos.splice(index, 1)
            },
            validate_pallet_info(e, info, attr) {
                let value = Number(e.detail.value)
                if (value <= 0) {
                    info[attr] = ''
                    if (value < 0) uni.showToast({ icon: 'none', title: '数量必须大于0'})
                } else {
                    info[attr] = value
                }
            },
            open_dialog(ref) {
                this.$refs[ref].open()
            },
            op_loc_no_change(e) {
                if (!is_loc_no_std_format(e.detail.value.slice(-1)[0]?.value)) {
                    this.plan_form.per_pallet_qty = 0
                } else {
                    this.plan_form.per_pallet_qty ||= 2
                }
            },
            async load_data(material_no='') {
                await this.load_invs()
                await this.load_inv_plans()
                await this.load_inv_plans_ex()
                if (material_no) this.init_plan_form(material_no)
            },
            async load_invs() {
                let options = { FStockId: store.state.cur_stock.FStockId }
                let meta = { order: 'FMaterialId.FNumber ASC, FStockLocId.FNumber ASC' }
                uni.showLoading({ title: 'Loading' })
                return Inv.get_all(options, meta).then(res => {
                    this.$logger.info('>>> 加载库存，完毕')
                    uni.hideLoading()
                    this.invs = res
                })
            },
            async load_inv_plans() {
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query({ 
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.inbound_task.bill_no,
                    FOpType: 'in',
                }, { order: 'FCreateTime ASC' }).then(res => {
                    this.$logger.info('>>> 加载入库计划，完毕')
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        if (inv_plan.FDocumentStatu != 'A') {
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
                })
            },
            async load_inv_plans_ex() {
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query({
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo_ne: this.inbound_task.bill_no,
                    FOpType: 'in',
                    FDocumentStatu_in: ['A', 'B']
                }, { order: 'FCreateTime ASC' }).then(res => {
                    this.$logger.info('>>> 加载其余入库计划，完毕')
                    uni.hideLoading()
                    this.inv_plans_ex = res.data
                    // this._set_loc_nos()
                })
            },
            async submit_delete() {
                if (this.step_active !== 3) return
                
                let inv_plans = this.inv_plans.filter(inv_plan => inv_plan.FMaterialId === this.plan_form.material_id)
                if (inv_plans.some(inv_plan => inv_plan.FDocumentStatu != 'A')) {
                    uni.showToast({ icon: 'none', title: '不能删除' })
                    return
                }
                uni.showLoading({ title: 'Loading' })
                let res = await InvPlan.delete(inv_plans.map(x => x.FID))
                uni.hideLoading()
                if (res.data.Result.ResponseStatus.IsSuccess) {
                    play_audio_prompt('delete')
                    await this.load_inv_plans()
                    this.init_plan_form(this.plan_form.material_no)
                } else {
                    uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            },
            async submit_save() {
                if (this.step_active !== 2) return
                uni.showLoading({ title: 'Loading' })
                let obj = this.inbound_task.inbound_list.find(x => x.material_no == this.plan_form.material_no)
                for (let i = 0; i < this.inv_plans_preview.length; i++) {
                    let item = this.inv_plans_preview[i]
                    let inv_plan = new InvPlan({
                        FOpType: 'in',
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: item.loc_no,
                        FMaterialId: obj.material_id, // NOTE
                        FOpQTY: item.qty * 1,
                        FBatchNo: obj.batch_no,
                        FBillNo: this.inbound_task.bill_no,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                        FRemark: item.pallet_infos.join(','),
                        FPalletQty: item.pallet_infos.length
                    })
                    await inv_plan.save()
                }
                uni.hideLoading()
                play_audio_prompt('success')
                await this.load_inv_plans()
                this._activate_step(3) // save
                uni.pageScrollTo({ scrollTop: 0 })
            },
            // 初始化表单相关字段
            init_plan_form(material_no) {
                uni.showLoading({ title: '初始化表单' })
                let obj = this.inbound_task.inbound_list.find(x => x.material_no == material_no)
                this.plan_form.per_pallet_qty = 2
                this.plan_form.pallet_infos = [{ per_qty: '', pallet_qty: '' }]
                this._set_loc_nos()
                if (obj) {
                    this.plan_form.material_id = obj.material_id
                    this.plan_form.material_no = obj.material_no
                    this.plan_form.base_unit_name = obj.base_unit_name
                    this.plan_form.decimal_unit = is_decimal_unit(obj.base_unit_name)
                    if (this.inbound_task.category == 'pallet') {
                        this._set_pallet_infos(material_no)
                    }
                    this._allocate_op_loc_no(material_no)
                    if (this.inv_plans.some(inv_plan => inv_plan.FMaterialId === obj.material_id)) {
                        this._activate_step(3)
                    } else {
                        this._activate_step(1)
                    }
                } else {
                    this.plan_form.material_id = ''
                    this.plan_form.material_no = ''
                    this.plan_form.base_unit_name = 'Pcs'
                    this.plan_form.decimal_unit = false
                    this.plan_form.op_loc_no = ''
                    this._activate_step(0)
                }
                uni.hideLoading()
            },
            _set_pallet_infos(material_no) {
                let pallet_infos = []
                this.inbound_task.pallet_infos.forEach(x => {
                    if (x.material_no == material_no) {
                        let pallet_info = pallet_infos.find(info => info.per_qty == x.base_unit_qty)
                        if (pallet_info) {
                            pallet_info.pallet_qty += 1
                        } else {
                            pallet_infos.push({ per_qty: x.base_unit_qty, pallet_qty: 1 })
                        }
                    }
                })
                if (pallet_infos.length) {
                    this.plan_form.pallet_infos = pallet_infos
                }
            },
            // 设定库位号占用信息 loc_nos: [{ loc_no: String, idle: Boolean }]
            _set_loc_nos() {
                this.stock_loc_opts = JSON.parse(JSON.stringify(store.state.stock_loc_opts)) // 下拉栏选项，deep copy
                this.stock_loc_opts.forEach(depot => {
                    depot.children.forEach(shelf => {
                        shelf.children.forEach(loc => loc.disable = !this._is_idle(loc.value))
                        if (shelf.children.length === 0) shelf.disable = !this._is_idle(shelf.value)
                    })
                })
                let loc_nos = []
                store.state.stock_locs.forEach(x => {
                    loc_nos.push({ loc_no: x.FNumber, idle: this._is_idle(x.FNumber), sp: !is_loc_no_std_format(x.FNumber) })
                })
                // loc_nos.sort((x, y) => x.loc_no < y.loc_no ? -1 : 1)
                loc_nos.sort((x, y) => compare_loc_no(x.loc_no, y.loc_no))
                this.loc_nos = loc_nos
            },
            _is_idle(loc_no) {
                if (store.state.stock_locs.find(x => x.FNumber == loc_no && x.FForbidStatus == 'B')) return false // 禁用库位
                if (!is_loc_no_std_format(loc_no)) return true // 独立库位，默认闲置
                return !this.invs.some(inv => inv['FStockLocId.FNumber'] == loc_no ) &&
                !this.inv_plans.some(inv_plan => inv_plan['FStockLocId.FNumber'] == loc_no) &&
                !this.inv_plans_ex.some(inv_plan => inv_plan['FStockLocId.FNumber'] == loc_no)
            },
            // 设定操作步骤，关联步骤条和按键的显示变更
            _activate_step(step) {
                this.step_active = step
                if (step === 0) {
                    this.goods_nav.button_group[1].text = '预览'
                    this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.grey
                } else if (step === 1) {
                    this.goods_nav.button_group[1].text = '预览'
                    this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.yellow
                } else if (step === 2) {
                    this.goods_nav.button_group[1].text = '保存'
                    this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.blue
                } else if (step === 3) {
                    this.goods_nav.button_group[1].text = '删除'
                    this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.red
                }
            },
            // 分配起点库位，基本规则是，相邻优先，同货架优先，如无库存，则从1号库位开始
            // 1. 查询 material_no 库存，找出排序最前的库位A
            // 2. 从库位A开始，往前直至同货架1号库位，进行遍历
            // 如果中途有其他种类物料占用，比如库位B，则起点库位为B+1
            _allocate_op_loc_no(material_no) {
                // 1. 查询 material_no 库存
                this.$logger.info('>>> 分配起点库位...')
                let front_used_loc_no = '' // 参考库位，[靠前，占用，标准]的库位
                let op_loc_no = ''
                this.invs.filter(inv => {
                    if (inv['FMaterialId.FNumber'] == material_no && is_loc_no_std_format(inv['FStockLocId.FNumber'])) {
                        front_used_loc_no = inv['FStockLocId.FNumber']
                    }
                })
                this.$logger.info('>>> 分配起点库位，参考库位', front_used_loc_no)
                if (front_used_loc_no) {
                    // 1.有参考库位，则获取[同货架，邻接最前，空闲]的库位，邻接最前是指，库位A和B之间只有空闲库位，且A前面没有空闲库位
                    let loc_no_arr = front_used_loc_no.split('-')
                    let prefix = loc_no_arr.slice(0, 2).join('-') // 货架号前缀
                    let shelf = this.loc_nos.filter(x => x.loc_no.startsWith(prefix)) // 当前货架
                    for (let i = 0; i < shelf.length; i++) {
                        if (shelf[i].loc_no == front_used_loc_no) break
                        if (shelf[i].idle) op_loc_no ||= shelf[i].loc_no
                        if (!shelf[i].idle) op_loc_no = ''
                    }
                    // 2.如果没有上述符合条件的，则继续往后获取
                    if (!op_loc_no) {
                        let _index = this.loc_nos.findIndex(x => x.loc_no == front_used_loc_no)
                        for (let i = _index; i < this.loc_nos.length; i++) {
                            if (this.loc_nos[i].idle) {
                                op_loc_no = this.loc_nos[i].loc_no
                                break
                            }
                        }
                        // 3.如果还没有符合条件的，则从头开始获取，标准库位
                        if (!op_loc_no) {
                            for (let i = 0; i < _index; i++) {
                                if (this.loc_nos[i].idle && !this.loc_nos[i].sp) {
                                    op_loc_no = this.loc_nos[i].loc_no
                                    break
                                }
                            }
                        }
                    }
                } else {
                    // 无参考库位，则取[最前，空闲]的库位
                    op_loc_no = this.loc_nos.filter(x => x.idle && !x.sp)[0]?.loc_no || ''
                }
                this.plan_form.op_loc_no = op_loc_no
                this.$logger.info('>>> 分配起点库位，结果', op_loc_no)
            },
            // 获取下一个idle库位
            _next_idle_loc_no(cur_loc_no) {
                let cur_index = this.loc_nos.findIndex(x => x.loc_no == cur_loc_no)
                let next_obj = this.loc_nos[cur_index + 1]
                if (!next_obj) {
                    if (this.plan_form.flex_loc_no) {
                        return this.plan_form.flex_loc_no // 灵活库位
                    } else {
                        throw new Error('库位不足')
                    }
                }
                if (next_obj.idle && !next_obj.sp) {
                    return next_obj.loc_no
                } else {
                    return this._next_idle_loc_no(next_obj.loc_no) // next时忽略独立库位
                }
            },
            // 已计划件数合计（单物料）
            _sum_inv_plan_op_qty() {
                let sum = 0
                this.inv_plans.forEach(inv_plan => {
                    if (inv_plan.FMaterialId === this.plan_form.material_id) {
                        sum += inv_plan.FOpQTY
                    }
                })
                return sum
            },
            // 托盘中的件数合计（单物料）
            _sum_qty_of_pallet_info() {
                let sum = 0
                this.plan_form.pallet_infos.forEach(info => {
                    if (info.per_qty && info.pallet_qty) {
                        sum += Number(info.per_qty) * Number(info.pallet_qty)
                    }
                })
                return sum
            }
        }
    }
</script>

<style lang="scss" scoped>
    .sum_op_qty {
        color: $uni-text-color-grey;
        font-size: $uni-font-size-sm;
    }
    .pallet-infos {
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        table {
            min-width: 0 !important;
        }
    }
    .add-pallet-info-btn {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        // padding-top: 3px;
        // padding-bottom: 3px;
    }
    .plan-form {
        width: 100%;
        display: flex;
        justify-content: center;
    }
    .op-loc-no-data-picker::v-deep {
        .uni-scroll-view-content {
            .item.is-disabled {
                display: none;  /* 隐藏disable的选项 */
            }
        }
    }
</style>
