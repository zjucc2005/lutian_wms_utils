<template>
    <uni-section title="批改模板" type="square" @click="$logger.info('>>>', $data)">
        <view class="container">
            <!-- 模板样例 -->
            <uni-table ref="table" border stripe class="table-sm uni-mb-5">
                <uni-tr>
                    <uni-th v-for="(name, index) in table_head" :key="index" align="center">{{ name }}</uni-th>
                </uni-tr>
                <uni-tr >
                    <uni-td v-for="(desc, index) in table_desc" :key="index" align="center" style="white-space: break-spaces;">{{ desc }}</uni-td>
                </uni-tr>
            </uni-table>
            <view class="text-grey text-sm uni-mb-5">注意！如果想要把某字段的值清空，请在对应单元格内填写数字0；如果该字段不允许修改为空，则会忽略；</view>
            
            <view class="uni-mb-5">
                <uni-icons type="download-filled" size="18" color="#007aff"></uni-icons>
                <text class="text-link" @click="download_template">下载批改模板</text>
            </view>
            <view>
                <button type="primary" size="mini" @click="choose_file">选择文件</button>
                <view class="text-grey text-sm">注意！选择文件需先解密</view>
            </view>
        </view>
    </uni-section>
    
    <uni-section v-if="response_result.length" title="响应结果" type="square">
        <uni-table ref="table" border stripe class="table-sm uni-mb-5">
            <uni-tr>
                <uni-th align="center">索引</uni-th>
                <uni-th align="center">消息</uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in response_result" :key="index">
                <uni-td align="center">{{ item.DIndex }}</uni-td>
                <uni-td>{{ item.Message }}</uni-td>
            </uni-tr>
        </uni-table>
    </uni-section>
</template>

