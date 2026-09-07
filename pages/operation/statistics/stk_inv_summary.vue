<template>
    <scroll-view :scroll-into-view="'tab'+currentIndex" scroll-x scroll-with-animation class="tab-scroll" >
        <view 
            v-for="(name, index) in tabs" 
            :id="'tab'+ index"
            :key="index" 
            class="tab-item"
            :class="{ active: currentIndex === index }"
            @click="currentIndex=index; uni.pageScrollTo({ scrollTop: 0 })"
            >
            {{ name }}
        </view>
    </scroll-view>
    
    <view v-if="currentIndex === 0" class="tab-content">
        <uni-section :title="`共 ${ table_body_sum.length } 行数据`" type="square" @click="debug">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_sum" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_sum.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_sum[i-1]" :key="j" align="center">{{ cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 1" class="tab-content">
        <uni-section :title="`共 ${ table_body_in.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_in" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_in.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_in[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd') : cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 2" class="tab-content">
        <uni-section :title="`共 ${ table_body_out.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_out" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_out.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_out[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd') : cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 3" class="tab-content">
        <uni-section :title="`共 ${ table_body_mv.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_mv" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_mv.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_mv[i-1]" :key="j" align="center">{{ cell instanceof Date ? formatDate(cell, 'yyyy-MM-dd') : cell }}</uni-td>
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
                    
                    <uni-section title="收料通知单 & 发料通知单 & 直接调拨单" type="square">
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
                                <uni-forms-item label="物料编码" name="material_no">
                                    <uni-easyinput v-model="search_form.material_no" type="textarea" :maxlength="-1" placeholder="一个物料编码一行" />
                                </uni-forms-item>
                            </uni-col>
                        </uni-row>
                    </uni-section>
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
    import { StkInventory, PurReceiveBill, PrdIssueMtrNotice, StkTransferDirect } from '@/utils/model'
    import { formatDate } from '@/utils'
    
    export default {
        data() {
            return {
                // process
                mtrl: {},
                cgsl: [],
                scfl: [],
                zjdb: [],
                // output 1
                table_head_sum: ['物料编码', '物料名称', '规格型号', '仓管员', '单位', '库存总数', '收料总数', '收料未入库数量', '应发数量', '已发数量', '未发数量', '跨组织调入数量', '跨组织调出数量'],
                table_body_sum: [],
                // output 2
                table_head_in: ['单据编号', '收料日期', '物料编码', '物料名称', '规格型号', '收料单位', '交货数量', '入库数量', '未入库数量'],
                table_body_in: [],
                // output 3
                table_head_out: ['单据编号', '单据日期', '生产订单编号', '物料编码', '物料名称', '物料规格', '单位', '申请数量', '已发数量', '未发数量', '订单号'],
                table_body_out: [],
                // output 4
                table_head_mv: ['单据编号', '日期', '物料编码', '物料名称', '规格型号', '单位', '调拨数量', '调出仓库', '调入仓库'],
                table_body_mv: [],
                // search
                search_form: { created_at_ge: '', created_at_le: '', stock_ids: [], material_no: '' },
                search_form_rules: {
                    created_at_ge: {
                        rules: [
                            { required: true, errorMessage: '创建时间不能为空' },
                        ]
                    },
                    material_no: {
                        rules: [
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value) {
                                        // 预处理搜索条件
                                        let material_nos = []
                                        for (let no of value.split('\n')) {
                                            if (no.trim()) material_nos.push(no.trim())
                                        }
                                        if (material_nos.length <= 20) {
                                            this.search_form.material_nos = material_nos
                                        } else {
                                            return callback('物料编码不能超过20个')
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                stock_options: [],
                currentIndex: 0,
                tabs: [ '库存明细汇总', '收料通知单明细', '发料通知单明细', '直接调拨单明细' ],
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
            debug() {
                this.$logger.info('>>>', this.$data)
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) this.export_as_excel()
            },
            // 设置搜索条件
            get_search_cond() {
                let cache = uni.getStorageSync('search_cond__stk_inv_summary')
                if (cache) {
                    this.search_form.created_at_ge = cache.created_at_ge
                    this.search_form.created_at_le = cache.created_at_le
                    this.search_form.stock_ids = cache.stock_ids
                } else {
                    this.search_form.stock_ids = [103416, 2970623, 103413, 2707596, 103412, 3143701, 103411, 103410, 103409, 3280429, 103414, 103450, 1827755]
                }
            },
            // 缓存搜索条件
            set_search_cond() {
                uni.setStorageSync('search_cond__stk_inv_summary', {
                    created_at_ge: this.search_form.created_at_ge,
                    created_at_le: this.search_form.created_at_le,
                    stock_ids: this.search_form.stock_ids,
                })
                uni.showToast({ title: '保存成功' })
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
                uni.showLoading({ title: '1.加载库存' })
                await this.load_stk_inv() // 加载即时库存
                uni.showLoading({ title: '2.加载收料' })
                await this.load_cgsl() // 加载收料通知单
                uni.showLoading({ title: '3.加载发料' })
                await this.load_scfl() // 加载发料通知单
                uni.showLoading({ title: '4.加载调拨' })
                await this.load_zjdb() // 加载直接调拨单
                uni.hideLoading()
                this.set_table_data()
                uni.showModal({ title: '搜索完毕',
                    content: [`搜索耗时 ${(Date.now() - x_start_time) / 1000} 秒`,
                              '每页最多展示200行，请导出查看全部数据'].join('\n'),
                })
            },
            async load_stk_inv() {
                let h = {}
                let fields = ['FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.F_PAEZ_Base1', 'FBaseUnitId.FName', 'FBaseQty']
                for (let stock_id of this.search_form.stock_ids) {
                    let options = { FStockId: stock_id }
                    if (this.search_form.material_nos.length) options['FMaterialId.FNumber_in'] = this.search_form.material_nos
                    let res = await StkInventory.query(options, { fields, return: 'array' })
                    for (let d of res.data) {
                        if (h[d[0]]) {
                            h[d[0]].inv_qty += d[5]
                        } else {
                            h[d[0]] = {
                                material_name: d[1], material_spec: d[2], storekeeper: d[3], unit: d[4],
                                inv_qty: d[5], receive_qty: 0, instock_qty: 0, must_qty: 0, picked_qty: 0, dtin_qty: 0, dtout_qty: 0
                            }
                        }
                    }
                }
                this.mtrl = h
            },
            async load_cgsl() {
                let cgsl = []
                let options = {}
                if (this.search_form.created_at_ge) options.FCreateDate_ge = this.search_form.created_at_ge
                if (this.search_form.created_at_le) options.FCreateDate_le = this.search_form.created_at_le
                if (this.search_form.material_nos.length) options['FMaterialId.FNumber_in'] = this.search_form.material_nos
                let fields = ['FBillNo', 'FDate',
                              'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.F_PAEZ_Base1', 'FUnitId.FName',
                              'FActReceiveQty', 'FInStockQty']
                let res = null
                let page = 1
                let per_page = 10000
                while (!res || res.data.length === per_page) {
                    res = await PurReceiveBill.query(options, { fields, page, per_page, return: 'array' })
                    for (let d of res.data) {
                        let obj = {
                            bill_no: d[0], date: new Date(d[1]),
                            material_no: d[2], material_name: d[3], material_spec: d[4], storekeeper: d[5], unit: d[6],
                            receive_qty: d[7], instock_qty: d[8]
                        }
                        cgsl.push(obj)
                        let m = this.mtrl[obj.material_no]
                        if (m) {
                            m.receive_qty += obj.receive_qty
                            m.instock_qty += obj.instock_qty
                        } else {
                            this.mtrl[obj.material_no] = {
                                material_name: obj.material_name, material_spec: obj.material_spec, storekeeper: obj.storekeeper, unit: obj.unit, 
                                inv_qty: 0, receive_qty: obj.receive_qty, instock_qty: obj.instock_qty, must_qty: 0, picked_qty: 0, dtin_qty: 0, dtout_qty: 0
                            }
                        }
                    }
                    page++
                }
                this.cgsl = cgsl
            },
            async load_scfl() {
                let scfl = []
                let options = {}
                if (this.search_form.created_at_ge) options.FCreateDate_ge = this.search_form.created_at_ge
                if (this.search_form.created_at_le) options.FCreateDate_le = this.search_form.created_at_le
                if (this.search_form.material_nos.length) options['FMaterialId.FNumber_in'] = this.search_form.material_nos
                let fields = ['FBillNo', 'FDate', 'FMoBillNo', 'F_PAEZ_Text',
                              'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.F_PAEZ_Base1', 'FUnitId1.FName',
                              'FAppQty', 'FActPickedQty', 'FNoPickedQty']
                let res = null
                let page = 1
                let per_page = 10000
                while (!res || res.data.length === per_page) {
                    res = await PrdIssueMtrNotice.query(options, { fields, page, per_page, return: 'array' })
                    for (let d of res.data) {
                        let obj = {
                            bill_no: d[0], date: new Date(d[1]), mo_bill_no: d[2], order_no: d[3],
                            material_no: d[4], material_name: d[5], material_spec: d[6], storekeeper: d[7], unit: d[8],
                            must_qty: d[9], picked_qty: d[10], nopicked_qty: d[11]
                        }
                        scfl.push(obj)
                        let m = this.mtrl[obj.material_no]
                        if (m) {
                            m.must_qty += obj.must_qty
                            m.picked_qty += obj.picked_qty
                        } else {
                            this.mtrl[obj.material_no] = {
                                material_name: obj.material_name, material_spec: obj.material_spec, storekeeper: obj.storekeeper, unit: obj.unit, 
                                inv_qty: 0, receive_qty: 0, instock_qty: 0, must_qty: obj.must_qty, picked_qty: obj.picked_qty, dtin_qty: 0, dtout_qty: 0
                            }
                        }
                    }
                    page++
                }
                this.scfl = scfl
            },
            async load_zjdb() {
                let zjdb = []
                let options = { 'FStockOrgId_ne': ':FStockOutOrgId' }  // 筛选跨组织调拨
                if (this.search_form.created_at_ge) options.FCreateDate_ge = this.search_form.created_at_ge
                if (this.search_form.created_at_le) options.FCreateDate_le = this.search_form.created_at_le
                if (this.search_form.material_nos.length) options['FMaterialId.FNumber_in'] = this.search_form.material_nos
                let fields = ['FBillNo', 'FDate', 'FSrcStockId.FName', 'FDestStockId.FName',
                              'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.F_PAEZ_Base1', 'FUnitId.FName',
                              'FQty']
                // 1. 调入
                let res = null
                let page = 1
                let per_page = 10000
                while (!res || res.data.length === per_page) {
                    res = await StkTransferDirect.query({ ...options, 'FStockOrgId.FName': '内燃机事业部' }, { fields, page, per_page, return: 'array' })
                    for (let d of res.data) {
                        let obj = {
                            bill_no: d[0], date: new Date(d[1]), src_stock: d[2], dest_stock: d[3],
                            material_no: d[4], material_name: d[5], material_spec: d[6], storekeeper: d[7], unit: d[8],
                            qty: d[9]
                        }
                        zjdb.push(obj)
                        let m = this.mtrl[obj.material_no]
                        if (m) {
                            m.dtin_qty += obj.qty
                        } else {
                            this.mtrl[obj.material_no] = {
                                material_name: obj.material_name, material_spec: obj.material_spec, storekeeper: obj.storekeeper, unit: obj.unit, 
                                inv_qty: 0, receive_qty: 0, instock_qty: 0, must_qty: 0, picked_qty: 0, dtin_qty: obj.qty, dtout_qty: 0
                            }
                        }
                    }
                    page++
                }
                // 1. 调出
                res = null
                page = 1
                per_page = 10000
                while (!res || res.data.length === per_page) {
                    res = await StkTransferDirect.query({ ...options, 'FStockOutOrgId.FName': '内燃机事业部' }, { fields, page, per_page, return: 'array' })
                    for (let d of res.data) {
                        let obj = {
                            bill_no: d[0], date: new Date(d[1]), src_stock: d[2], dest_stock: d[3],
                            material_no: d[4], material_name: d[5], material_spec: d[6], storekeeper: d[7], unit: d[8],
                            qty: d[9]
                        }
                        zjdb.push(obj)
                        let m = this.mtrl[obj.material_no]
                        if (m) {
                            m.dtout_qty += obj.qty
                        } else {
                            this.mtrl[obj.material_no] = {
                                material_name: obj.material_name, material_spec: obj.material_spec, storekeeper: obj.storekeeper, unit: obj.unit, 
                                inv_qty: 0, receive_qty: 0, instock_qty: 0, must_qty: 0, picked_qty: 0, dtin_qty: 0, dtout_qty: obj.qty
                            }
                        }
                    }
                    page++
                }
                this.zjdb = zjdb
            },
            set_table_data () {
                // ['物料编码', '物料名称', '规格型号', '仓管员', '单位', '库存总数', '收料总数', '收料未入库数量', '应发数量', '已发数量', '未发数量', '跨组织调入数量', '跨组织调出数量']
                this.table_body_sum = []
                for (let material_no in this.mtrl) {
                    let row = this.mtrl[material_no]
                    this.table_body_sum.push([
                        material_no, row.material_name, row.material_spec, row.storekeeper, row.unit, 
                        row.inv_qty, row.receive_qty, row.receive_qty - row.instock_qty, row.must_qty, row.picked_qty, row.must_qty - row.picked_qty, row.dtin_qty, row.dtout_qty
                    ])
                }
                // ['单据编号', '收料日期', '物料编码', '物料名称', '规格型号', '收料单位', '交货数量', '入库数量', '未入库数量']
                this.table_body_in = []
                for (let row of this.cgsl) {
                    this.table_body_in.push([row.bill_no, row.date, row.material_no, row.material_name, row.material_spec, row.unit, row.receive_qty, row.instock_qty, row.receive_qty - row.instock_qty])
                }
                // ['单据编号', '单据日期', '生产订单编号', '物料编码', '物料名称', '物料规格', '单位', '申请数量', '已发数量', '未发数量', '订单号']
                this.table_body_out = []
                for (let row of this.scfl) {
                    this.table_body_out.push([row.bill_no, row.date, row.mo_bill_no, row.material_no, row.material_name, row.material_spec, row.unit, row.must_qty, row.picked_qty, row.nopicked_qty, row.order_no])
                }
                // ['单据编号', '日期', '物料编码', '物料名称', '规格型号', '单位', '调拨数量', '调出仓库', '调入仓库']
                this.table_body_mv = []
                for (let row of this.zjdb) {
                    this.table_body_mv.push([row.bill_no, row.date, row.material_no, row.material_name, row.material_spec, row.unit, row.qty, row.src_stock, row.dest_stock])
                }
            },
            export_as_excel() {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持导出Excel' })
                    return
                // #endif
                if (this.table_body_sum.length === 0 && this.table_body_in.length === 0 && this.table_body_out.length === 0 && this.table_body_mv.length === 0) {
                    uni.showModal({ title: '提示', content: '没有数据可供导出' })
                    return
                }
                try {
                    uni.showLoading({ title: '正在导出...', mask: true })
                    setTimeout(() => {
                        let book = XLSX.utils.book_new()
                        let sheet_1 = XLSX.utils.aoa_to_sheet([this.table_head_sum, ...this.table_body_sum])
                        XLSX.utils.book_append_sheet(book, sheet_1, '库存明细汇总')
                        let sheet_2 = XLSX.utils.aoa_to_sheet([this.table_head_in, ...this.table_body_in])
                        XLSX.utils.book_append_sheet(book, sheet_2, '收料通知单明细')
                        let sheet_3 = XLSX.utils.aoa_to_sheet([this.table_head_out, ...this.table_body_out])
                        XLSX.utils.book_append_sheet(book, sheet_3, '发料通知单明细')
                        let sheet_4 = XLSX.utils.aoa_to_sheet([this.table_head_mv, ...this.table_body_mv])
                        XLSX.utils.book_append_sheet(book, sheet_4, '直接调拨明细')
                        XLSX.writeFile(book, `金蝶库存明细汇总_${formatDate(Date.now(), 'yyyyMMdd_hhmmss')}.xlsx`, { compression: true });
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
