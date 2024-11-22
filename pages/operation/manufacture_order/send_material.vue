<template>
    <template v-if="step == 'bill'">
        <uni-section title="扫描单据" type="square"
            sub-title="用料清单 / 生产订单"
            >
            <view class="container">
                <uni-easyinput 
                    v-model="no"
                    trim="both" 
                    prefix-icon="scan"
                    @icon-click="icon_click"
                    @confirm="search"
                    :style="{
                        height: '50px'
                    }"
                ></uni-easyinput> 
                
                <uni-card title="待提交单据"
                    v-if="bills.length"
                    :extra="`${bills.length} 个`"
                    :is-shadow="false"
                    margin="0"
                    spacing="0"
                    padding="0">
                    <uni-list :border="false">
                        <uni-list-item v-for="(bill, index) in bills">
                            <template #body>
                                <view class="uni-list-item__body">
                                    <view class="title">
                                        {{ `${bill.bill_no}${ bill.mo_bill_no ? ` / ${bill.mo_bill_no}` : '' }` }}
                                    </view>
                                    <view class="note">
                                        <view>类型：{{ bill.category == 'scfltzd' ? '生产发料通知单' : '用料清单' }}</view>
                                        <view v-if="bill.category == 'ppbom'">物料编码：{{ bill.material_no }}</view>
                                        <view v-if="bill.category == 'ppbom'">物料名称：{{ bill.material_name }}</view>
                                        <view v-if="bill.category == 'ppbom'">规格型号：{{ bill.material_spec }}</view>
                                    </view>
                                </view>
                            </template>
                            <template #footer>
                                <view class="uni-list-item__foot">
                                    <uni-icons type="minus" size="24" color="#dd524d" @click="bills_del(bill)" />
                                </view>
                            </template>
                        </uni-list-item>
                    </uni-list>
                    <template #actions>
                        <view>
                            <button type="primary" class="card-form-btn" @click="bills_combine_and_next">
                                <uni-icons type="checkmarkempty" color="#fff"></uni-icons> 合并提交
                            </button>
                        </view>
                    </template>
                </uni-card>
            </view>
        </uni-section>
        
        <uni-section title="生产订单列表" type="square"
            v-if="prd_mos_visible"
            class="above-uni-goods-nav"
            >
            <uni-list v-if="prd_mos.length">
                <uni-list-item 
                    v-for="(prd_mo, index) in prd_mos" :key="index"
                    @click="load_ppbom_by_mo(prd_mo.FBillNo)" clickable
                    show-arrow
                    >
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title">
                                <uni-icons v-if="_is_mo_selected(prd_mo.FBillNo)" type="checkbox-filled" color="#007aff" />
                                {{ prd_mo.FBillNo }} / {{ prd_mo.FSaleOrderNo }}
                            </view>
                            <view class="note">
                                <view>生产组织：{{ prd_mo['FPrdOrgId.FName'] }}</view>
                                <view>产线2：{{ prd_mo['F.LT.CX.FName'] }}</view>
                                <view>物料编码：{{ prd_mo['FMaterialId.FNumber'] }}</view>
                                <view>物料名称：{{ prd_mo['FMaterialId.FName'] }}</view>
                                <view>规格型号：{{ prd_mo['FMaterialId.FSpecification'] }}</view>
                            </view>
                        </view>
                    </template>
                    <template #footer>
                        <view class="uni-list-item__foot">
                            <text class="text-primary">{{ prd_mo_status_dict[prd_mo.FStatus] }}</text>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            
            <uni-load-more :status="prd_mo_load_more_status" @clickLoadMore="prd_mo_load_more" />
        </uni-section>
    </template>
    
    <uni-section title="扫描物料" type="square" v-if="step == 'material'">
        <view class="container">
            <uni-forms ref="form" :model="form" :rules="form_rules" labelWidth="80px">
                <uni-forms-item label="物料编码" name="material_no">
                    <uni-easyinput 
                        v-model="form.material_no"
                        trim="both"
                        prefix-icon="scan"
                        @icon-click="icon_click"
                        @change="material_no_change"
                        @clear="material_no_change"
                    />
                    <view class="form-info">{{ form.material_name }}</view>
                </uni-forms-item>
                <uni-forms-item label="供应商" name="supplier_no">
                    <uni-easyinput 
                        v-model="form.supplier_no"
                        trim="both"
                        @change="supplier_no_change"
                        @clear="supplier_no_change"
                    />
                    <view class="form-info">{{ form.supplier_name }}</view>
                </uni-forms-item>
                <uni-forms-item label="批次号" name="batch_no">
                    <uni-easyinput v-model="form.batch_no" trim="both" />
                </uni-forms-item>
                <uni-forms-item label="数量" name="op_qty">
                    <uni-easyinput v-model="form.op_qty" type="number" :focus="form.op_qty_focus">
                        <template #right>
                            <text class="easyinput-suffix-text">{{ form.base_unit_name }}</text>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
            </uni-forms>
            <button @click="submit_save" type="primary">
                <uni-icons type="checkmarkempty" color="#fff"></uni-icons> 提交
            </button>
        </view> 
        
    </uni-section>
    
    <uni-section title="追踪物料列表" type="square"
        v-if="step == 'material'"
        class="above-uni-goods-nav"
        >
        <template #right>
            <view class="uni-section__right">
                <view @click="$refs.log_drawer.open()">
                    <uni-icons type="left" /> 日志
                </view>
            </view>
        </template>
        <uni-list>
            <uni-list-item
                v-for="(material, index) in bills_combi.materials.filter(x => x.checked)"
                :key="index"
                >
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            {{ material.material_no }}
                            <uni-icons type="search" color="#007aff" @click="show_material(material.material_id)" />
                        </view>
                        <view class="note">
                            <view>名称：{{ material.material_name }}</view>
                            <view>规格：{{ material.material_spec }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <text v-if="material.done_qty" class="text-primary">{{ material.done_qty }} {{ material.base_unit_name }}</text>
                        <progress
                            :percent="_calc_percentage(material)" 
                            stroke-width="2"
                            :active-color="_calc_percentage(material) == 100 ? '#4cd964' : '#f0ad4e'"
                            :active="true"
                        />
                        <text>{{ material.base_unit_qty }} {{ material.base_unit_name }}</text>
                    </view>
                </template>
            </uni-list-item>
            <uni-list-item
                v-for="(material, index) in unplanned_materials"
                :key="index"
                >
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            <uni-tag text="计划外" type="warning" size="mini" />
                            {{ material.material_no }}
                            <uni-icons type="search" color="#007aff" @click="show_material(material.material_id)" />
                        </view>
                        <view class="note">
                            <view>名称：{{ material.material_name }}</view>
                            <view>规格：{{ material.material_spec }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <text v-if="material.done_qty" class="text-primary">{{ material.done_qty }} {{ material.base_unit_name }}</text>
                        <progress
                            :percent="_calc_percentage(material)" 
                            stroke-width="2"
                            :active-color="_calc_percentage(material) == 100 ? '#4cd964' : '#f0ad4e'"
                            :active="true"
                        />
                        <text>{{ material.base_unit_qty }} {{ material.base_unit_name }}</text>
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
    
    <!-- 子物料明细汇总列表 -->
    <uni-drawer ref="detail_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="子物料明细汇总" type="square"
                sub-title="勾选的物料会显示在追踪列表"
                >
                <template #right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.detail_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list v-if="bills_combi.materials.length">
                    <uni-list-item
                        v-for="(material, index) in bills_combi.materials"
                        :key="index"
                        >
                        <template #header>
                            <view class="uni-list-item__head">
                                <checkbox
                                    :checked="material.checked"
                                    @click="checkbox_click(material.material_id)"
                                />
                            </view>
                        </template>
                        <template #body>
                            <view class="uni-list-item__body">
                                <view class="title">
                                    {{ material.material_no }}
                                    <uni-icons type="search" color="#007aff" @click="show_material(material.material_id)" />
                                </view>
                                <view class="note">
                                    <view>名称：{{ material.material_name }}</view>
                                    <view>规格：{{ material.material_spec }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <text v-if="material.done_qty" class="text-primary">{{ material.done_qty }} {{ material.base_unit_name }}</text>
                                <progress
                                    :percent="_calc_percentage(material)" 
                                    stroke-width="2"
                                    :active-color="_calc_percentage(material) == 100 ? '#4cd964' : '#f0ad4e'"
                                    :active="true"
                                />
                                <text>{{ material.base_unit_qty }} {{ material.base_unit_name }}</text>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
    
    <!-- 扫描日志列表 -->
    <uni-drawer ref="log_drawer" mode="right" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section :title="`${{ send: '发料', receive: '用料' }[op_type]}日志`" type="square"
                sub-title="左滑可取消"
                >
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.log_drawer.close()"/>
                    </view>
                </template>
                
                <uni-swipe-action ref="log_swipe">
                    <uni-swipe-action-item
                        v-for="(log, index) in issuemtr_logs"
                        :key="index"
                        :threshold="60"
                        :right-options="swipe_options"
                        @click="submit_cancel(log)"
                        >
                        <uni-list-item>
                            <template #body>
                                <view class="uni-list-item__body">
                                    <view class="title">
                                        <uni-tag v-if="_unplanned_material(log)" text="计划外" type="warning" size="mini" />
                                        {{ log['FMaterialId.FNumber'] }}
                                    </view>
                                    <view class="note">
                                        <view>名称：{{ log['FMaterialId.FName'] }}</view>
                                        <view>规格：{{ log['FMaterialId.FSpecification'] }}</view>
                                        <view>供应商：<text class="text-primary">{{ log['FSupplierId.FName'] }}</text></view>
                                        <view>批次：<text class="text-primary">{{ log.FBatchNo }}</text></view>
                                        <view>单据：<text class="text-primary">{{ log.FBillNo }}</text></view>
                                        <view>时间：{{ formatDate(log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                                    </view>
                                </view>
                            </template>
                            <template #footer>
                                <view class="uni-list-item__foot">
                                    <text>{{ log.FOpQTY }} {{ log['FStockUnitId.FName'] }}</text>
                                </view>
                            </template>
                        </uni-list-item>
                    </uni-swipe-action-item>
                </uni-swipe-action>
            </uni-section>
        </scroll-view>
    </uni-drawer>
    
    <!-- 单据列表 -->
    <uni-popup ref="bill_popup" type="share" safe-area>
        <uni-section title="单据" type="square"
            v-if="bills.length"
            :style="{ borderRadius: '10px 10px 0 0' }"
            >
            <template v-slot:right>
                <view class="uni-section__right">
                    <uni-icons type="closeempty" size="20" color="#333" @click="$refs.bill_popup.close()"/>
                </view>
            </template>
            <uni-list>
                <uni-list-item v-for="(bill, index) in bills" :key="index">
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title">
                                {{ `${bill.bill_no}${ bill.mo_bill_no ? ` / ${bill.mo_bill_no}` : '' }` }}
                            </view>
                            <view class="note">
                                <view>类型：{{ bill.category == 'scfltzd' ? '生产发料通知单' : '用料清单' }}</view>
                                <template v-if="bill.category == 'ppbom' && bills.length < 4">
                                    <view>物料编码：{{ bill.material_no }}</view>
                                    <view>物料名称：{{ bill.material_name }}</view>
                                    <view>规格型号：{{ bill.material_spec }}</view>
                                </template>
                            </view>
                        </view>
                    </template>
                    <template v-if="step == 'bill'" #footer>
                        <view class="uni-list-item__foot">
                            <uni-icons type="minus" size="24" color="#dd524d" @click="bills_del(bill)" />
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            <button v-if="step == 'bill'" type="primary" class="form-btn" @click="bills_combine_and_next">
                <uni-icons type="checkmarkempty" color="#fff"></uni-icons> 合并提交
            </button>
        </uni-section>
    </uni-popup>
    
    <!-- 查询生产订单 search form -->
    <uni-popup ref="prd_mo_search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="prd_mo_search_dialog_close"
            @confirm="prd_mo_search_dialog_confirm"
            :before-close="true"
            style="width: 360px;"
            >
            <view class="search-form">
                <uni-forms ref="prd_mo_search_form" :model="prd_mo_search_form">
                    <uni-forms-item label="单据编号">
                        <uni-easyinput v-model="prd_mo_search_form.bill_no" />
                    </uni-forms-item>
                    <uni-forms-item label="需求单据">
                        <uni-easyinput v-model="prd_mo_search_form.sale_order_no" />
                    </uni-forms-item>
                    <uni-forms-item label="产线2">
                        <uni-easyinput v-model="prd_mo_search_form.chanxian2" />
                    </uni-forms-item>
                    <uni-forms-item label="业务状态">
                        <uni-data-select
                            v-model="prd_mo_search_form.status"
                            :localdata="[{ value: '4', text: '开工'}]"
                            :clear="false"
                        />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { BdMaterial, IssuemtrLog, PrdMo } from '@/utils/model'
    import { get_bd_material, get_bd_supplier } from '@/utils/api'
    import { math_round, play_audio_prompt, is_decimal_unit } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import scan_code from '@/utils/scan_code'
    export default {
        props: {
            t: {
                type: String,
                default: 'send'  // send: '发料', receive: '用料'
            }
        },
        data() {
            return {
                step: 'bill',  // bill: '扫描单据', material: '扫描物料' 
                op_type: 'send', 
                bd_materials: [], // 缓存计划外的物料
                bd_suppliers: [], // 缓存供应商
                // bill_raw: {},
                // bill: {
                //     bill_no: '',
                //     mo_bill_no: '',
                //     materials: [] // cooked data
                // },
                // bills_raw: [], // 元素格式看 this.bill_raw
                bills: [], // 元素格式看 this.bill
                bills_combi: {
                    materials: [] // 单据合并，物料汇总
                },
                prd_mos_visible: false, // 生产订单section是否可见
                prd_mos: [], // 生产订单
                prd_mo_search_form: {
                    page: 1,
                    per_page: 20,
                    bill_no: '',
                    sale_order_no: '',
                    status: '4'
                },
                prd_mo_status_dict: PrdMo.FStatusEnum,
                prd_mo_load_more_status: 'more', // more,loading,nomore, 生产订单加载状态栏
                issuemtr_logs: [],
                unplanned_materials: [], // 计划外的物料
                no: '',  // 搜索栏
                form: {},
                form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编码不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (!this.form.material_id)return callback('未找到此物料编码')
                                }
                            }
                        ]
                    },
                    supplier_no: {
                        rules: [
                            { required: true, errorMessage: '供应商编码不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (!this.form.supplier_id)return callback('未找到此供应商编码')
                                }
                            }
                        ]
                    },
                    batch_no: {
                        rules: [
                            { required: true, errorMessage: '批次号不能为空' }
                        ]
                    },
                    op_qty: {
                        rules: [
                            { required: true, errorMessage: '数量不能为空' },
                            { format: 'number', errorMessage: '数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('数量必须大于0')
                                    if (!this.form.decimal_unit && !Number.isInteger(value)) {
                                        return callback('数量必须为整数')
                                    }
                                }
                            }
                        ]
                    }
                },
                swipe_options: [
                    {
                        text: '取消',
                        style: { backgroundColor: '#dd524d' }
                    }
                ],
                goods_nav: {
                    options: [
                        { icon: 'right', text: '物料' },
                        { icon: 'up', text: '单据', info: 0 },
                        { icon: 'left', text: '日志' }
                    ],
                    button_group: [
                        { text: '查询生产订单', color: '#fff', backgroundColor: store.state.goods_nav_color.green },
                        { text: '扫码', color: '#fff', backgroundColor: store.state.goods_nav_color.red }
                    ]
                }
            }
        },
        onPullDownRefresh() {
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.prd_mo_load_more()
        },
        onLoad(options) {
            if (options.t) {
                this.op_type = options.t
                setTimeout(_ => {
                    uni.setNavigationBarTitle({
                        title: `生产订单 - ${ this.op_type == 'receive' ? '用料' : '发料' }`
                    })
                    uni.setNavigationBarColor({
                        frontColor: '#ffffff',
                        backgroundColor: this.op_type == 'receive'? '#FE6035' : '#1E83FF',
                        animation: {
                            duration: 400,
                            timingFunc: 'easeIn'
                        }
                    })
                }, 0)
            }
        },
        mounted() {
            this._init_form()
        },
        methods: {
            formatDate,
            after_scan_code(text) {
                text = text.trim()
                if (!text) return
                if (this.step == 'bill') {
                    for (let item of text.split('||')) {
                        if (item.match(/^SCFLTZD\d+$/)) {
                            if (this.op_type == 'send') {
                                this.load_scfltzd(item) // 生产发料通知单
                            } else {
                                uni.showToast({ icon: 'none', title: '未知单据类型' })
                            }
                            return
                        } else if (item.match(/^PPBOM\d+$/)) {
                            this.load_ppbom(item) // 用料清单
                            return
                        } else if (item.match(/^102\d{10}$/)) {
                            // this.load_prd_mo(item) // 生产订单
                            this.load_ppbom_by_mo(item)
                            return
                        } 
                    }
                    uni.showToast({ icon: 'none', title: '未知格式单据编号' })
                } 
                if (this.step == 'material') {
                    let arr = text.split('||') // 扫描物料卡(format: material_no||supplier_no||batch_no)
                    this.form.material_no = arr[0]
                    this.form.supplier_no = arr[1]
                    this.form.batch_no = arr[2]
                    this.material_no_change()
                    this.supplier_no_change()
                    this.form.op_qty_focus = true
                }
            },
            bills_add(bill) {
                if (this.bills.some(x => x.bill_no == bill.bill_no)) return
                if (this.bills.length >= 5) {
                    uni.showToast({ icon: 'none', title: '最多合并5个单据' })
                    return
                }
                this.bills.push(bill)
                this._after_update_bills()
            },
            bills_del(bill) {
                let index = this.bills.findIndex(x => x.bill_no == bill.bill_no)
                if (index > -1) {
                    this.bills.splice(index, 1)
                    this._after_update_bills()
                    if (this.bills.length === 0) this.$refs.bill_popup.close()
                }
            },
            // 合并多个用料清单的物料信息
            bills_combine_and_next(){
                let c_materials = []
                for (let bill of this.bills) {
                    for (let material of bill.materials) {
                        let c_material = c_materials.find(x => x.material_id == material.material_id)
                        if (c_material) {
                            c_material.base_unit_qty += material.base_unit_qty
                            c_material.unit_qty += material.unit_qty
                        } else {
                            c_materials.push({ ...material })
                        }
                    }
                }
                this.bills_combi.materials = c_materials
                this._activate_step('material')
                this.$refs.bill_popup.close()
                this.load_issuemtr_logs()
            },
            checkbox_click(e) {
                let material = this.bills_combi.materials.find(x => x.material_id == e)
                if (material) material.checked = !material.checked 
            },
            goods_nav_click(e) {
                if (e.index === 0 && this.step == 'material') this.$refs.detail_drawer.open() // btn:明细
                if (e.index === 1) {
                    if (this.bills.length) {
                        this.$refs.bill_popup.open()
                    } else {
                        uni.showToast({ icon: 'none', title: '请先添加单据' })
                    }
                } 
                if (e.index === 2 && this.step == 'material') this.$refs.log_drawer.open() // btn: 日志
                this.$logger.info(this.$data)
            },
            goods_nav_button_click(e) { 
                if (e.index === 0) {
                    if (this.step == 'bill') this.$refs.prd_mo_search_dialog.open() 
                    if (this.step == 'material') this.if_go_back() // btn:返回
                }
                if (e.index === 1) this.scan_code() // btn:扫码
            },
            icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            if_go_back() {
                uni.showModal({
                    title: "返回",
                    content: "确认返回上一步吗？",
                    success: (res) => {
                        if (res.confirm) {
                            play_audio_prompt('delete')
                            if (this.step == 'bill') {
                                uni.navigateBack()
                            }  else if (this.step == 'material') {
                                this._activate_step('bill')
                                this.no = '' // 清空手动输入的数据
                            } 
                        }
                    }
                })
            },
            material_no_change() {
                // 0. 设置默认值
                this.form.material_id = ''
                this.form.material_name = ''
                this.form.base_unit_name = 'Pcs'
                this.form.decimal_unit = false
                if (!this.form.material_no) return
                // 1. 查询单据内物料
                let material = this.bills_combi.materials.find(x => x.material_no == this.form.material_no)
                if (material) {
                    this.form.material_id = material.material_id
                    this.form.material_name = material.material_name
                    this.form.base_unit_name = material.base_unit_name
                    this.form.decimal_unit = is_decimal_unit(material.base_unit_name)
                    return
                }
                // 2. 查询缓存的物料数据
                let bd_material = this.bd_materials.find(x => x.FNumber == this.form.material_no)
                if (bd_material) {
                    this.form.material_id = bd_material.FMaterialId
                    this.form.material_name = bd_material.FName
                    this.form.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.form.decimal_unit = is_decimal_unit(bd_material['FBaseUnitId.FName'])
                    return
                }
                // 3. 查询基础数据
                get_bd_material(this.form.material_no, store.state.cur_stock.FUseOrgId).then(res => {
                    if (res.data.length) {
                        this.bd_materials.push(res.data[0])
                        this.form.material_id = res.data[0].FMaterialId
                        this.form.material_name = res.data[0].FName
                        this.form.base_unit_name = res.data[0]['FBaseUnitId.FName']
                        this.form.decimal_unit = is_decimal_unit(res.data[0]['FBaseUnitId.FName'])
                    }
                })
            },
            prd_mo_load_more() {
                if (this.prd_mo_load_more_status == 'nomore') return
                this.prd_mo_search_form.page += 1
                this.load_prd_mos()
            },
            prd_mo_search_dialog_close() {
                this.$refs.prd_mo_search_dialog.close()
            },
            prd_mo_search_dialog_confirm() {
                this.prd_mos = []
                this.prd_mo_load_more_status = 'more'
                this.prd_mo_search_form.page = 1
                this.load_prd_mos()
                this.prd_mo_search_dialog_close()
                uni.pageScrollTo({ scrollTop: 0 })
            },
            supplier_no_change() {
                // 0. 设置默认值
                this.form.supplier_id = ''
                this.form.supplier_name = ''
                if (!this.form.supplier_no) return
                // 1. 查询缓存的供应商数据
                let bd_supplier = this.bd_suppliers.find(x => x.FNumber == this.form.supplier_no)
                if (bd_supplier) {
                    this.form.supplier_id = bd_supplier.FSupplierId
                    this.form.supplier_name = bd_supplier.FName
                    return
                }
                // 2. 查询基础数据
                get_bd_supplier(this.form.supplier_no, store.state.cur_stock.FUseOrgId).then(res => {
                    if (res.data.length) {
                        this.bd_suppliers.push(res.data[0])
                        this.form.supplier_id = res.data[0]['FSupplierId']
                        this.form.supplier_name = res.data[0]['FName']
                    }
                })
            },
            scan_code() {
                scan_code().then(res => {
                    this.after_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            search() {
                this.after_scan_code(this.no)
            },
            show_material(material_id) {
                if (!material_id) uni.showToast({ icon: 'none', title: '物料ID不能为空' })
                uni.navigateTo({ 
                    url: `/pages/operation/material/show?id=${material_id}`
                })
            },
            // 发料用料日志
            async load_issuemtr_logs() {
                let options = {
                    FBillNo_in: this.bills.map(x => x.bill_no),
                    FOpType: this.op_type
                }
                let meta = { order: 'FID DESC' }
                uni.showLoading({ title: 'Loading' })
                let res = await IssuemtrLog.query(options, meta)
                uni.hideLoading()
                this.issuemtr_logs = res.data
                this._calc_done_qty()
            },
            // 用料清单
            async load_ppbom(bill_no) {
                try {
                    this.no = ''
                    if (this.bills.some(x => x.bill_no == bill_no)) {
                        uni.showToast({ icon: 'none', title: '重复添加单据' })
                        return
                    }
                    uni.showLoading({ title: 'Loading' })
                    let res = await K3CloudApi.view('PRD_PPBOM', { Number: bill_no })
                    uni.hideLoading()
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        let raw_data = res.data.Result.Result
                        let materials = []
                        for (let entity of raw_data.PPBomEntry) {
                            let material = materials.find(x => x.material_id == entity.MaterialID.Id)
                            if (material) {
                                material.base_unit_qty += entity.BaseStdQty // 相同物料则合并数量
                                material.unit_qty += entity.StdQty
                                continue
                            }
                            materials.push({
                                material_id: entity.MaterialID.Id,
                                material_no: entity.MaterialID.Number,
                                material_name: entity.MaterialID.Name[0]?.Value,
                                material_spec: entity.MaterialID.Specification[0]?.Value,
                                base_unit_qty: entity.BaseStdQty,
                                base_unit_name: entity.BaseUnitID.Name[0]?.Value,
                                unit_qty: entity.StdQty,
                                unit_name: entity.UnitID.Name[0].Value,
                                checked: false,
                                op_qty: 0
                            })
                        }
                        // this.bills_raw.push(raw_data)
                        this.bills_add({
                            category: 'ppbom',
                            bill_no: raw_data.BillNo,
                            mo_bill_no: raw_data.MOBillNO,
                            material_no: raw_data.MaterialID.Number,
                            material_name: raw_data.MaterialID.Name[0].Value,
                            material_spec: raw_data.MaterialID.Specification[0].Value,
                            materials: materials
                        })
                        // this._activate_step('material')
                        // this.bill_raw = raw_data
                        // this.bill = { 
                        //     bill_no: raw_data.BillNo, 
                        //     mo_bill_no: raw_data.MOBillNO,
                        //     materials: materials,
                        // }
                        // this.load_issuemtr_logs()
                    } else {
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                } catch (err) { }
            },
            // 用料清单（根据生产订单号查询）
            async load_ppbom_by_mo(mo_bill_no) {
                this.no = ''
                if (this.bills.some(x => x.mo_bill_no == mo_bill_no)) {
                    uni.showToast({ icon: 'none', title: '重复添加单据' })
                    return
                }
                let data = {
                    FormId: 'PRD_PPBOM',
                    FieldKeys: 'FBillNo,FMOBillNO',
                    FilterString: [
                        { Left: "", FieldName: "FMOBillNO", Compare: "67", Value: mo_bill_no, Right: "", Logic: 0 }
                    ]
                }
                let res = await K3CloudApi.bill_query(data)
                if (res.data.length) {
                    this.load_ppbom(res.data[0].FBillNo)
                } else {
                    uni.showToast({ icon: 'none', title: '未知单据编号' })
                }
            },
            // 加载开工的生产订单
            async load_prd_mos() {
                let options = { FStatus: '4' }
                if (this.prd_mo_search_form.bill_no) options.FBillNo_cont = this.prd_mo_search_form.bill_no
                if (this.prd_mo_search_form.sale_order_no) options.FSaleOrderNo_lk = this.prd_mo_search_form.sale_order_no
                if (this.prd_mo_search_form.chanxian2) options['F_LT_CX.FName_lk'] = this.prd_mo_search_form.chanxian2
                let meta = { order: 'FID DESC', page: this.prd_mo_search_form.page, per_page: this.prd_mo_search_form.per_page }
                uni.showLoading({ title: 'Loading' })
                this.prd_mo_load_more_status = 'loading'
                let res = await PrdMo.query(options, meta)
                uni.hideLoading()
                this.prd_mo_load_more_status = res.data.length < this.prd_mo_search_form.per_page ? 'nomore' : 'more'
                res.data.forEach(item => this.prd_mos.push(item) )
                this.prd_mos_visible = true
            },
            // 生产发料通知单
            async load_scfltzd(bill_no) {
                try {
                    this.no = ''
                    if (this.bills.some(x => x.bill_no == bill_no)) {
                        uni.showToast({ icon: 'none', title: '重复添加单据' })
                        return
                    }
                    uni.showLoading({ title: 'Loading' })
                    let res = await K3CloudApi.view('PRD_ISSUEMTRNOTICE', { Number: bill_no })
                    uni.hideLoading()
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        let raw_data = res.data.Result.Result
                        if (raw_data.PrdOrgId_Id != store.state.cur_stock.FUseOrgId) {
                            uni.showToast({ icon: 'none', title: '生产组织不一致' })
                            return
                        }
                        let materials = []
                        for (let entity of raw_data.SUMEntity) {
                            materials.push({
                                material_id: entity.ChildMtr.Id,
                                material_no: entity.ChildMtr.Number,
                                material_name: entity.ChildMtr.Name[0]?.Value,
                                material_spec: entity.ChildMtr.Specification[0]?.Value,
                                base_unit_qty: entity.BasePlanIssueQty,
                                base_unit_name: entity.BaseSumUnitId.Name[0]?.Value,
                                unit_qty: entity.PlanIssueQty,
                                unit_name: entity.SumUnitId.Name[0].Value
                            })
                        }
                        // this.bills_raw.push(raw_data)
                        this.bills_add({
                            category: 'scfltzd',
                            bill_no: raw_data.BillNo,
                            mo_bill_no: raw_data.MOBillNO,
                            materials: materials
                        })
                        // this._activate_step('material')
                        // this.bill_raw = raw_data
                        // this.bill = { 
                        //     bill_no: raw_data.BillNo, 
                        //     materials: materials,
                        // }
                        // this.load_issuemtr_logs()
                    } else {
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                } catch (err) { }
            },
            async submit_cancel(log) {
                try {
                    // 限制取消数据，24小时内可取消
                    if (new Date(log.FCreateTime) < Date.now() - 24 * 3600 * 1000) {
                        uni.showToast({ icon: 'none', title: '历史数据不能取消' })
                        return
                    }
                    uni.showLoading({ title: 'Loading' })
                    let issuemtr_log = new IssuemtrLog(log)
                    return issuemtr_log.cancel(store.state.cur_staff.FNumber).then(res => {
                        uni.hideLoading()
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            play_audio_prompt('delete')
                            this.$refs.log_swipe.closeAll()
                            this.load_issuemtr_logs()
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    })
                } catch (err) { }
            },
            // async submit_delete(log) {
            //     try {
            //         // 限制删除数据，24小时内可删
            //         if (new Date(log.FCreateTime) < Date.now() - 24 * 3600 * 1000) {
            //             uni.showToast({ icon: 'none', title: '历史数据不能删除' })
            //             return
            //         }
            //         uni.showLoading({ title: 'Loading' })
            //         return IssuemtrLog.delete([log.FID]).then(res => {
            //             uni.hideLoading()
            //             if (res.data.Result.ResponseStatus.IsSuccess) {
            //                 play_audio_prompt('delete')
            //                 this.$refs.log_swipe.closeAll()
            //                 this.load_issuemtr_logs()
            //             } else {
            //                 uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
            //             }
            //         })
            //     } catch (err) { }
            // },
            async submit_save() {
                try {
                    await this.$refs.form.validate() // 表单验证
                    let c_material = this.bills_combi.materials.find(x => x.material_id == this.form.material_id)
                    if (c_material) {
                        let rest_op_qty = this.form.op_qty // 操作数量剩余未分配数量
                        let scheme = [] // 分配方案 { bill_no, op_qty }
                        // 1. 制定分配方案
                        for (let bill of this.bills) {
                            if (rest_op_qty <= 0) break
                            let material = bill.materials.find( x => x.material_id == this.form.material_id)
                            if (!material) continue
                            if (material.done_qty >= material.base_unit_qty) continue
                            let _op_qty = Math.min(rest_op_qty, material.base_unit_qty - material.done_qty) // 分配中数量
                            scheme.push( { bill_no: bill.bill_no, op_qty: _op_qty } )
                            rest_op_qty -= _op_qty
                        }
                        if (rest_op_qty > 0) {
                            let scheme_item = scheme.find(x => x.bill_no == this.bills[0].bill_no)
                            if (scheme_item) {
                                scheme_item.op_qty += rest_op_qty
                            } else {
                                scheme.push({ bill_no: this.bills[0].bill_no, op_qty: rest_op_qty })
                            }
                        }
                        // this.$logger.info('scheme', scheme)
                        // 2. 执行分配方案
                        for (let scheme_item of scheme) {
                            let issuemtr_log = new IssuemtrLog({
                                FOpType: this.op_type,
                                FStockId: store.state.cur_stock.FStockId,
                                FMaterialId: this.form.material_id,
                                FSupplierId: this.form.supplier_id,
                                FOpQTY: scheme_item.op_qty,
                                FBatchNo: this.form.batch_no,
                                FBillNo: scheme_item.bill_no,
                                FOpStaffNo: store.state.cur_staff.FNumber 
                            })
                            await issuemtr_log.save()
                        }
                    } else {
                        // 计划外物料
                        let issuemtr_log = new IssuemtrLog({
                            FOpType: this.op_type,
                            FStockId: store.state.cur_stock.FStockId,
                            FMaterialId: this.form.material_id,
                            FSupplierId: this.form.supplier_id,
                            FOpQTY: this.form.op_qty,
                            FBatchNo: this.form.batch_no,
                            FBillNo: this.bills[0].bill_no,
                            FOpStaffNo: store.state.cur_staff.FNumber 
                        })
                        await issuemtr_log.save()
                    }
                    await this.load_issuemtr_logs()
                    this._init_form() // 重置表单
                    play_audio_prompt('success')
                    // let issuemtr_log = new IssuemtrLog({
                    //     FOpType: this.op_type,
                    //     FStockId: store.state.cur_stock.FStockId,
                    //     FMaterialId: this.form.material_id,
                    //     FSupplierId: this.form.supplier_id,
                    //     FOpQTY: this.form.op_qty,
                    //     FBatchNo: this.form.batch_no,
                    //     FBillNo: this.bill.bill_no,
                    //     FOpStaffNo: store.state.cur_staff.FNumber 
                    // })
                    // await issuemtr_log.save()
                    // await this.load_issuemtr_logs()
                    // this._init_form() // 重置表单
                    // play_audio_prompt('success')
                } catch (err) { }
            },
            _activate_step(step) {
                this.step = step
                if (step == 'bill') {
                    this.goods_nav.button_group[0].text = '查询生产订单'
                    this.goods_nav.button_group[0].backgroundColor = store.state.goods_nav_color.green
                }
                if (step == 'material') {
                    this.goods_nav.button_group[0].text = '返回'
                    this.goods_nav.button_group[0].backgroundColor = store.state.goods_nav_color.grey
                }
            },
            _after_update_bills() {
                this.goods_nav.options[1].info = this.bills.length
            },
            _calc_done_qty() {
                for (let material of this.bills_combi.materials) {
                    material.done_qty = 0 // 汇总物料
                }
                for (let bill of this.bills) {
                    for (let material of bill.materials) {
                        material.done_qty = 0 // 单据中物料
                    }
                }
                this.unplanned_materials = []
                for (let log of this.issuemtr_logs) {
                    let c_material = this.bills_combi.materials.find(x => x.material_id == log.FMaterialId)
                    if (c_material) {
                        c_material.done_qty += log.FOpQTY
                        let bill = this.bills.find(x => x.bill_no == log.FBillNo)
                        if (bill) {
                            let material = bill.materials.find(x => x.material_id == log.FMaterialId)
                            if (material) material.done_qty += log.FOpQTY
                        }
                        continue
                    }
                    let unplanned_material = this.unplanned_materials.find(x => x.material_id == log.FMaterialId)
                    if (unplanned_material) {
                        unplanned_material.done_qty += log.FOpQTY
                    } else {
                        this.unplanned_materials.push({
                            material_id: log.FMaterialId,
                            material_no: log['FMaterialId.FNumber'],
                            material_name: log['FMaterialId.FName'],
                            material_spec: log['FMaterialId.FSpecification'],
                            base_unit_qty: 0,
                            base_unit_name: log['FStockUnitId.FName'],
                            unit_qty: 0,
                            unit_name: log['FStockUnitId.FName'],
                            done_qty: log.FOpQTY
                        })
                    }
                }
            },
            _calc_percentage(material) {
                return (material.done_qty / material.base_unit_qty) * 100
            },
            _init_form() {
                this.form = {
                    material_id: '',
                    material_no: '',
                    material_name: '',
                    supplier_no: '',
                    supplier_id: '',
                    supplier_name: '',
                    batch_no: '',
                    op_qty: '',
                    op_qty_focus: false,
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                }
            },
            _is_mo_selected(mo_bill_no) {
                return this.bills.some(x => x.mo_bill_no == mo_bill_no)
            },
            _unplanned_material(log) {
                return !this.bills_combi.materials.some(x => x.material_id == log.FMaterialId)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .card-form-btn {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        line-height: 41px;
    }
    .form-btn {
        border-radius: 0;
    }
    .form-info {
        height: 0;
        color: $uni-text-color-grey;
        font-size: $uni-font-size-sm;
    }
    .search-form {
        flex: 1;
    }
</style>

