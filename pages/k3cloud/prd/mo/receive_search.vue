<template>
    <view class="above-uni-goods-nav">
        <uni-table ref="table" border stripe class="table-sm">
            <uni-tr>
                <uni-th></uni-th>
                <uni-th v-for="(name, index) in table_head" :key="index" align="center">{{ name }}</uni-th>
            </uni-tr>
            
            <uni-tr v-for="i in Math.min(table_body.length, 1000)" :key="i">
                <uni-td>{{ i }}</uni-td>
                <uni-td v-for="(cell, j) in table_body[i-1]" :key="j" align="center">{{ cell }}</uni-td>
            </uni-tr>
        </uni-table>
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
                <uni-forms ref="search_form" :model="search_form" :label-width="98">
                    <uni-row :gutter="15">
                        <uni-col :span="24">
                            <uni-forms-item label="计划序号">
                                <uni-easyinput v-model="search_form.jhxh" type="textarea" :maxlength="-1" />
                            </uni-forms-item>
                        </uni-col>
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
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="生产车间">
                                <uni-easyinput v-model="search_form.workshop" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="业务状态">
                                <uni-data-select v-model="search_form.status" 
                                    :localdata="status_options" 
                                />
                            </uni-forms-item>
                        </uni-col>
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import { PrdMo, PrdPpbom, PrdIssueMtrNotice } from '@/utils/model'
    import { formatDate, string_to_arraybuffer } from '@/utils'
    
    export default {
        data() {
            return {
                mos: [], // 生产订单缓存
                table_head: ['计划序号', '需求单据', '生产订单编号', '物料编码', '物料名称', '规格型号', '单位',
                             '数量', '合格品入库数量', '未入库数量', '生产车间', '领料状态', '开工日期', '发料时间',
                             '子项物料编码', '子项物料名称', '子项规格型号', '子项单位', '应发数量', '已领数量', '可用库存', '发料方式', '仓库'],
                table_body: [], // 最终展示数据
                search_form: {
                    jhxh: '',
                    sale_order_no: '',
                    bill_no: '',
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    workshop: '',
                    status: ''
                },
                status_options: Object.entries(PrdMo.FStatusEnum).map(e => { return { value: e[0], text: e[1] } }),
                pick_mtrl_status_dict: { '1': '未领料', '2': '部分领料', '3': '全部领料', '4': '超额领料' }, 
                issue_type_dict: { '1': '直接领料', '2': '直接倒冲', '3': '调拨领料', '4': '调拨倒冲', '7': '不发料' }, 
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
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) this.export_as_excel()
            },
            search_dialog_confirm() {
                try {
                    this.search()
                } catch (err) {
                    console.log('err', err)
                }
                this.$refs.search_dialog.close()
            },
            async search() {
                let mos = []
                let table_body = []
                let options = {}
                if (this.search_form.jhxh) {
                    let jhxh = new Set()
                    for (let text of this.search_form.jhxh.split('\n')) {
                        if (text.trim()) jhxh.add(text.trim())
                    }
                    if (jhxh.size) options.F_PAEZ_JHXH_in = Array.from(jhxh)
                }
                if (this.search_form.sale_order_no.trim()) options.FSaleOrderNo = this.search_form.sale_order_no.trim()
                if (this.search_form.bill_no.trim()) options.FBillNo = this.search_form.bill_no.trim()
                if (this.search_form.material_no.trim()) options['FMaterialId.FNumber_lk'] = this.search_form.material_no.trim()
                if (this.search_form.material_name.trim()) options['FMaterialId.FName_lk'] = this.search_form.material_name.trim()
                if (this.search_form.material_spec.trim()) options['FMaterialId.FSpecification_lk'] = this.search_form.material_spec.trim()
                if (this.search_form.workshop.trim()) options['FWorkShopID.FName'] = this.search_form.workshop.trim()
                if (this.search_form.status) options.FStatus = this.search_form.status
                if (Object.keys(options).length === 0) return // 搜索条件为空时，忽略
                
                let x_start_time = Date.now() // 执行开始时间
                uni.showLoading({ title: 'Loading...' })
                // 1. 查询生产订单
                let mo_res_data = await PrdMo.get_all(options, { order: 'FBillNo ASC' })
                for (let d of mo_res_data) {
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
                        table_body.push([...Object.values(mo).slice(1), ...d.slice(1)])
                    }
                    p_fenzi += b_step
                    if (p_fenzi > p_fenmu) p_fenzi = p_fenmu
                    uni.showLoading({ title: `${(p_fenzi * 100 / p_fenmu).toFixed(1)} %` })
                }
                this.table_body = table_body
                uni.hideLoading()
                uni.showModal({ title: '搜索完毕', 
                    content: [`搜索到 ${this.table_body.length} 行数据`,
                              `搜索耗时 ${(Date.now() - x_start_time) / 1000} 秒`,
                              '本页面最多展示1000行，请导出查看全部数据'].join('\n'),
                })
            },
            export_as_excel() {
                if (this.table_body.length === 0) {
                    uni.showModal({ title: '提示', content: '没有数据可供导出' })
                    return
                }
                try {
                    let book = XLSX.utils.book_new()
                    let sheet = XLSX.utils.aoa_to_sheet([this.table_head, ...this.table_body])
                    XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
                    var book_output = XLSX.write(book, { bookType: 'xlsx', bookSST: true, type: 'binary'})
                    const blob = new Blob([string_to_arraybuffer(book_output)], { type: "application/octet-stream" })
                    // 下载
                    let link = document.createElement('a')
                    link.href = URL.createObjectURL(blob)
                    link.download = `生产订单领用查询_${Date.now()}.xlsx`
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
