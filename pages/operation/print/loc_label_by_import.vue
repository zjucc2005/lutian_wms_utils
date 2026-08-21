<template>
    <canvas ref="qrcode" id="qrcode" canvas-id="qrcode" class="canvas-hidden"></canvas>
    <uni-section title="Excel模板样例" type="square" @click="debug">
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
            
            <view class="uni-mb-5">
                <uni-icons type="download-filled" size="18" color="#007aff"></uni-icons>
                <text class="text-link" @click="download_template">下载导入模板</text>
            </view>
            <view>
                <button type="primary" size="mini" @click="choose_file">选择文件</button>
                <view class="text-grey text-sm">注意！选择文件需先解密</view>
            </view>
        </view>
    </uni-section>
    
    <uni-section title="打印模板" type="square">
        <view class="container">
            <uni-data-checkbox v-model="format" mode="button"
                :localdata="[
                    { text: '70x100 竖版', value: '70x100' },
                    { text: '100x50 横版', value: '100x50' }
                ]"
            ></uni-data-checkbox>
        </view>
    </uni-section>
    
    <uni-section title="粘贴板" type="square">
        <view class="container">
            <uni-easyinput v-model="clipboard" type="textarea" :maxlength="-1" class="uni-mb-5" />
            <button type="primary" size="mini" @click="handle_clipboard">提交</button>
            <button size="mini" @click="clipboard=''" class="uni-ml-5">清空</button>
        </view>
    </uni-section>
</template>

<script>
    import XLSX from 'xlsx'
    import store from '@/store'
    import { formatDate } from '@/utils';
    import UQRCode from '@/uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js';
    // #ifdef H5
    import { gen_pdf_loc_label_batch } from '@/gen_pdf'
    // #endif
    
    export default {
        data() {
            return {
                clipboard: '',
                format: '70x100',
                raw_data: [],
                done_data: [],
                table_head: ['库位号'],
                table_desc: [
                    '示例：3LM-QY-A01-01-01'
                ]
            }
        },
        mounted() {
        },
        methods: {
            async debug () {
                this.$logger.info('>>>', this.$data)
            },
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
                    XLSX.writeFile(book, '库位标签批量导入模板.xlsx', { compression: true });
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
                            _this_.handle_raw_data()
                        };
                        reader.readAsBinaryString(temp_file)
                    }
                })
            },
            async handle_clipboard() {
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: 'APP不支持该功能' })
                    return
                // #endif
                let rows = this.clipboard.split('\n')
                let raw_data = []
                for (let row of rows) {
                    if (row) raw_data.push(row.split('\t'))
                }
                this.raw_data = raw_data
                this.handle_raw_data()
            },
            handle_raw_data () {
                uni.showLoading({ title: '读取数据...' })
                setTimeout(_ => {
                    let done_data = []
                    for (let d of this.raw_data) {
                        done_data.push({ no: d[0] })
                    }
                    this.done_data = done_data
                    this.gen_label()
                    uni.hideLoading()
                }, 1000)
                
            },
            async gen_qrcode(text) {
                return new Promise((resolve, reject) => {
                    let uqr = new UQRCode();
                    uqr.data = text;
                    uqr.size = 400;
                    uqr.make();
                    var canvasContext = uni.createCanvasContext('qrcode', this); // 如果是组件，this必须传入
                    uqr.canvasContext = canvasContext;
                    uqr.drawCanvas();
                    uni.canvasToTempFilePath({
                        canvasId: 'qrcode',
                        success: res => {
                            resolve(res.tempFilePath)
                        }
                    })
                })
            },
            async gen_label() {
                // #ifdef H5
                    for (let d of this.done_data) {
                        d._qr = await this.gen_qrcode(d.no)
                    }
                    
                    let url = gen_pdf_loc_label_batch( { format: this.format, labels: this.done_data })
                    window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=800,height=600') // 打开小窗口
                // #endif
                // #ifdef APP-PLUS
                    uni.showModal({ title: '提示', content: '仅PC端支持打印' })
                // #endif
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
