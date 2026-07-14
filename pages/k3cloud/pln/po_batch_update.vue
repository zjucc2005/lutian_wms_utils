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
    
    <uni-section title="粘贴板" type="square">
        <view class="container">
            <uni-easyinput v-model="clipboard" type="textarea" :maxlength="-1" class="uni-mb-5" />
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
    import { BdMaterial } from '@/utils/model'
    
    export default {
        data() {
            return {
                clipboard: '',
                raw_data: [],
                done_data: [],
                response_result: [],
                table_head: ['单据编号', '物料编码', '交货日期'],
                table_desc: [
                    '示例：POJ260400001',
                    '示例：0.0.0.0001', 
                    '示例：2026/4/5(日期格式)'
                ],
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
                    XLSX.writeFile(book, '物料批改模板.xlsx', { compression: true });
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
                try {
                    let x_start_time = Date.now()
                    uni.showLoading({ title: 'Loading' })
                    let request_body = await this.get_request_body()
                    let res = await BdMaterial.batch_update(request_body)
                    if (!res.data.Result.ResponseStatus.IsSuccess) {
                        this.response_result.push({ i: 0, msg: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                    uni.hideLoading()
                    uni.showModal({ title: '执行完毕', content: `执行耗时 ${(Date.now() - x_start_time) / 1000} 秒` })
                } catch (err) {
                    this.$logger.info('submit_batch_update err', err)
                }
            },
            async get_request_body() {
                let res = []
                this.response_result = []
                // 归集物料号，1000个每组查询
                let material_nos = new Set()
                for (let row of this.raw_data) {
                    let material_no = row[0]?.trim()
                    if (material_no) material_nos.add(material_no)
                }
                material_nos = Array.from(material_nos)
                let materials = [] // 物料数据
                let step = 1000
                for (let i = 0; i < material_nos.length; i += step) {
                    let q_nos = material_nos.slice(i, i + step)
                    let mat_res = await BdMaterial.query({ FNumber_in: q_nos, 'FUseOrgId.FNumber': '100' }, { fields: ['FMaterialId', 'FNumber', 'FUseOrgId.FNumber', 'FIssueType'] })
                    for (let d of mat_res.data) materials.push(d)
                }
                for (let i = 0; i < this.raw_data.length; i++) {
                    let row = this.raw_data[i]
                    if (row[0]?.trim()) {
                        let material = materials.find(m => m.FNumber == row[0].trim())
                        if (material) {
                            let obj = { FMaterialId: material.FMaterialId, SubHeadEntity1: {}, SubHeadEntity5: {} }
                            if ((row[1] || [0, '0'].includes(row[1]))) { // 安全库存
                                obj.SubHeadEntity1.FSafeStock = row[1]
                            }
                            res.push(obj)
                        } else {
                            this.response_result.push({ i: i+1, msg: `未找到物料编码[${row[0]}]` })
                        }
                    } else {
                        this.response_result.push({ i: i+1, msg: '子项物料编码不能为空'  })
                    }
                }
                return res
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
