<template>
    <uni-section title="反查结果" type="square" 
        sub-title="固定条件：数据状态=已审核 & 禁用状态=否 & 使用组织=内燃机事业部 & 失效时间 >= 今天" sub-title-color="#007aff"
        @click="$logger.info('>>>', $data)">
        <uni-table ref="table" border stripe class="table-sm">
            <uni-tr>
                <uni-th></uni-th>
                <uni-th align="center" colspan="4">最高级</uni-th>
                <uni-th align="center" colspan="4">父项</uni-th>
                <uni-th align="center" colspan="9">子项</uni-th>
            </uni-tr>
            <uni-tr>
                <uni-th></uni-th>
                <uni-th v-for="(name, index) in table_head" :key="index" align="center">{{ name.split('）')[1] }}</uni-th>
            </uni-tr>
            
           <!-- <uni-tr v-for="(row, i) in table_body" :key="i">
                <uni-td>{{ i + 1 }}</uni-td>
                <uni-td v-for="(cell, j) in row" :key="j" align="center">{{ cell }}</uni-td>
            </uni-tr> -->
            
            <uni-tr v-for="i in Math.min(table_body.length, 200)" :key="i">
                <uni-td>{{ i }}</uni-td>
                <uni-td v-for="(cell, j) in table_body[i-1]" :key="j" align="center">{{ cell }}</uni-td>
            </uni-tr>
        </uni-table>
    </uni-section>
    
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
                            <uni-forms-item label="物料编码">
                                <uni-easyinput v-model="search_form.material_no" type="textarea" :maxlength="-1" />
                            </uni-forms-item>
                        </uni-col>
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import XLSX from 'xlsx'
    import { EngBom } from '@/utils/model'
    import { formatDate } from '@/utils'
    
    export default {
        data() {
            return {
                table_head: ['（最高级）层级', '（最高级）物料编码', '（最高级）物料名称', '（最高级）规格型号',
                             '（父项）层级', '（父项）物料编码', '（父项）物料名称', '（父项）规格型号',
                             '（子项）层级', '（子项）物料编码', '（子项）物料名称', '（子项）规格型号',
                             '（父-子）单位', '（父-子）分子', '（父-子）分母', '（顶-子）分子', '（顶-子）分母'],
                table_body: [],
                fields: ['FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                         'FMaterialIdChild.FNumber', 'FMaterialIdChild.FName', 'FMaterialIdChild.FSpecification',
                         'FChildUnitId.FName', 'FNumerator', 'FDenominator'],
                search_form: {
                    material_no: '',
                },
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
            // 1.02.10.99.0025
            // 2.08.01.03.99.0021;2.08.01.01.99.0081
            // 2.08.01.01.99.0081
            // this.table_body = []
            // this.find_parents('2.08.01.01.99.0039', [])
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
                this.table_body = []
                if (this.search_form.material_no) {
                    let nos = this.search_form.material_no.split('\n')
                    let x_start_time = Date.now() // 执行开始时间
                    uni.showLoading({ title: 'Loading' })
                    for (let no of nos) {
                        uni.showLoading({ title: no.trim() })
                        if (no.trim()) await this.find_parents(no.trim(), [])
                    }
                    uni.hideLoading()
                    uni.showModal({ title: '搜索完毕',
                        content: [`搜索到 ${this.table_body.length} 行数据`,
                                  `搜索耗时 ${(Date.now() - x_start_time) / 1000} 秒`,
                                  '本页面最多展示200行，请导出查看全部数据'].join('\n'),
                    })
                }
            },
            async find_parents(material_no, chain) {
                if (material_no.startsWith('3.')) {
                    this.handle_data(chain)
                    return
                }
                let options = { 
                    'FMaterialIdChild.FNumber': material_no, 'FUseOrgId.FNumber': '102',
                    FDocumentStatus: 'C', FForbidStatus: 'A', FExpireDate_ge: formatDate(Date.now(), 'yyyy-MM-dd')
                }
                let res = await EngBom.query(options, { fields: this.fields })
                if (res.data.length === 0) {
                    this.handle_data(chain)
                } else {
                    // 去重
                    let set = new Set()
                    for (let d of res.data) set.add(d['FMaterialId.FNumber'])
                    for (let d of res.data) {
                        if (!set.has(d['FMaterialId.FNumber'])) continue
                        let cur_chain = [...chain]
                        if (cur_chain.length === 0) {
                            cur_chain.push({
                                level: 0,
                                no: d['FMaterialIdChild.FNumber'],
                                name: d['FMaterialIdChild.FName'], 
                                spec: d['FMaterialIdChild.FSpecification']
                            })
                        }
                        cur_chain.push({
                            level: cur_chain.length,
                            no: d['FMaterialId.FNumber'],
                            name: d['FMaterialId.FName'],
                            spec: d['FMaterialId.FSpecification'],
                            unit: d['FChildUnitId.FName'],
                            numerator: d['FNumerator'],
                            denominator: d['FDenominator']
                        })
                        await this.find_parents(d['FMaterialId.FNumber'], cur_chain)
                        set.delete(d['FMaterialId.FNumber'])
                    }
                }
            },
            // 将反查数据加入表格，从父级开始往下读取
            handle_data(chain) {
                if (chain.length === 2) {
                    let a = chain[1]
                    let b = chain[1]
                    let c = chain[0]
                    let row = [
                        a.level, a.no, a.name, a.spec, 
                        b.level, b.no, b.name, b.spec, 
                        c.level, c.no, c.name, c.spec, 
                        b.unit, b.numerator, b.denominator,
                        b.numerator, b.denominator
                    ]
                    this.table_body.push(row)
                } else if (chain.length >= 3) {
                    for (let i = 0; i < chain.length - 2; i++) {
                        if (i == 0) {
                            let a = chain[chain.length-1]
                            let b = chain[1+i]
                            let c = chain[0]
                            let s_num = 1
                            let s_den = 1
                            for (let i = chain.length - 1; i > 0; i--) {
                                s_num *= chain[i].numerator
                                s_den *= chain[i].denominator
                            }
                            let row = [
                                a.level, a.no, a.name, a.spec, 
                                b.level, b.no, b.name, b.spec, 
                                c.level, c.no, c.name, c.spec, 
                                b.unit, b.numerator, b.denominator,
                                s_num, s_den
                            ]
                            this.table_body.push(row)
                        } else {
                            let a = chain[chain.length-1]
                            let b = chain[1+i]
                            let row = [
                                a.level, a.no, a.name, a.spec,
                                b.level, b.no, b.name, b.spec,
                                '', '', '', '', '', '', '', '', ''
                            ]
                            this.table_body.push(row)
                        }
                    }
                }
            },
            export_as_excel() {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持导出Excel' })
                    return
                // #endif
                if (this.table_body.length === 0) {
                    uni.showModal({ title: '提示', content: '没有数据可供导出' })
                    return
                }
                try {
                    uni.showLoading({ title: '正在导出...', mask: true })
                    setTimeout(() => {
                        let book = XLSX.utils.book_new()
                        let sheet = XLSX.utils.aoa_to_sheet([this.table_head, ...this.table_body])
                        XLSX.utils.book_append_sheet(book, sheet, '物料清单反查')
                        XLSX.writeFile(book, `物料清单反查_${formatDate(Date.now(), 'yyyyMMdd_hhmmss')}.xlsx`);
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
