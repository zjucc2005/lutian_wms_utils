<template>
    <scroll-view :scroll-into-view="'tab'+currentIndex" scroll-x scroll-with-animation class="tab-scroll" >
        <view 
            v-for="(name, index) in tabs" 
            :id="'tab'+ index"
            :key="index" 
            class="tab-item"
            :class="{ active: currentIndex === index }"
            @click="currentIndex=index;uni.pageScrollTo({ scrollTop: 0 })"
            >
            {{ name }}
        </view>
    </scroll-view>
    
    <view v-if="currentIndex === 0" class="tab-content">
        <uni-section :title="`生产领用，共 ${ table_body_rec.length } 行数据`" type="square"  @click="$logger.info('>>>', $data)">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_rec" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_rec.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_rec[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd hh:mm:ss') : cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 1" class="tab-content">
        <uni-section :title="`采购申请单，共 ${ table_body_req.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_req" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_req.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_req[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd hh:mm:ss') : cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
        <uni-section :title="`委外订单，共 ${ table_body_sub.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_sub" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_sub.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_sub[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd hh:mm:ss') : cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 2" class="tab-content">
        <uni-section :title="`采购订单，共 ${ table_body_po.length } 行数据`" type="square" sub-title="注：收料可退数量=累计收料数量-累计入库数量，如果结果＜0，重置为0">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_po" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_po.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_po[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd hh:mm:ss') : cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 3" class="tab-content">
        <uni-section :title="`即时库存，共 ${ table_body_inv.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_inv" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_inv.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_inv[i-1]" :key="j" align="center">{{ cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav
            :options="goods_nav.options"
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
        />
    </view>
    
    <!-- search form -->
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="$refs.search_dialog.close()"
            @confirm="search_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view class="search-form">
                <uni-forms ref="search_form" :model="search_form" :rules="search_form_rules">
                    <uni-section title="即时库存" type="square">
                        <uni-forms-item label="仓库" name="stock_ids">
                            <uni-data-select
                                v-model="search_form.stock_ids"
                                :localdata="stock_options"
                                :clear="false"
                                multiple wrap
                            >
                                <template #selected="{selectedItems}">
                                    <view>
                                        <view>{{ selectedItems.map(x => x.text.split('/')[2]).join(', ') }} </view>
                                        <view v-if="selectedItems.length > 0" class="text-primary">共选中 {{ selectedItems.length }} 项</view>
                                        <view v-else>未选择</view>
                                    </view>
                                </template>
                            </uni-data-select>
                        </uni-forms-item>
                    </uni-section>
                    
                    <uni-section title="采购申请单 & 采购订单" type="square">
                        <uni-row :gutter="15">
                            <uni-col :md="6" :sm="12" :xs="24">
                                <uni-forms-item label="创建时间" name="created_at_ge">
                                    <uni-datetime-picker type="date" v-model="search_form.created_at_ge" />
                                </uni-forms-item>
                            </uni-col>
                            <uni-col :md="6" :sm="12" :xs="24">
                                <uni-forms-item label="~" name="created_at_le">
                                    <uni-datetime-picker type="date" v-model="search_form.created_at_le" />
                                </uni-forms-item>
                            </uni-col>
                            <uni-col :md="12" :sm="12" :xs="24">
                                <uni-forms-item label="创建人" name="creator">
                                    <uni-easyinput v-model="search_form.creator" placeholder="多个创建人用英文逗号(,)隔开" />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                    </uni-section>
                    
                    <uni-section title="生产订单领用" type="square">
                        <uni-row :gutter="15">
                            <uni-col :md="6" :xs="24">
                                <uni-forms-item label="计划序号">
                                    <uni-easyinput v-model="search_form.jhxh" type="textarea" :maxlength="-1" />
                                </uni-forms-item>
                            </uni-col>
                            <uni-col :md="18" :xs="24">
                                <uni-row :gutter="15">
                                    <uni-col :md="8" :sm="12" :xs="24">
                                        <uni-forms-item label="需求单据">
                                            <uni-easyinput v-model="search_form.sale_order_no" />
                                        </uni-forms-item>
                                    </uni-col>
                                    <uni-col :md="8" :sm="12" :xs="24">
                                        <uni-forms-item label="生产订单编号">
                                            <uni-easyinput v-model="search_form.bill_no" />
                                        </uni-forms-item>
                                    </uni-col>
                                    <uni-col :md="8" :sm="12" :xs="24">
                                        <uni-forms-item label="生产车间">
                                            <uni-easyinput v-model="search_form.workshop" />
                                        </uni-forms-item>
                                    </uni-col>
                                    <uni-col :md="8" :sm="12" :xs="24">
                                        <uni-forms-item label="物料编码">
                                            <uni-easyinput v-model="search_form.material_no" />
                                        </uni-forms-item>
                                    </uni-col>
                                    <uni-col :md="8" :sm="12" :xs="24">
                                        <uni-forms-item label="物料名称">
                                            <uni-easyinput v-model="search_form.material_name" />
                                        </uni-forms-item>
                                    </uni-col>
                                    <uni-col :md="8" :sm="12" :xs="24">
                                        <uni-forms-item label="规格型号">
                                            <uni-easyinput v-model="search_form.material_spec" />
                                        </uni-forms-item>
                                    </uni-col>
                                </uni-row>
                            </uni-col>
                        </uni-row>
                    </uni-section>
                    <view class="text-grey text-sm">固定条件: 业务状态=开工 or 业务状态=完工 or (业务状态=结案 and 结案类型=自动结案)</view>
                </uni-forms>
                <text class="text-link text-sm" @click="set_search_cond">保存</text>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { PrdMo, PrdPpbom, PrdIssueMtrNotice, PurRequisition, SubSubReqOrder, PurPurchaseOrder, StkInventory, BdOperator } from '@/utils/model'
    import { formatDate } from '@/utils'
    
    export default {
        data() {
            return {
                // 生产订单领用
                table_head_rec: ['计划序号', '需求单据', '生产订单编号', '物料编码', '物料名称', '规格型号', '单位',
                                 '数量', '合格品入库数量', '未入库数量', '生产车间', '领料状态', '开工日期', '发料时间',
                                 '子项物料编码', '子项物料名称', '子项规格型号', '子项单位', '应发数量', '已领数量', '可用库存', '发料方式', '仓库'],
                table_body_rec: [],
                // 采购申请单
                fields_req: ['FCreatorId.FName', 'FBillNo', 'FDocumentStatus', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FReqQty', 'FRemainQty', 'FDemandBillNo', 'FApplicationDate', 'FArrivalDate'],
                table_head_req: ['创建人', '单据编号', '数据状态', '物料编码', '物料名称', '规格型号', '申请数量', '剩余数量', '需求单据编号', '申请日期', '到货日期'],
                table_body_req: [],
                // 委外订单
                fields_sub: ['FCreatorId.FName', 'FBillNo', 'FDocumentStatus', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FQty', 'FNoStockInQty', 'FSaleOrderNo', 'FDate', 'FPlanFinishDate'],
                table_head_sub: ['创建人', '单据编号', '单据状态', '物料编码', '物料名称', '规格型号', '数量', '未入库数量', '需求单据编号', '单据日期', '计划完工日期'],
                table_body_sub: [],
                // 采购订单
                fields_po: ['F_PAEZ_Text_83g', 'FSrcBillNo', 'FBillNo', 'FDocumentStatus', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FUnitId.FName', 'FQty', 'FRemainReceiveQty', 'FCheckRetQty', 'FEntryNote', 'FDemandBillNo', 'FDate', 'FDeliveryDate', 'FPurchaserId.FName', 'FSupplierId.FName', 'FReceiveQty', 'FStockInQty' ],
                table_head_po: ['计划序号', '源单编号', '单据编号', '单据状态', '物料编码', '物料名称', '规格型号', '采购单位', '采购数量', '剩余收料数量', '收料可退数量', '备注', '需求单据编号', '采购日期', '交货日期', '采购员', '供应商'],
                table_body_po: [],
                // 即时库存
                fields_inv: ['FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FBaseUnitId.FName', 'FBaseQty', 'FStockName'],
                table_head_inv: ['物料编码', '物料名称', '规格型号', '库存主单位', '库存量(主单位)', '仓库名称'],
                table_body_inv: [],
                search_form: {
                    // 2.生产订单领用
                    jhxh: '',
                    sale_order_no: '',
                    bill_no: '',
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    workshop: '',
                    status: '',
                    // 3. 通用
                    created_at_ge: '',
                    created_at_le: '',
                    creator: '',
                    // 4. 即时库存
                    stock_ids: [],
                    
                    // -- default --
                    // 3. 采购申请单
                    req: {
                        FMRPCloseStatus: 'A', // A - 正常, B - 业务关闭
                        FCloseStatus: 'A', // A - 未关闭, B - 已关闭
                        FMRPTerminateStatus: 'A', // A - 正常, B - 业务终止
                        FCancelStatus: 'A', // A - 否, B - 是 
                    },
                    // 3. 委外订单
                    sub: {
                        FStatus_in: ['1', '2'], // 1 - 计划, 2 - 计划确认
                    },
                    // 3. 采购订单
                    po: {
                        FDocumentStatus: 'C', // C - 已审核
                        FCancelStatus: 'A', // A - 未作废, B - 已作废
                        FManualClose: 0, // 手工关闭：否
                        // AND (FRemainReceiveQty > 0 OR FReceiveQty > FStockInQty)
                        // FMRPCloseStatus: 'A', // A - 正常, B - 业务关闭
                        // FCloseStatus: 'A', // A - 未关闭, B - 已关闭
                        FMRPTerminateStatus: 'A', // A - 正常, B - 业务终止
                        'FPurchaseOrgId.FNumber_in': ['100', '102']
                    }
                },
                search_form_cache_fields: ['created_at_ge', 'created_at_le', 'creator', 'stock_ids'],
                search_form_rules: {
                    created_at_ge: {
                        rules: [
                            { required: true, errorMessage: '创建时间不能为空' },
                        ]
                    }
                },
                stock_options: [],
                mos: [], // 生产订单缓存
                pick_mtrl_status_dict: { '1': '未领料', '2': '部分领料', '3': '全部领料', '4': '超额领料' },
                issue_type_dict: { '1': '直接领料', '2': '直接倒冲', '3': '调拨领料', '4': '调拨倒冲', '7': '不发料' }, 
                // 页面组件
                currentIndex: 0,
                tabs: [ '生产订单领用', '采购申请单（未推）', '采购订单', '即时库存' ],
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索'},
                        // #ifdef H5
                        { icon: 'download', text: '导出表格' }
                        // #endif
                    ],
                    button_group: [
                    ]
                }
            }
        },
        mounted() {
            this.set_stock_options()
            this.get_search_cond()
        },
        methods: {
            formatDate,
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) this.export_as_excel()
            },
            set_stock_options() {
                let options = []
                for (let s of store.state.bd_stocks) {
                    if (s.FDocumentStatus != 'C' || s.FForbidStatus != 'A') continue
                    if (s['FUseOrgId.FName'] != '内燃机事业部') continue
                    options.push({ text: [s['FUseOrgId.FName'], s['FGroup.FName'] || '未分组', s.FName].join(' / '), value: s.FStockId })
                }
                options.sort((x, y) => x.text > y.text ? 1 : -1)
                this.stock_options = options
            },
            // 缓存搜索条件
            set_search_cond() {
                let search_cond = {}
                for (let k of this.search_form_cache_fields) {
                    search_cond[k] = this.search_form[k]
                }
                uni.setStorageSync('search_cond__inv_analysis', search_cond)
                uni.showToast({ title: '保存成功' })
            },
            // 设置搜索条件
            get_search_cond() {
                let cache = uni.getStorageSync('search_cond__inv_analysis')
                if (cache) {
                    for (let k of this.search_form_cache_fields) {
                        this.search_form[k] = cache[k]
                    }
                } else {
                    this.search_form.stock_ids = [103416, 2970623, 103413, 2707596, 103412, 3143701, 103411, 103410, 103409, 3280429, 103414, 103450, 1827755]
                    this.set_creator()
                }
            },
            async set_creator() {
                let res = await BdOperator.query({ 'FOperatorGroupId.FNumber': '109', 'FBizOrgId.FNumber': '102' })
                let creators = []
                for (let d of res.data) creators.push(d.FName)
                this.search_form.creator = creators.join(',')
            },
            async search_dialog_confirm() {
                try {
                    await this.$refs.search_form.validate()
                    this.search()
                    this.$refs.search_dialog.close()
                } catch (err) {
                    this.$logger.info('err', err)
                }
            },
            async search() {
                let x_start_time = Date.now() // 执行开始时间
                uni.showLoading({ title: 'Loading...' })
                await this.load_inv() // 加载即时库存
                uni.showLoading({ title: '5%' })
                await this.load_req() // 加载采购申请单
                uni.showLoading({ title: '10%' })
                await this.load_sub() // 加载委外订单
                uni.showLoading({ title: '15%' })
                await this.load_po() // 加载采购订单
                uni.showLoading({ title: '20%' }) 
                await this.load_rec() // 加载生产订单领用
                uni.hideLoading()
                uni.showModal({ title: '搜索完毕',
                    content: [`搜索耗时 ${(Date.now() - x_start_time) / 1000} 秒`,
                              '每页最多展示200行，请导出查看全部数据'].join('\n'),
                })
            },
            async load_rec() {
                let mos = []
                this.table_body_rec = []
                let options = {}
                let jhxh = []
                if (this.search_form.jhxh) {
                    let jhxh_set = new Set()
                    for (let text of this.search_form.jhxh.split('\n')) {
                        if (text.trim()) jhxh_set.add(text.trim())
                    }
                    jhxh = Array.from(jhxh_set)
                }
                if (this.search_form.sale_order_no.trim()) options.FSaleOrderNo = this.search_form.sale_order_no.trim()
                if (this.search_form.bill_no.trim()) options.FBillNo = this.search_form.bill_no.trim()
                if (this.search_form.material_no.trim()) options['FMaterialId.FNumber_lk'] = this.search_form.material_no.trim()
                if (this.search_form.material_name.trim()) options['FMaterialId.FName_lk'] = this.search_form.material_name.trim()
                if (this.search_form.material_spec.trim()) options['FMaterialId.FSpecification_lk'] = this.search_form.material_spec.trim()
                if (this.search_form.workshop.trim()) options['FWorkShopID.FName'] = this.search_form.workshop.trim()
                if (jhxh.length === 0 && Object.keys(options).length === 0) return // 搜索条件为空时，忽略
                
                // uni.showLoading({ title: 'Loading...' })
                // 1. 查询生产订单
                let step = 500
                for (let i = 0; i < jhxh.length; i += step) {
                    let mo_res_1 = await PrdMo.get_all({ ...options, F_PAEZ_JHXH_in: jhxh.slice(i, i+step), FStatus_in: ['4', '5'] }, {}) // 业务状态=开工|完工
                    let mo_res_2 = await PrdMo.get_all({ ...options, F_PAEZ_JHXH_in: jhxh.slice(i, i+step), FStatus: '6', FCloseType: 'A' }, {}) // 业务状态=结案&结案类型=自动结案
                    for (let d of mo_res_1.concat(mo_res_2)) {
                        mos.push({
                            id: d.FID,
                            jhxh: d.F_PAEZ_JHXH,
                            sale_order_no: d.FSaleOrderNo,
                            bill_no: d.FBillNo,
                            material_no: d['FMaterialId.FNumber'],
                            material_name: d['FMaterialId.FName'],
                            material_spec: d['FMaterialId.FSpecification'],
                            unit_name: d['FUnitId.FName'],
                            qty: d.FQty,
                            siqa_qty: d.FStockInQuaAuxQty,
                            nsi_qty: d.FNoStockInQty,
                            workshop: d['FWorkShopID.FName'],
                            pick_mtrl_status: this.pick_mtrl_status_dict[d.FPickMtrlStatus],
                            start_date: new Date(d.FStartDate), // formatDate(d.FStartDate, 'yyyy-MM-dd hh:mm:ss')
                            issue_date: ''
                        })
                    }
                }
                this.mos = mos
                // 2. 查询发料时间
                let a_step = 1000
                for (let i = 0; i < mos.length; i += a_step) {
                    let mo_bill_nos = mos.slice(i, i + a_step).map(mo => mo.bill_no)
                    let imn_res = await PrdIssueMtrNotice.query({ FMoBillNo1_in: mo_bill_nos }, { fields: ['FMoBillNo1', 'FCreateDate'], return: 'array' })
                    for (let d of imn_res.data) {
                        let mo = mos.find(x => x.bill_no === d[0])
                        mo.issue_date = mo.issue_date || new Date(d[1])
                    }
                }
                // 3. 查询生产用料清单
                let p_fenmu = mos.length
                let p_fenzi = 0
                let ppbom_fields = ['FMoId', 'FMaterialId2.FNumber', 'FMaterialId2.FName', 'FMaterialId2.FSpecification', 'FUnitId2.FName',
                                    'FMustQty', 'FPickedQty', 'FInventoryQty', 'FIssueType', 'FStockId.FName' ]
                let b_step = 38 // 优化 - 多个生产订单编号同时查询，减少接口调用次数
                for (let i = 0; i < mos.length; i += b_step) {
                    let mo_ids = mos.slice(i, i + b_step).map(mo => mo.id)
                    let ppbom_res = await PrdPpbom.query({ FMoId_in: mo_ids }, { fields: ppbom_fields, return: 'array' })
                    for (let d of ppbom_res.data) {
                        let mo = mos.find(x => x.id === d[0])
                        d[8] = this.issue_type_dict[d[8]]
                        this.table_body_rec.push([...Object.values(mo).slice(1), ...d.slice(1)])
                    }
                    p_fenzi += b_step
                    if (p_fenzi > p_fenmu) p_fenzi = p_fenmu
                    uni.showLoading({ title: `${(p_fenzi * 80 / p_fenmu + 20).toFixed(1)} %` })
                }
                uni.hideLoading()
            },
            async load_inv() {
                this.table_body_inv = []
                for (let stock_id of this.search_form.stock_ids) {
                    let res = await StkInventory.query({ FStockId: stock_id }, { fields: this.fields_inv, return: 'array' })
                    for (let d of res.data) this.table_body_inv.push(d)
                }
            },
            async load_req() {
                this.table_body_req = []
                let options = { ...this.search_form.req }
                if (this.search_form.created_at_ge) options.FCreateDate_ge = this.search_form.created_at_ge
                if (this.search_form.created_at_le) options.FCreateDate_le = this.search_form.created_at_le
                if (this.search_form.creator) {
                    let creators = []
                    for (let name of this.search_form.creator.split(',')) {
                        creators.push(name.trim())
                    }
                    if (creators.length) options['FCreatorId.FName_in'] = creators
                }
                let res = await PurRequisition.query(options, { fields: this.fields_req, return: 'array' })
                for (let d of res.data) {
                    d[2] = store.state.document_status_dict[d[2]]
                    if (d[9]) d[9] = new Date(d[9])
                    if (d[10]) d[10] = new Date(d[10])
                    this.table_body_req.push(d)
                }
            },
            async load_sub() {
                this.table_body_sub = []
                let options = { ...this.search_form.sub }
                if (this.search_form.created_at_ge) options.FCreateDate_ge = this.search_form.created_at_ge
                if (this.search_form.created_at_le) options.FCreateDate_le = this.search_form.created_at_le
                if (this.search_form.creator) {
                    let creators = []
                    for (let name of this.search_form.creator.split(',')) {
                        creators.push(name.trim())
                    }
                    if (creators.length) options['FCreatorId.FName_in'] = creators
                }
                let res = await SubSubReqOrder.query(options, { fields: this.fields_sub, return: 'array' })
                for (let d of res.data) {
                    d[2] = store.state.document_status_dict[d[2]]
                    if (d[9]) d[9] = new Date(d[9])
                    if (d[10]) d[10] = new Date(d[10])
                    this.table_body_sub.push(d)
                }
            },
            async load_po() {
                this.table_body_po = []
                let options = { ...this.search_form.po }
                if (this.search_form.created_at_ge) options.FCreateDate_ge = this.search_form.created_at_ge
                if (this.search_form.created_at_le) options.FCreateDate_le = this.search_form.created_at_le
                let filter_string = `${K3CloudApi.query_filter(options)} AND (FRemainReceiveQty > 0 OR FReceiveQty > FStockInQty)`
                
                let res = null
                let page = 1
                let per_page = 10000
                while (!res || res.data.length === per_page) {
                    res = await K3CloudApi.execute_bill_query({
                        FormId: "PUR_PurchaseOrder",
                        FieldKeys: this.fields_po.join(','),
                        FilterString: filter_string,
                        StartRow: (page - 1) * per_page,
                        Limit: per_page
                    })
                    for (let d of res.data) {
                        d[3] = store.state.document_status_dict[d[3]]
                        if (d[9] < 0) d[9] = 0 // 剩余收料<0时，重置为0
                        d[10] = d[17] - d[18]
                        if (d[10] < 0) d[10] = 0 // 收料可退<0时，重置为0
                        if (d[13]) d[13] = new Date(d[13])
                        if (d[14]) d[14] = new Date(d[14])
                        this.table_body_po.push(d.slice(0, 17))
                    }
                    page++
                }
                
                // let res = await PurPurchaseOrder.query(options, { fields: this.fields_po, return: 'array' })
                // for (let d of res.data) {
                //     if (d[8] <= 0 && d[9] == 0) continue
                //     d[2] = store.state.document_status_dict[d[2]]
                //     if (d[8] < 0) d[8] = 0 // 剩余收料<0时，重置为0
                //     d[9] = d[16] - d[17]
                //     if (d[9] < 0) d[9] = 0 // 收料可退<0时，重置为0
                //     if (d[12]) d[12] = new Date(d[12])
                //     if (d[13]) d[13] = new Date(d[13])
                //     this.table_body_po.push(d.slice(0, 16))
                // }
            },
            export_as_excel() {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持导出Excel' })
                    return
                // #endif
                if (this.table_body_rec.length === 0 &&
                    this.table_body_inv.length === 0 && 
                    this.table_body_req.length === 0 && 
                    this.table_body_sub.length === 0 && 
                    this.table_body_po.length === 0) {
                    uni.showModal({ title: '提示', content: '没有数据可供导出' })
                    return
                }
                try {
                    uni.showLoading({ title: '正在导出...', mask: true })
                    setTimeout(() => {
                        let book = XLSX.utils.book_new()
                        let sheet_rec = XLSX.utils.aoa_to_sheet([this.table_head_rec, ...this.table_body_rec])
                        XLSX.utils.book_append_sheet(book, sheet_rec, '生产订单领用')
                        let sheet_req = XLSX.utils.aoa_to_sheet([this.table_head_req, ...this.table_body_req, ...this.table_body_sub])
                        XLSX.utils.book_append_sheet(book, sheet_req, '采购申请单（未推）')
                        let sheet_po = XLSX.utils.aoa_to_sheet([this.table_head_po, ...this.table_body_po])
                        XLSX.utils.book_append_sheet(book, sheet_po, '采购订单')
                        let sheet_inv = XLSX.utils.aoa_to_sheet([this.table_head_inv, ...this.table_body_inv])
                        XLSX.utils.book_append_sheet(book, sheet_inv, '即时库存')
                        XLSX.writeFile(book, `物料需求梳理_${formatDate(Date.now(), 'yyyyMMdd_hhmmss')}.xlsx`, { compression: true, type: 'binary' });
                        uni.hideLoading()
                        uni.showToast({ title: '导出完毕' })
                    }, 1000)
                } catch (err) {
                    uni.hideLoading()
                    uni.showModal({ title: '导出Excel失败', content: `原因：${err}` })
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .tab-content {
        padding-bottom: 60px;
    }
    .table-sm::v-deep {
        .uni-table {
            .uni-table-th {
                padding: 4px 5px;
            }
            .uni-table-td {
                line-height: 15px;
                padding: 4px 5px;
            }
        }
    }
    .search-form {
        flex: 1;
    }
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
</style>
