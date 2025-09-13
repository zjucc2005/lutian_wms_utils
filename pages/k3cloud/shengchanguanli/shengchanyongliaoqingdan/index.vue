<template>
    <uni-table v-if="$store.state.system_info.windowWidth >= 1200"  ref="table" border stripe>
        <uni-tr>
            <uni-th align="center" width="120">单据编号</uni-th>
            <uni-th align="center" width="120">产品编码</uni-th>
            <uni-th align="center" width="120">需求单据编号</uni-th>
            <uni-th align="center" width="120">生产订单编号</uni-th>
            <uni-th align="center" width="120">子项物料编码</uni-th>
            <uni-th align="center" width="180">子项物料名称</uni-th>
            <uni-th align="center">规格型号</uni-th>
            <uni-th align="center" width="60">分子</uni-th>
            <uni-th align="center" width="60">分母</uni-th>
            <uni-th align="center" width="80">子项单位</uni-th>
            <uni-th align="center" width="80">应发数量</uni-th>
            <uni-th align="center" width="80">计划跟踪号</uni-th>
            <uni-th align="center" width="80">发料方式</uni-th>
            <uni-th align="center" width="150">仓库</uni-th>
            <uni-th align="center" width="80">已领数量</uni-th>
        </uni-tr>
        
        <uni-tr v-for="(ppbom, index) in ppboms" :key="index">
            <uni-td v-if="index > 0 && ppbom.FBillNo == ppboms[index-1].FBillNo"></uni-td>
            <uni-td v-else><view class="text-primary">{{ ppbom.FBillNo }}</view></uni-td>
            <uni-td>{{ ppbom['FMaterialId.FNumber'] }}</uni-td>
            <uni-td>{{ ppbom.FSaleOrderNo }}</uni-td>
            <uni-td>{{ ppbom.FMoBillNo }}</uni-td>
            <uni-td><view class="text-primary">{{ ppbom['FMaterialId2.FNumber'] }}</view></uni-td>
            <uni-td>{{ ppbom['FMaterialId2.FName'] }}</uni-td>
            <uni-td>{{ ppbom['FMaterialId2.FSpecification'] }}</uni-td>
            <uni-td>{{ ppbom.FNumerator }}</uni-td>
            <uni-td>{{ ppbom.FDenominator }}</uni-td>
            <uni-td>{{ ppbom['FUnitId2.FName'] }}</uni-td>
            <uni-td>{{ ppbom.FMustQty }}</uni-td>
            <uni-td>{{ ppbom.FMtoNo }}</uni-td>
            <uni-td>{{ issue_type_enum[ppbom.FIssueType] }}</uni-td>
            <uni-td>{{ ppbom['FStockId.FName'] }}</uni-td>
            <uni-td>{{ ppbom.FPickedQty }}</uni-td>
        </uni-tr>
    </uni-table>
    
    <uni-list v-else>
        <uni-list-item
            v-for="(ppbom, index) in ppboms"
            :key="index"
            >
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ ppbom.FBillNo }} / {{ ppbom.FMoBillNo }}</view>
                    <view class="note">
                        <view>需求单据编号：{{ ppbom.FSaleOrderNo }}</view>
                        <view>编码：{{ ppbom['FMaterialId2.FNumber'] }}</view>
                        <view>名称：{{ ppbom['FMaterialId2.FName'] }}</view>
                        <view>规格：{{ ppbom['FMaterialId2.FSpecification'] }}</view>
                        <view>发料方式：{{ issue_type_enum[ppbom.FIssueType] }}</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <view>{{ ppbom.FNumerator / ppbom.FDenominator }} {{ ppbom['FUnitId2.FName'] }}</view>
                    <progress
                        :percent="_calc_percentage(ppbom)" 
                        stroke-width="2"
                        :active-color="_calc_percentage(ppbom) >= 100 ? '#4cd964' : '#f0ad4e'"
                    />
                </view>
            </template>
        </uni-list-item>
    </uni-list>
    
    <uni-load-more :status="load_more_status" @clickLoadMore="load_more" />
    
    <uni-fab ref="fab" :content="fab_content" @trigger="fab_trigger" show />
    
    <!-- search -->
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="search_dialog_close"
            @confirm="search_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view class="search-form">
                <uni-forms ref="search_form" :model="search_form" :label-width="100">
                    <uni-row :gutter="15">
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="单据编号">
                                <uni-easyinput v-model="search_form.bill_no" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="需求单据编号">
                                <uni-easyinput v-model="search_form.sale_order_no" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="生产订单编号">
                                <uni-easyinput v-model="search_form.mo_bill_no" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="子项物料编码">
                                <uni-easyinput v-model="search_form.sub_material_no" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="子项物料名称">
                                <uni-easyinput v-model="search_form.sub_material_name" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="子项规格型号">
                                <uni-easyinput v-model="search_form.sub_material_spec" />
                            </uni-forms-item>
                        </uni-col>
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
    <!-- statistics -->
    <uni-drawer ref="statistics_drawer" mode="left" :width="$store.state.drawer_width" >
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="统计模板" type="square">
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.statistics_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list>
                    <uni-list-item 
                        title="汇总拣货清单（暂定名称）" note="根据生产订单编号过滤" rightText=".xlsx"
                        show-extra-icon :extra-icon="{ type: 'map', size: '24', color: '#007bff' }"
                        clickable @click="statistics_dialog_open({ type: 0, title: '汇总拣货清单', stock_id: 103409 })"
                        show-arrow />
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
    
    <uni-popup ref="statistics_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            :title="[statistics_form.title, '统计条件'].join('-')"
            cancelText="关闭"
            @close="statistics_dialog_close"
            @confirm="statistics_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view class="statistics-form">
                <uni-forms ref="statistics_form" :model="statistics_form" :rules="statistics_form_rules" :label-width="100">
                    <uni-row :gutter="15">
                        <template v-if="statistics_form.type === 0">
                            <uni-col>
                                <uni-forms-item label="仓库" name="stock_id">
                                    <uni-data-picker
                                        ref="stock_id_data_picker"
                                        v-model="statistics_form.stock_id"
                                        :localdata="$store.state.bd_stock_opts"
                                        popup-title="请选择仓库"
                                        />
                                </uni-forms-item>
                            </uni-col>
                            <uni-col>
                                <uni-forms-item label="生产订单编号" name="mo_bill_no">
                                    <uni-easyinput v-model="statistics_form.mo_bill_no" type="textarea"
                                                   :maxlength="1024" auto-height
                                                   placeholder="复数编号以空格/制表符/换行符隔开" />
                                </uni-forms-item>
                            </uni-col>
                        </template>
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import { BdMaterial, PrdPpbom, StkInventory } from '@/utils/model'
    import { truncate, formatDate, string_to_arraybuffer } from '@/utils'
    
    export default {
        data() {
            return {
                ppboms: [],
                page: 1,
                per_page: 100,
                load_more_status: 'more', // more,loading,nomore
                issue_type_enum: PrdPpbom.FIssueTypeEnum,
                search_form: {
                    bill_no: '',
                    sale_order_no: '',
                    mo_bill_no: '',
                    material_no: '',
                    material_name: '',
                    material_spec: ''
                },
                statistics_form: {
                    type: 0,
                    title: '',
                    stock_id: 0,
                    mo_bill_no: ''
                },
                statistics_form_rules: {
                    stock_id: {
                        rules: [
                            { required: true, errorMessage: '仓库不能为空' }
                        ]
                    },
                    mo_bill_no: {
                        rules: [
                            { required: true, errorMessage: '生产订单编号不能为空' }
                        ]
                    }
                },
                fab_content: [
                    {
                        iconPath: '/static/icon/cc_search.png',
                        selectedIconPath: '/static/icon/cc_search_active.png',
                        text: '搜索',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_statistics.png',
                        selectedIconPath: '/static/icon/cc_statistics_active.png',
                        text: '统计',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_gotop.png',
                        selectedIconPath: '/static/icon/cc_gotop_active.png',
                        text: '返回顶部',
                        active: false
                    }
                ]
            }
        },
        onPullDownRefresh() {
            this.reload_ppboms()
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.load_more()
        },
        mounted() {
            this.load_ppboms()
        },
        methods: {
            truncate,
            formatDate,
            async load_ppboms() {
                let options = { }
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                if (this.search_form.bill_no) options.FBillNo_lk = this.search_form.bill_no
                if (this.search_form.sale_order_no) options.FSaleOrderNo_lk = this.search_form.sale_order_no
                if (this.search_form.mo_bill_no) options.FMoBillNo_lk = this.search_form.mo_bill_no
                if (this.search_form.sub_material_no) options['FMaterialId2.FNumber_lk'] = this.search_form.sub_material_no
                if (this.search_form.sub_material_name) options['FMaterialId2.FName_lk'] = this.search_form.sub_material_name
                if (this.search_form.sub_material_spec) options['FMaterialId2.FSpecification_lk'] = this.search_form.sub_material_spec
                this.load_more_status = 'loading'
                PrdPpbom.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.ppboms.push(item) )
                })
            },
            reload_ppboms() {
                this.ppboms = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_ppboms()
            },
            fab_trigger(e) {
                console.log('this.$data', this.$data)
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) { 
                    // #ifdef H5
                        this.$refs.statistics_drawer.open()
                    // #endif
                    // #ifdef APP-PLUS
                        uni.showToast({ icon: 'error', title: '仅PC端可用' })
                    // #endif
                }
                if (e.index === 2) uni.pageScrollTo({ scrollTop: 0 })
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_ppboms()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                this.reload_ppboms()
                this.search_dialog_close()
            },
            statistics_dialog_open(obj) {
                this.statistics_form = { ...obj }
                this.$refs.statistics_dialog.open()
            },
            statistics_dialog_close() {
                this.$refs.statistics_dialog.close()
            },
            async statistics_dialog_confirm() {
                try {
                    await this.$refs.statistics_form.validate()
                    if (this.statistics_form.type === 0) {
                        // 汇总拣货清单
                        let stock = store.state.bd_stocks.find(s => s.FStockId == this.statistics_form.stock_id)
                        let _mo_bill_nos = this.statistics_form.mo_bill_no?.split(/[\s\t\n]/g) || []
                        // init
                        let materials = [] // 汇总物料信息
                        let bills = [] // 可用MO编号和对应需求单据编号
                        let sheet_header1 = ['', '', '', '', '', '', '']
                        let sheet_header2 = ['物料编码', '物料名称', '规格型号', '单位', '可用量', '仓管员', '分子']
                        // 1. 遍历mo_bill_nos获取表格所需数据
                        uni.showLoading({ title: 'Loading' })
                        for(let mo_bill_no of _mo_bill_nos) {
                            if (mo_bill_no) {
                                let ppbom_res = await PrdPpbom.query({ FMoBillNo: mo_bill_no })
                                for(let ppbom of ppbom_res.data) {
                                    let bill = bills.find(b => b.mo_bill_no == ppbom.FMoBillNo)
                                    if (!bill) {
                                        bills.push({ mo_bill_no: ppbom.FMoBillNo, sale_order_no: ppbom.FSaleOrderNo })
                                    }
                                    let material = materials.find(m => m.no == ppbom['FMaterialId2.FNumber'])
                                    if (material) {
                                        material.mos.push({ mo_bill_no, qty: ppbom.FMustQty })
                                    } else {
                                        // 查询即时库存
                                        let inv_res = await StkInventory.query({ 'FMaterialId.FNumber': ppbom['FMaterialId2.FNumber'], FStockId: stock.FStockId })
                                        // 查询物料基础资料，获取仓管员
                                        let mat_res = await BdMaterial.query({ FNumber: ppbom['FMaterialId2.FNumber'], FUseOrgId: 1 }, { fields: ['F_PAEZ_Base1.FName'] })
                                        materials.push({
                                            no: ppbom['FMaterialId2.FNumber'],
                                            name: ppbom['FMaterialId2.FName'],
                                            spec: ppbom['FMaterialId2.FSpecification'],
                                            stock_name: stock.FName,
                                            inv_qty: inv_res.data[0]?.FBaseQty || 0,
                                            unit_name: ppbom['FUnitId2.FName'],
                                            storekeeper: mat_res.data[0]?.['F_PAEZ_Base1.FName'] || '',
                                            numerator: ppbom.FNumerator,
                                            mos: [{ mo_bill_no, qty: ppbom.FMustQty }]
                                        })
                                    }
                                }
                            }
                        }
                        uni.hideLoading()
                        // 2. 整理数据
                        for(let bill of bills) {
                            sheet_header1.push(bill.sale_order_no)
                            sheet_header2.push(bill.mo_bill_no)
                        }
                        sheet_header1.push('')
                        sheet_header2.push('合计')
                        let sheet_data = [
                            sheet_header1,
                            sheet_header2
                        ]
                        for(let material of materials.sort((x, y) => x.no > y.no ? 1 : -1)) {
                            let row = [material.no, material.name, material.spec, material.unit_name, material.inv_qty, material.storekeeper, material.numerator]
                            let sum_qty = 0
                            for(let bill of bills) {
                                let qty = material.mos.find(m => m.mo_bill_no == bill.mo_bill_no)?.qty || 0
                                row.push(qty)
                                sum_qty += qty
                            }
                            row.push(sum_qty)
                            sheet_data.push(row)
                        }
                        // console.log('sheet_data', sheet_data)
                        let sheet = XLSX.utils.aoa_to_sheet(sheet_data)
                        let book = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
                        var book_output = XLSX.write(book, { bookType: 'xlsx', bookSST: true, type: 'binary'})
                        const blob = new Blob([string_to_arraybuffer(book_output)], { type: "application/octet-stream" })
                        // 下载
                        let link = document.createElement('a')
                        link.href = URL.createObjectURL(blob)
                        link.download = `${this.statistics_form.title}_${Date.now()}.xlsx`
                        link.click()
                        URL.revokeObjectURL(link.href)
                    }
                } catch (err) { console.log('>>> ERR:', err) }
            },
            _calc_percentage(ppbom) {
                return ppbom.FPickedQty * 100 / ppbom.FMustQty
            }
        }
    }
</script>

<style lang="scss">
    .search-form, .statistics-form {
        flex: 1;
    }
</style>