<script>
    import XLSX from 'xlsx'
    import store from '@/store'
    import { BdDepartment, BdMaterial } from '@/utils/model'
    
    export default {
        data() {
            return {
                raw_data: [],
                done_data: [],
                response_result: [],
                raw_len: 1,
                done_len: 0,
                table_head: ['物料编码', '使用组织编码', '仓库', '发料仓库', '发料方式', '仓管员', '生产车间', '计划员', '计划标识'],
                table_desc: [
                    '示例：0.0.0.0001', 
                    '多个组织编码用&隔开\n示例：100&102', 
                    '会验证仓库的使用组织\n示例：汽油机材料库', 
                    '填写方式同仓库', 
                    '枚举值：\n1-直接领料\n2-直接倒冲\n3-调拨领料\n4-调拨倒冲\n7-不发料', 
                    '为区分重名员工，此处填写工号\n示例：10086', 
                    '示例：汽油机车间', 
                    '填写方式同仓管员', 
                    '示例：内燃机包材类'
                ],
                issue_type_dict: { '直接领料': '1', '直接倒冲': '2', '调拨领料': '3', '调拨倒冲': '4', '不发料': '7' },
                plan_ident_dict: { '内燃机包材类': 'N102-3' },
                departments: [],
                bd_stocks: store.state.bd_stocks
            }
        },
        mounted() {
            this.load_departments()
        },
        computed: {
            progress_percent() {
                return (this.done_len * 100 / this.raw_len).toFixed()
            }
        },
        methods: {
            download_template() {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持该功能' })
                    return
                // #endif
                uni.showLoading({ title: '正在下载...', mask: true })
                setTimeout(() => {
                    let book = XLSX.utils.book_new()
                    let sheet = XLSX.utils.aoa_to_sheet([this.table_head])
                    XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
                    XLSX.writeFile(book, '物料批改模板.xlsx');
                    uni.hideLoading()
                }, 200)
            },
            // import
            choose_file() {
                let _this_ = this
                uni.chooseFile({
                    count: 1,
                    extension: ['.xlsx', '.xls'],
                    success (res) {
                        this.raw_data = [] // init
                        let temp_file = res.tempFiles[0]
                        let extname = temp_file.name.split('.').pop()
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            let data = e.target.result
                            let book = XLSX.read(data, { type: 'binary' })
                            let sheet = book.Sheets[book.SheetNames[0]]
                            let sheet_data =  XLSX.utils.sheet_to_json(sheet, { header: 1 })
                            _this_.raw_data = sheet_data
                            // _this_.handle_data()
                            _this_.submit_batch_update()
                        };
                        reader.readAsBinaryString(temp_file)
                    }
                })
            },
            async load_departments() {
                let res = await BdDepartment.query({}, {})
                this.departments = res.data
            },
            async submit_batch_update() {
                uni.showLoading({ title: 'Loading' })
                let done_data = await this.handle_data()
                let res = await BdMaterial.batch_update(done_data)
                uni.hideLoading()
                if (res.data.Result.ResponseStatus.IsSuccess) {
                    this.response_result = [{ DIndex: 0, Message: '操作成功' }]
                } else {
                    this.response_result = res.data.Result.ResponseStatus.Errors
                }
            },
            async handle_data() {
                let done_data = []
                this.done_data = [] // init
                for (let i = 1; i < this.raw_data.length; i++) {
                    let row = this.raw_data[i]
                    let res = await BdMaterial.query({ FNumber: row[0].trim() }, { fields: ['FMaterialId', 'FNumber', 'FUseOrgId.FNumber', 'FIssueType'] })
                    for (let org_no of row[1].split('&')) {
                        org_no = org_no.trim()
                        let obj = { SubHeadEntity5: {} }
                        let bd_material = res.data.find(x => x['FUseOrgId.FNumber'] == org_no)
                        if (bd_material) {
                            obj.FMaterialId = bd_material.FMaterialId
                            // obj.use_org_no = bd_material['FUseOrgId.FNumber']
                        } else {
                            continue
                        }
                        if (row[2] || [0, '0'].includes(row[2])) { // 仓库
                            if ([0, '0'].includes(row[2])) {
                                obj.FStockId = { FStockId: 0 }
                            } else {
                                let stock = store.state.bd_stocks.find(x => x.FName == row[2].trim() && x['FUseOrgId.FNumber'] === org_no)
                                if (stock) obj.FStockId = { FStockId: stock.FStockId }
                            }
                        }
                        if (row[3] || [0, '0'].includes(row[3])) { // 发料仓库
                            if ([0, '0'].includes(row[3])) {
                                obj.FPickStockId = { FStockId: 0 }
                            } else {
                                let pick_stock = store.state.bd_stocks.find(x => x.FName == row[3].trim() && x['FUseOrgId.FNumber'] === org_no)
                                if (pick_stock) obj.FPickStockId = { FStockId: pick_stock.FStockId }
                            }
                        }
                        if (row[4] && org_no == '100') { // 发料方式
                            let issue_type = this.issue_type_dict[row[4].trim()] || row[4].trim()
                            if (issue_type) obj.SubHeadEntity5.FIssueType = issue_type
                        }
                        if (row[5] || [0, '0'].includes(row[5])) { // 仓管员
                            if([0, '0'].includes(row[5])) {
                                obj.F_PAEZ_Base1 = { FStaffNumber: 0 }
                            } else {
                                obj.F_PAEZ_Base1 = { FStaffNumber: String(row[5]) }
                            }
                        }
                        if (row[6] || [0, '0'].includes(row[6])) { // 生产车间
                            if ([0, '0'].includes(row[6])) {
                                obj.FWorkShopId = { FDeptId: 0 }
                            } else {
                                let department = this.departments.find(x => x.FName == row[6].trim())
                                if (department) obj.FWorkShopId = { FDeptId: department.FDeptId }
                            }
                        }
                        if ((row[7] || [0, '0'].includes(row[7])) && org_no == '102') { // 计划员
                            if ([0, '0'].includes(row[7])) {
                                obj.FPlanerID = { FNumber: '' }
                            } else {
                                obj.FPlanerID = { FNumber: String(row[7]) }
                            }
                        }
                        if ((row[8] || [0, '0'].includes(row[8])) && org_no == '102') { // 计划标识
                            if ([0, '0'].includes(row[8])) {
                                obj.FPlanIdent = { FNumber: '' }
                            } else {
                                obj.FPlanIdent = { FNumber: String(row[8]) }
                            }
                        }
                        done_data.push(obj)
                    }
                }
                this.done_data = done_data
                return done_data
            },
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
</style>
