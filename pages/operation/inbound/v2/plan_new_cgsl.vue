<template>
    <!-- H5 -->
    <template v-if="$store.state.screen_type === 'h5'">
        <uni-row :gutter="10">
            <uni-col :span="6" style="position: relative; border-right: 2px solid #ccc; overflow-y: scroll;">
                <uni-section title="入库物料明细" type="square"
                    sub-title="选择物料" sub-title-color="#007aff"
                    @click="console.log('>> $data', $data)">
                    <uni-list>
                        <template v-for="(obj, index) in inbound_task.inbound_list" :key="index">
                            <uni-list-item
                                :show-extra-icon="true"
                                :extra-icon="{ type: obj.selected ? 'circle-filled' : 'circle', size: '24', color: obj.selected ? '#007bff' : '#999999' }"
                                :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                                @click="select_material(obj)" clickable
                                show-arrow
                                >
                                <template #body>
                                    <view class="uni-list-item__body">
                                        <view class="title">{{ obj.material_no }}</view>
                                        <view class="note">
                                            <view>名称：{{ obj.material_name }}</view> 
                                            <view>规格：{{ obj.material_spec }}</view>
                                        </view>
                                    </view>
                                </template>
                                <template #footer>
                                    <view class="uni-list-item__foot">
                                        <view>{{ obj.base_unit_qty }} {{ obj.base_unit_name }}</view>
                                        <view v-if="inv_plans.some(x => x.FMaterialId === obj.material_id)" class="text-primary">已添加计划</view>
                                    </view>
                                </template>
                            </uni-list-item>
                        </template>
                    </uni-list>
                </uni-section>
            </uni-col>
            
            <uni-col :span="18">
                <uni-section title="新增计划明细" type="square" :sub-title="inbound_task.bill_no" sub-title-color="#007aff">
                    <uni-steps :options="step_options" :active="step_active" class="uni-mt-5 uni-mb-5" />
                </uni-section>

                <uni-section v-if="step_active === 1" title="填写托盘信息" type="square" sub-title="‌‌总和 = ∑ (每托数量 x 托数)">
                    <view class="container">
                        <uni-table ref="pallet_infos" border stripe class="pallet-infos">
                            <uni-tr>
                                <uni-th align="center">每托数量</uni-th>
                                <uni-th align="center">托数</uni-th>
                                <uni-th align="center">小计</uni-th>
                                <uni-th align="center">操作</uni-th>
                            </uni-tr>
                            <uni-tr v-for="(info, index) in form.pallet_infos" :key="index">
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
                                    {{ info.per_qty * info.pallet_qty }}
                                </uni-td>
                                <uni-td align="center">
                                    <uni-tag text="删除行" :type="form.pallet_infos.length > 1 ? 'error' : 'default'" @click="del_pallet_info(index)"/>
                                </uni-td>
                            </uni-tr>
                            <uni-tr>
                                <uni-td align="center"><text class="text-bold">总计</text></uni-td>
                                <uni-td align="center">{{ sum_pallet_qty }}</uni-td>
                                <uni-td align="center">{{ sum_qty_of_pallet_info }}</uni-td>
                                <uni-td align="center">
                                    <uni-tag text="新增行" :type="form.pallet_infos.length < 5 ? 'primary' : 'default'" @click="add_pallet_info"/>
                                </uni-td>
                            </uni-tr>
                        </uni-table>
                        
                        <view class="btn-wrapper">
                            <button type="primary" size="mini" @click="allocate_loc_no">分配库位</button>
                        </view>
                    </view>
                </uni-section>

                <uni-section v-if="step_active === 2" title="当前计划明细" type="square">
                    <view class="container">
                        <uni-table border stripe>
                            <uni-tr>
                                <uni-th align="center" width="60">序号</uni-th>
                                <uni-th align="center">物料编号</uni-th>
                                <uni-th align="center">物料名称</uni-th>
                                <uni-th align="center">规格型号</uni-th>
                                <uni-th align="center" width="80">操作类型</uni-th>
                                <uni-th align="center" width="60">数量</uni-th>
                                <uni-th align="center" width="80">单位</uni-th>
                                <uni-th align="center" width="80">批次</uni-th>
                                <uni-th align="center" width="120">库位</uni-th>
                                <uni-th align="center" width="120">操作员工编号</uni-th>
                                <uni-th align="center" width="80">状态</uni-th>
                                <uni-th align="center" width="160">时间</uni-th>
                            </uni-tr>
                            <uni-tr v-for="(inv_plan, index) in inv_plans.filter(x => x.FMaterialId === form.material_id)" :key="index">
                                <uni-td align="center">{{ index + 1 }}</uni-td>
                                <uni-td>{{ inv_plan['FMaterialId.FNumber'] }}</uni-td>
                                <uni-td>{{ inv_plan['FMaterialId.FName'] }}</uni-td>
                                <uni-td>{{ inv_plan['FMaterialId.FSpecification'] }}</uni-td>
                                <uni-td>{{ op_type_dict[inv_plan.FOpType] }}</uni-td>
                                <uni-td>{{ inv_plan['FOpQTY'] }}</uni-td>
                                <uni-td>{{ inv_plan['FStockUnitId.FName'] }}</uni-td>
                                <uni-td>{{ inv_plan.FBatchNo }}</uni-td>
                                <uni-td>{{ inv_plan['FStockLocId.FNumber'] }}</uni-td>
                                <uni-td>{{ inv_plan.FOpStaffNo }}</uni-td>
                                <uni-td><text class="text-primary">{{ $store.state.document_status_dict[inv_plan.FDocumentStatu] }}</text></uni-td>
                                <uni-td>{{ formatDate(inv_plan.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</uni-td>
                            </uni-tr>
                        </uni-table>
                        <view class="btn-wrapper">
                            <button type="warn" size="mini" @click="if_submit_delete()">删除计划</button>
                        </view>
                    </view>
                </uni-section>
            </uni-col>
        </uni-row>
    </template>
    
    <!-- APP -->
    <template v-else>
        <uni-drawer ref="material_drawer" :width="$store.state.drawer_width">
            <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
                <uni-section title="入库物明细" type="square" sub-title="选择物料">
                    <template #right>
                        <view class="uni-section__right">
                            <uni-icons type="closeempty" size="20" color="#333" @click="$refs.material_drawer.close()"/>
                        </view>
                    </template>
                    
                    <uni-list>
                        <template v-for="(obj, index) in inbound_task.inbound_list" :key="index">
                            <uni-list-item
                                :show-extra-icon="true"
                                :extra-icon="{ type: obj.selected ? 'circle-filled' : 'circle', size: '24', color: obj.selected ? '#007bff' : '#999999' }"
                                :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                                @click="select_material(obj)" clickable
                                show-arrow
                                >
                                <template #body>
                                    <view class="uni-list-item__body">
                                        <view class="title">{{ obj.material_no }}</view>
                                        <view class="note">
                                            <view>名称：{{ obj.material_name }}</view> 
                                            <view>规格：{{ obj.material_spec }}</view>
                                        </view>
                                    </view>
                                </template>
                                <template #footer>
                                    <view class="uni-list-item__foot">
                                        <view>{{ obj.base_unit_qty }} {{ obj.base_unit_name }}</view>
                                        <view v-if="inv_plans.some(x => x.FMaterialId === obj.material_id)" class="text-primary">已添加计划</view>
                                    </view>
                                </template>
                            </uni-list-item>
                        </template>
                    </uni-list>
                </uni-section>
            </scroll-view>
        </uni-drawer>
        
        <uni-section title="新增计划明细" type="square" :sub-title="inbound_task.bill_no" sub-title-color="#007aff">
            <uni-steps :options="step_options" :active="step_active" class="uni-mt-5 uni-mb-5" />
            
            <uni-list v-if="form.material_id">
                <template v-for="(obj, index) in inbound_task.inbound_list" :key="index">
                    <uni-list-item
                        v-if="obj.selected"
                        :show-extra-icon="true"
                        :extra-icon="{ type: obj.selected ? 'circle-filled' : 'circle', size: '24', color: obj.selected ? '#007bff' : '#999999' }"
                        :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                        @click="$refs.material_drawer.open()" clickable
                        show-arrow
                        >
                        <template #body>
                            <view class="uni-list-item__body">
                                <view class="title">{{ obj.material_no }}</view>
                                <view class="note">
                                    <view>名称：{{ obj.material_name }}</view> 
                                    <view>规格：{{ obj.material_spec }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <view>{{ obj.base_unit_qty }} {{ obj.base_unit_name }}</view>
                            </view>
                        </template>
                    </uni-list-item>
                </template>
            </uni-list>
        </uni-section>
    
        <uni-section v-if="step_active === 1" title="填写托盘信息" type="square" sub-title="‌‌总和 = ∑ (每托数量 x 托数)">
            <view class="container">
                <uni-table ref="pallet_infos" border stripe class="pallet-infos">
                    <uni-tr>
                        <uni-th align="center" width="100">每托数量</uni-th>
                        <uni-th align="center" width="80">托数</uni-th>
                        <uni-th align="center" width="80">小计</uni-th>
                        <uni-th align="center" width="60">操作</uni-th>
                    </uni-tr>
                    <uni-tr v-for="(info, index) in form.pallet_infos" :key="index">
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
                            {{ info.per_qty * info.pallet_qty }}
                        </uni-td>
                        <uni-td align="center">
                            <uni-tag text="删除行" :type="form.pallet_infos.length > 1 ? 'error' : 'default'" @click="del_pallet_info(index)"/>
                        </uni-td>
                    </uni-tr>
                    <uni-tr>
                        <uni-td align="center"><text class="text-bold">总计</text></uni-td>
                        <uni-td align="center">{{ sum_pallet_qty }}</uni-td>
                        <uni-td align="center">{{ sum_qty_of_pallet_info }}</uni-td>
                        <uni-td align="center">
                            <uni-tag text="新增行" :type="form.pallet_infos.length < 5 ? 'primary' : 'default'" @click="add_pallet_info"/>
                        </uni-td>
                    </uni-tr>
                </uni-table>
            </view>
        </uni-section>
        
        <uni-section v-if="step_active === 2" title="当前计划明细" type="square">
            <uni-list>
                <uni-list-item
                    v-for="(inv_plan, index) in inv_plans.filter(x => x.FMaterialId === form.material_id)"
                    :key="index"
                    :show-extra-icon="true"
                    :extra-icon="{ type: 'arrow-up', size: '24', color: '#dd524d' }"
                    :title="inv_plan['FStockLocId.FNumber']"
                    :note="`${inv_plan.FPalletQty} 托(${inv_plan.FRemark})`"
                    >
                    
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title">{{ inv_plan['FStockLocId.FNumber'] }}</view>
                            <view class="note">
                                <view>批次：{{ inv_plan.FBatchNo }}</view> 
                                <view>规格：{{ inv_plan['FMaterialId.FSpecification'] }}</view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <text class="op_qty">{{ inv_plan.FOpQTY }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                            <text class="status">{{ $store.state.document_status_dict[inv_plan.FDocumentStatu] }}</text>
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
    </template>
</template>

<script>
    import store from '@/store'
    import { InboundTask, Inv, InvPlan, StockLoc } from '@/utils/model'
    import { formatDate, play_audio_prompt, is_decimal_unit, is_loc_no_std_format, compare_loc_no } from '@/utils'
    export default {
        data() {
            return {
                inbound_task: {}, // 入库任务cache
                invs: [],
                inv_plans: [],
                inv_plans_ex: [], // 其他单据未执行的计划，统计空闲库位时要考虑进去
                inv_plans_preview: [],
                form: {
                    material_id: '',
                    pallet_infos: []
                },
                op_type_dict: InvPlan.FOpTypeEnum,
                step_options: [{ title: '选择物料' }, { title: '填写托盘信息' }, { title: '已分配库位' }],
                step_active: 0,
                // --------------
                plan_form: {
                    material_id: '',
                    material_no: '',
                    base_unit_name: '',
                    decimal_unit: false,
                    // op_loc_no: '', // 起点库位(空闲)
                    // per_pallet_qty: 2, // 每个库位放置托盘数
                    // flex_loc_no: '', // 灵活库位(独立库位)
                    pallet_infos: [],
                },
                goods_nav: {
                    options: [
                        { icon: 'list', text: '物料' }
                    ],
                    button_group: [
                        {
                            text: '分配库位',
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
                this.load_data()
            })
        },
        mounted() {
            StockLoc.query({ FStockId: store.state.cur_stock.FStockId, FForbidStatus: 'B' }).then(res => {
                store.commit('update_stock_locs', res.data) // 只查询禁用库存
            })
        },
        computed: {
            // 总物料数量
            sum_qty_of_pallet_info() {
                let sum = 0
                for (let info of this.form.pallet_infos) {
                    if (info.per_qty && info.pallet_qty) {
                        sum += Number(info.per_qty) * Number(info.pallet_qty)
                    }
                }
                return sum
            },
            // 总托盘数量
            sum_pallet_qty() {
                let sum = 0
                for (let info of this.form.pallet_infos) {
                    if (info.per_qty && info.pallet_qty) {
                        sum += Number(info.pallet_qty)
                    }
                }
                return sum
            }
        },
        methods: {
            formatDate,
            // 1. 选择物料
            select_material(obj) {
                for (let x of this.inbound_task.inbound_list) {
                    x.selected = false
                }
                obj.selected = true
                this.init_form(obj)
                this.$refs['material_drawer'].close()
            },
            // 2. 表单操作
            init_form(obj) {
                // uni.showLoading({ title: '初始化表单' })
                this.form.pallet_infos = [{ per_qty: '', pallet_qty: '' }]
                this.form.material_id = obj.material_id
                if (this.inv_plans.some(inv_plan => inv_plan.FMaterialId === obj.material_id)) {
                    this.activate_step(2)
                } else {
                    this.activate_step(1)
                }
                // uni.hideLoading()
            },
            add_pallet_info() {
                if (this.form.pallet_infos.length >= 5) {
                    uni.showToast({ icon: 'none', title: '最多5行' })
                    return
                }
                this.form.pallet_infos.push({ per_qty: '', pallet_qty: '' })
            },
            del_pallet_info(index) {
                if (this.form.pallet_infos.length <= 1) {
                    uni.showToast({ icon: 'none', title: '最少保留1行' })
                    return
                }
                this.form.pallet_infos.splice(index, 1)
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
            // 3. 分配库位
            allocate_loc_no() {
                let obj = this.inbound_task.inbound_list.find(x => x.material_id == this.form.material_id)
                if (this.sum_qty_of_pallet_info !== obj.base_unit_qty) {
                    uni.showToast({ icon: 'none', title: '物料数量不一致' })
                    return
                }
                uni.navigateTo({
                    url: '/pages/operation/inbound/v2/allocate_loc_no',
                    events: {
                        allocateInfo: (data) => {
                            this.preview(data.allocate_info)
                            this.submit_save()
                        }
                    },
                    success: (res) => {
                        play_audio_prompt('success')
                        let stock_locs = this.get_idle_stock_locs()
                        res.eventChannel.emit('initStockLocs', { stock_locs: stock_locs, pallet_qty: this.sum_pallet_qty }) // 候选的库位列表
                    }
                })
            },
            // 获取实际可用库位信息
            get_idle_stock_locs() {
                let stock_locs = []
                store.state.stock_locs.forEach(x => {
                    stock_locs.push({ ...x, idle: this.is_idle_stock_loc(x.FNumber) })
                })
                return stock_locs
            },
            is_idle_stock_loc(loc_no) {
                if (store.state.stock_locs.find(x => x.FNumber == loc_no && x.FForbidStatus == 'B')) return false // 禁用库位
                // if (!is_loc_no_std_format(loc_no)) return true // 独立库位，默认闲置
                return !this.invs.some(inv => inv['FStockLocId.FNumber'] == loc_no ) &&
                !this.inv_plans.some(inv_plan => inv_plan['FStockLocId.FNumber'] == loc_no) &&
                !this.inv_plans_ex.some(inv_plan => inv_plan['FStockLocId.FNumber'] == loc_no)
            },
            // after allocate
            preview(allocate_info) {
                let inv_plans_preview = []
                let rest_pallet_infos = JSON.parse(JSON.stringify(this.form.pallet_infos))
                for (let alloc_info of allocate_info) {
                    let cur_loc = { loc_no: alloc_info.no, qty: 0, pallet_infos: [] }
                    for (let pallet_info of rest_pallet_infos) {
                        if (pallet_info.per_qty && pallet_info.pallet_qty) {
                            while (pallet_info.pallet_qty > 0 && cur_loc.pallet_infos.length < alloc_info.v) {
                                pallet_info.pallet_qty -= 1
                                cur_loc.qty += pallet_info.per_qty
                                cur_loc.pallet_infos.push(pallet_info.per_qty)
                            }
                        }
                    }
                    inv_plans_preview.push(cur_loc)
                }
                this.inv_plans_preview = inv_plans_preview
            },
            // 4. 删除计划（撤销）
            if_submit_delete() {
                uni.showModal({
                    title: '删除计划',
                    content: '是否确定删除当前物料的全部计划明细？',
                    success: (res) => {
                        if (res.confirm) this.submit_delete()
                    },
                    fail: (err) => {}
                })
            },
            // app op bar
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.material_drawer.open() // btn:选择物料
            },
            goods_nav_button_click(e) { 
                if (this.step_active === 0) {
                    if (e.index === 0) this.allocate_loc_no()
                } else if (this.step_active === 1) {
                    if (e.index === 0) this.allocate_loc_no()  // btn:分配库位
                } else if (this.step_active === 2) {
                    if (e.index === 0) this.if_submit_delete() // btn:删除
                }
            },
            // 设定操作步骤，关联步骤条和按键的显示变更
            activate_step(step) {
                this.step_active = step                
                if (step === 0) {
                    this.goods_nav.button_group[0].text = '分配库位'
                    this.goods_nav.button_group[0].backgroundColor = store.state.goods_nav_color.grey
                } else if (step === 1) {
                    this.goods_nav.button_group[0].text = '分配库位'
                    this.goods_nav.button_group[0].backgroundColor = store.state.goods_nav_color.blue
                } else if (step === 2) {
                    this.goods_nav.button_group[0].text = '删除计划'
                    this.goods_nav.button_group[0].backgroundColor = store.state.goods_nav_color.red
                }
            },
            // * 接口调用 *
            async load_data() {
                await this.load_invs()
                await this.load_inv_plans()
                await this.load_inv_plans_ex()
                if (this.inbound_task.inbound_list.length) {
                    this.select_material(this.inbound_task.inbound_list[0])
                }
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
                    this.$logger.info('>>> 加载当前入库计划，完毕')
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
                })
            },
            async submit_save() {
                uni.showLoading({ title: 'Loading' })
                let obj = this.inbound_task.inbound_list.find(x => x.material_id == this.form.material_id)
                for (let item of this.inv_plans_preview) {
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
                this.activate_step(2) // save
                uni.pageScrollTo({ scrollTop: 0 })
            },
            async submit_delete() {
                if (this.step_active !== 2) return
                let inv_plans = this.inv_plans.filter(inv_plan => inv_plan.FMaterialId === this.form.material_id)
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
                    this.init_form(this.form)
                } else {
                    uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .btn-wrapper {
        margin-top: 10px;
        text-align: right;
    }
    .pallet-infos {
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        table {
            min-width: 0 !important;
        }
    }
</style>
