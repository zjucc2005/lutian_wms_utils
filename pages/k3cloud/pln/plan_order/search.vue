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
        <uni-section :title="`计划订单，共 ${ table_body_pln.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr @click="$logger.info('>>>', $data)">
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_pln" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_pln.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_pln[i-1]" :key="j" align="center">{{ cell }}</uni-td>
                </uni-tr>
            </uni-table>
        </uni-section>
    </view>
    
    <view v-if="currentIndex === 1" class="tab-content">
        <uni-section :title="`组织间需求单，共 ${ table_body_req.length } 行数据`" type="square">
            <uni-table ref="table" border stripe class="table-sm">
                <uni-tr>
                    <uni-th></uni-th>
                    <uni-th v-for="(name, index) in table_head_req" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                
                <uni-tr v-for="i in Math.min(table_body_req.length, 200)" :key="i">
                    <uni-td>{{ i }}</uni-td>
                    <uni-td v-for="(cell, j) in table_body_req[i-1]" :key="j" align="center">{{ cell }}</uni-td>
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
                <uni-forms ref="search_form" :model="search_form" :label-width="98">
                    <uni-row :gutter="15">
                        <uni-col :span="24">
                            <uni-forms-item label="计划序号">
                                <uni-easyinput v-model="search_form.jhxh" type="textarea" :maxlength="-1" />
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
    import { PlnPlanOrder, PlnRequirementOrder } from '@/utils/model'
    import { formatDate, string_to_arraybuffer } from '@/utils'
    
    export default {
        data() {
            return {
                fields_pln: ['FBillNo', 'FComputerNo', 'F_PAEZ_JHXH', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FUnitId.FName', 'FFirmQty', 'FSaleOrderNo', 'FReleaseBillType.FName', 'FPrdDeptId.FName', 'FCreateDate' ],
                table_head_pln: ['单据编号', '运算编号', '计划序号', '物料编码', '物料名称', '规格型号', '单位', '确认订单量', '需求单据编号', '投放单据类型', '生产车间', '创建日期'],
                table_body_pln: [],
                fields_req: ['FBillNo', 'FComputerNo', 'F_PAEZ_JHXH', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FUnitId.FName', 'FFirmQty', 'FSaleOrderNo', 'FRemainQty'],
                table_head_req: ['单据编号', '运算编号', '计划序号', '物料编码', '物料名称', '规格型号', '单位', '确认订单量', '需求单据编号', '剩余需求数量'],
                table_body_req: [],
                search_form: {
                    jhxh: '',
                },
                currentIndex: 0,
                tabs: [ '计划订单', '组织间需求单' ],
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
                this.search()
                this.$refs.search_dialog.close()
            },
            async search() {
                let table_body_pln = []
                let options = {}
                let jhxh = []
                if (this.search_form.jhxh) {
                    let jhxh_set = new Set()
                    for (let text of this.search_form.jhxh.split('\n')) {
                        if (text.trim()) jhxh_set.add(text.trim())
                    }
                    jhxh = Array.from(jhxh_set)
                }
                if (jhxh.length === 0) return // 搜索条件为空时，忽略
                let x_start_time = Date.now() // 执行开始时间
                uni.showLoading({ title: 'Loading...' })
                let step = 10 // 10个一批效率高
                let p_fenmu = jhxh.length
                let p_fenzi = 0
                for (let i = 0; i < jhxh.length; i += step) {
                    let res_pln = await PlnPlanOrder.query({ F_PAEZ_JHXH_in: jhxh.slice(i, i+step) }, { fields: this.fields_pln, return: 'array' })
                    for (let d of res_pln.data) {
                        d[11] = new Date(d[11])
                        this.table_body_pln.push(d)
                    }
                    let res_req = await PlnRequirementOrder.query({ F_PAEZ_JHXH_in: jhxh.slice(i, i+step) }, { fields: this.fields_req, return: 'array' })
                    for (let d of res_req.data) {
                        this.table_body_req.push(d)
                    }
                    p_fenzi += step
                    if (p_fenzi > p_fenmu) p_fenzi = p_fenmu
                    uni.showLoading({ title: `${(p_fenzi * 100 / p_fenmu).toFixed(1)} %` })
                }
                this.table_body_pln.sort((x, y) => x[0] > y[0] ? -1 : 1)
                this.table_body_req.sort((x, y) => x[0] > y[0] ? -1 : 1)
                uni.hideLoading()
                uni.showModal({ title: '搜索完毕',
                    content: [`搜索耗时 ${(Date.now() - x_start_time) / 1000} 秒`,
                              '本页面最多展示200行，请导出查看全部数据'].join('\n'),
                })
            },
            export_as_excel() {
                if (this.table_body_pln.length === 0 && this.table_body_req.length === 0) {
                    uni.showModal({ title: '提示', content: '没有数据可供导出' })
                    return
                }
                try {
                    let book = XLSX.utils.book_new()
                    let sheet_pln = XLSX.utils.aoa_to_sheet([this.table_head_pln, ...this.table_body_pln])
                    XLSX.utils.book_append_sheet(book, sheet_pln, '计划订单')
                    let sheet_req = XLSX.utils.aoa_to_sheet([this.table_head_req, ...this.table_body_req])
                    XLSX.utils.book_append_sheet(book, sheet_req, '组织间需求单')
                    var book_output = XLSX.write(book, { bookType: 'xlsx', bookSST: true, type: 'binary'})
                    const blob = new Blob([string_to_arraybuffer(book_output)], { type: "application/octet-stream" })
                    // 下载
                    let link = document.createElement('a')
                    link.href = URL.createObjectURL(blob)
                    link.download = `计划订单查询_${Date.now()}.xlsx`
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
