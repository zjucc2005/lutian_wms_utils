<template>
    <scroll-view :scroll-into-view="'tab'+currentIndex" scroll-x scroll-with-animation class="tab-scroll" >
        <view 
            v-for="(name, index) in tabs" 
            :id="'tab'+ index"
            :key="index" 
            class="tab-item"
            :class="{ active: currentIndex === index }"
            @click="currentIndex=index"
            >
            {{ name }}
        </view>
    </scroll-view>
    
    <view v-if="currentIndex === 0" class="tab-content">
        <uni-section :title="`即时库存，共 ${ table_body_inv.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr @click="$logger.info('>>>', $data)">
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
    
    <view v-if="currentIndex === 1" class="tab-content">
        <uni-section :title="`采购申请单，共 ${ table_body_req.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_req" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_req.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_req[i-1]" :key="j" align="center">{{ cell }}</uni-td>
                </uni-tr>
                <uni-tr v-if="table_body_req.length > 200">
                    <uni-td>共 {{ table_body_req.length }} 行数据</uni-td>
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
                    <uni-td v-for="(cell, j) in table_body_sub[i-1]" :key="j" align="center">{{ cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 2" class="tab-content">
        <uni-section :title="`采购订单，共 ${ table_body_po.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_po" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_po.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_po[i-1]" :key="j" align="center">{{ cell }}</uni-td>
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
                            <uni-col :md="8" :sm="12" :xs="24">
                                <uni-forms-item label="创建时间" name="created_at_ge">
                                    <uni-datetime-picker type="date" v-model="search_form.created_at_ge" />
                                </uni-forms-item>
                            </uni-col>
                            <uni-col :md="8" :sm="12" :xs="24">
                                <uni-forms-item label="~" name="created_at_le">
                                    <uni-datetime-picker type="date" v-model="search_form.created_at_le" />
                                </uni-forms-item>
                            </uni-col>
                            <uni-col :md="8" :sm="12" :xs="24">
                                <uni-forms-item label="创建人" name="creator">
                                    <uni-easyinput v-model="search_form.creator" placeholder="多个创建人用英文逗号(,)隔开" />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                    </uni-section>
                </uni-forms>
                <view class="text-link text-sm" @click="set_search_cond">保存</view>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import { StkInventory, PurRequisition, SubSubReqOrder, PurPurchaseOrder, BdOperator } from '@/utils/model'
    import { formatDate, string_to_arraybuffer } from '@/utils'
    
    export default {
        data() {
            return {
                fields_inv: ['FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FBaseUnitId.FName', 'FBaseQty', 'FStockName'],
                table_head_inv: ['物料编码', '物料名称', '规格型号', '库存主单位', '库存量(主单位)', '仓库名称'],
                table_body_inv: [],
                fields_req: ['FCreatorId.FName', 'FBillNo', 'FDocumentStatus', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FReqQty', 'FRemainQty', 'FDemandBillNo', 'FApplicationDate', 'FArrivalDate'],
                table_head_req: ['创建人', '单据编号', '数据状态', '物料编码', '物料名称', '规格型号', '申请数量', '剩余数量', '需求单据编号', '申请日期', '到货日期'],
                table_body_req: [],
                fields_sub: ['FCreatorId.FName', 'FBillNo', 'FDocumentStatus', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FQty', 'FNoStockInQty', 'FSaleOrderNo', 'FDate', 'FPlanFinishDate'],
                table_head_sub: ['创建人', '单据编号', '单据状态', '物料编码', '物料名称', '规格型号', '数量', '未入库数量', '需求单据编号', '单据日期', '计划完工日期'],
                table_body_sub: [],
                fields_po: ['FSrcBillNo', 'FBillNo', 'FDocumentStatus', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FUnitId.FName', 'FQty', 'FRemainReceiveQty', 'FCheckRetQty', 'FEntryNote', 'FDemandBillNo', 'FDate', 'FDeliveryDate', 'FPurchaserId.FName', 'FSupplierId.FName' ],
                table_head_po: ['源单编号', '单据编号', '单据状态', '物料编码', '物料名称', '规格型号', '采购单位', '采购数量', '剩余收料数量', '收料可退数量', '备注', '需求单据编号', '采购日期', '交货日期', '采购员', '供应商'],
                table_body_po: [],
                search_form: {
                    // 0. 通用
                    created_at_ge: '',
                    created_at_le: '',
                    creator: '',
                    // 1. 即时库存
                    stock_ids: [],
                    // 2. 采购申请单
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
                    // 4. 采购订单
                    po: {
                        FDocumentStatus: 'C', // C - 已审核
                        FCancelStatus: 'A', // A - 未作废, B - 已作废
                        FMRPCloseStatus: 'A', // A - 正常, B - 业务关闭
                        FCloseStatus: 'A', // A - 未关闭, B - 已关闭
                        FMRPTerminateStatus: 'A', // A - 正常, B - 业务终止
                        'FPurchaseOrgId.FNumber_in': ['100', '102']
                    }
                },
                search_form_rules: {
                    created_at_ge: {
                        rules: [
                            { required: true, errorMessage: '创建时间不能为空' },
                        ]
                    }
                },
                stock_options: [],
                currentIndex: 0,
                tabs: [ '即时库存', '采购申请单（未推）', '采购订单' ],
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索'},
                        { icon: 'download', text: '导出表格' }
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
                uni.setStorageSync('search_cond__inv_analysis', {
                    created_at_ge: this.search_form.created_at_ge,
                    created_at_le: this.search_form.created_at_le,
                    creator: this.search_form.creator,
                    stock_ids: this.search_form.stock_ids,
                })
                uni.showToast({ title: '保存成功' })
            },
            // 设置搜索条件
            get_search_cond() {
                let cache = uni.getStorageSync('search_cond__inv_analysis')
                if (cache) {
                    this.search_form.created_at_ge = cache.created_at_ge
                    this.search_form.created_at_le = cache.created_at_le
                    this.search_form.creator = cache.creator
                    this.search_form.stock_ids = cache.stock_ids
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
                uni.showLoading({ title: '25%' })
                await this.load_req() // 加载采购申请单
                uni.showLoading({ title: '50%' })
                await this.load_sub() // 加载委外订单
                uni.showLoading({ title: '75%' })
                await this.load_po() // 加载采购订单
                uni.hideLoading()
                uni.showModal({ title: '搜索完毕',
                    content: [`搜索耗时 ${(Date.now() - x_start_time) / 1000} 秒`,
                              '每页最多展示200行，请导出查看全部数据'].join('\n'),
                })
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
                let res = await PurPurchaseOrder.query(options, { fields: this.fields_po, return: 'array' })
                for (let d of res.data) {
                    d[2] = store.state.document_status_dict[d[2]]
                    if (d[12]) d[12] = new Date(d[12])
                    if (d[13]) d[13] = new Date(d[13])
                    this.table_body_po.push(d)
                }
            },
            export_as_excel() {
                if (this.table_body_inv.length === 0 && this.table_body_req.length === 0 && this.table_body_sub.length === 0 && this.table_body_po.length === 0) {
                    uni.showModal({ title: '提示', content: '没有数据可供导出' })
                    return
                }
                try {
                    let book = XLSX.utils.book_new()
                    let sheet_inv = XLSX.utils.aoa_to_sheet([this.table_head_inv, ...this.table_body_inv])
                    XLSX.utils.book_append_sheet(book, sheet_inv, '即时库存')
                    let sheet_req = XLSX.utils.aoa_to_sheet([this.table_head_req, ...this.table_body_req, ...this.table_body_sub])
                    XLSX.utils.book_append_sheet(book, sheet_req, '采购申请单（未推）')
                    let sheet_po = XLSX.utils.aoa_to_sheet([this.table_head_po, ...this.table_body_po])
                    XLSX.utils.book_append_sheet(book, sheet_po, '采购订单')
                    var book_output = XLSX.write(book, { bookType: 'xlsx', bookSST: true, type: 'binary'})
                    const blob = new Blob([string_to_arraybuffer(book_output)], { type: "application/octet-stream" })
                    // 下载
                    let link = document.createElement('a')
                    link.href = URL.createObjectURL(blob)
                    link.download = `${store.state.cur_staff.FName}_${Date.now()}.xlsx`
                    link.click()
                    URL.revokeObjectURL(link.href)
                } catch (err) {
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
