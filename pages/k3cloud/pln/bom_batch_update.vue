<template>
    <uni-section title="Excel模板导入" type="square" @click="$logger.info('>>>', $data)">
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
            <view class="text-grey text-sm uni-mb-5">注意！如果想要把某字段的值清空，请在对应单元格内填写数字0；如果该字段不允许修改为空，则会忽略。</view>
            
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
    
    <uni-section title="粘贴板" type="square">
        <view class="container">
            <uni-easyinput v-model="clipboard" type="textarea" :maxlength="-1" class="uni-mb-5" />
            <view class="text-grey text-sm uni-mb-5">注意！表头不用复制。</view>
            <button type="primary" size="mini" @click="handle_clipboard">提交</button>
            <button size="mini" @click="clipboard=''" class="uni-ml-5">清空</button>
        </view>
    </uni-section>
    
    <uni-section v-if="response_result.length" title="响应结果" type="square">
        <uni-table ref="table" border stripe class="table-sm uni-mb-5">
            <uni-tr>
                <uni-th align="center">索引</uni-th>
                <uni-th align="center">消息</uni-th>
            </uni-tr>
            <uni-tr v-for="(res, index) in response_result" :key="index">
                <uni-td align="center">{{ res.i }}</uni-td>
                <uni-td>{{ res.msg }}</uni-td>
            </uni-tr>
        </uni-table>
    </uni-section>
</template>

<script>
    import XLSX from 'xlsx'
    import store from '@/store'
    import { EngBom } from '@/utils/model'
    
    export default {
        data() {
            return {
                clipboard: '',
                raw_data: [],
                done_data: [],
                response_result: [],
                raw_len: 1,
                done_len: 0,
                table_head: ['子项物料编码', '父项物料编码', 'BOM版本', '默认发料仓库', '发料方式'],
                table_desc: [
                    '必填\n示例：0.0.0.0001', 
                    'BOM版本和父项物料编码二选一填写，\n都填写时只取BOM版本\n示例：0.0.0.0001', 
                    '示例：0.0.0.0001_V1.0', 
                    '示例：汽油机材料库', 
                    '枚举值：\n1-直接领料\n2-直接倒冲\n3-调拨领料\n4-调拨倒冲\n7-不发料'
                ],
                issue_type_dict: { '直接领料': '1', '直接倒冲': '2', '调拨领料': '3', '调拨倒冲': '4', '不发料': '7' },
                bd_stocks: store.state.bd_stocks
            }
        },
        mounted() {
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
                    XLSX.writeFile(book, '物料清单批改模板.xlsx');
                    uni.hideLoading()
                }, 200)
            },
            // import
            choose_file() {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持该功能' })
                    return
                // #endif
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
                            _this_.raw_data = sheet_data.slice(1)
                            _this_.submit_batch_update()
                        };
                        reader.readAsBinaryString(temp_file)
                    }
                })
            },
            async handle_clipboard() {
                let rows = this.clipboard.split('\n')
                let raw_data = []
                for (let row of rows) {
                    if (row) raw_data.push(row.split('\t'))
                }
                this.raw_data = raw_data
                this.submit_batch_update()
            },
            async submit_batch_update() {
                uni.showLoading({ title: 'Loading' })
                this.response_result = []
                let succ_cnt = 0
                let sum_cnt = this.raw_data.length
                for (let i = 0; i < sum_cnt; i++) {
                    let v_res = await this.validate_data(this.raw_data[i])
                    if (v_res.status) {
                        let res = await EngBom.batch_update(v_res.data)
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            succ_cnt += 1
                        } else {
                            this.response_result.push({ i: i + 1, msg: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    } else {
                        this.response_result.push({ i: i + 1, msg: v_res.msg })
                    }
                    uni.showLoading({ title: `${((i + 1) * 100 / sum_cnt).toFixed(1)} %` })
                }
                this.response_result.push({ i: '', msg: `共${sum_cnt}行数据，其中成功更新${succ_cnt}行` })
                uni.hideLoading()
            },
            // 验证并格式化待更新数据
            async validate_data(row) {
                let q = {}      // 查询条件
                let params = {} // 更新参数
                if (row[0]?.trim()) {
                    q['FMaterialIdChild.FNumber'] = row[0].trim()
                } else {
                    return { status: false, data: [], msg: '子项物料编码不能为空' }
                }
                if (row[2]?.trim()) {
                    q['FNumber'] = row[2].trim()
                } else if (row[1]?.trim()) {
                    q['FMaterialId.FNumber'] = row[1].trim()
                } else {
                    return { status: false, data: [], msg: '父项物料编码和BOM版本不能同时为空' }
                }
                if (row[3] || [0, '0'].includes(row[3])) {
                    if ([0, '0'].includes(row[3])) {
                        params.FStockId = { FStockId: 0 } 
                    } else {
                        let stock = store.state.bd_stocks.find(x => x.FName == row[3].trim() && x['FUseOrgId.FNumber'] === '102') // 限定内燃机组织
                        if (stock) {
                            params.FStockId = { FStockId: stock.FStockId }
                        } else {
                            return { status: false, data: [], msg: `未找到仓库名[${row[3].trim()}]` }
                        }
                    }
                }
                if (row[4]?.trim()) {
                    let issue_type = this.issue_type_dict[row[4].trim()] || row[4].trim()
                    if (issue_type) params.FIssueType = issue_type
                }
                let res = await EngBom.query(q, { fields: ['FID', 'FNumber', 'FMaterialId.FNumber', 'FTreeEntity_FEntryId', 'FMaterialIdChild.FNumber'] })
                if (res.data.length === 0) {
                    return { status: false, data: [], msg: `未找到对应BOM数据, ${q}` }
                }
                // 组装报文
                let data = []
                for (let d of res.data) {
                    let obj = data.find(x => x.FID = d.FID)
                    if (obj) {
                        obj.FTreeEntity.push({ FEntryId: d['FTreeEntity_FEntryId'], ...params })
                    } else {
                        data.push({ FID: d.FID, FTreeEntity: [{ FEntryId: d['FTreeEntity_FEntryId'], ...params }] })
                    }
                }
                return { status: true, data: data, msg: 'ok' }
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
</style>
