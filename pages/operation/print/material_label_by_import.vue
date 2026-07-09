<template>
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
            <view class="text-grey text-sm uni-mb-5">注意！如果想要把某字段的值清空，请在对应单元格内填写数字0；如果该字段不允许修改为空，则会忽略；</view>
            
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
    
    <uni-section title="粘贴板" type="square">
        <view class="container">
            <uni-easyinput v-model="clipboard" type="textarea" :maxlength="-1" class="uni-mb-5" />
            <button type="primary" size="mini" @click="handle_clipboard">提交</button>
            <button size="mini" @click="clipboard=''" class="uni-ml-5">清空</button>
        </view>
    </uni-section>
    
    <canvas ref="qrcode" id="qrcode" canvas-id="qrcode" style="visibility: hidden; width: 400px; height: 400px;"></canvas>
</template>

<script>
    import XLSX from 'xlsx'
    import store from '@/store'
    import { formatDate } from '@/utils';
    import UQRCode from '@/uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js';
    // #ifdef H5
    import { gen_pdf_material_label_batch } from '@/gen_pdf'
    // #endif
    
    export default {
        data() {
            return {
                clipboard: '',
                qr_content: 'one',
                raw_data: [],
                done_data: [],
                response_result: [],
                table_head: ['物料编码', '物料名称', '规格型号', '属性', '单位', '单托数量', '打印张数'],
                table_desc: [
                    '示例：2.01.05.01.0001', 
                    '示例：箱体-金加工',
                    '示例：156F  有孔',
                    '示例：自制',
                    '示例：PCS',
                    '示例：400',
                    '示例：8'
                ]
            }
        },
        mounted() {
        },
        methods: {
            async debug () {
                this.$logger.info('>>>', this.$data)
                let res = await this.gen_qrcode('hello world')
                console.log('>>> res', res)
                // let uqr = new UQRCode();
                // uqr.data = "https://uqrcode.cn/doc";
                // uqr.size = 400;
                // // uqr.useDynamicSize = true;
                // uqr.make();
                // var canvasContext = uni.createCanvasContext('qrcode', this); // 如果是组件，this必须传入
                // uqr.canvasContext = canvasContext;
                // uqr.drawCanvas();
                // uni.canvasToTempFilePath({
                //     canvasId: 'qrcode',
                //     success: res => {
                //         console.log('>>> uni.canvasToTempFilePath success', res)
                //     }
                // })
                // console.log('uqr', uqr)
                // console.log('canvas', this.$refs.qrcode)
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
                    XLSX.writeFile(book, '物料标签批量导入模板.xlsx', { compression: true });
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
                    let t = formatDate(Date.now(), 'yyyy-MM-dd')
                    for (let d of this.raw_data) {
                        if (d[6] > 0) {
                            done_data.push({
                                no: d[0], name: d[1], spec: d[2], supplier: '', 
                                inbound_time: t , print_copies: d[6]
                            })
                        }
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
            // async gen_qrcode(text) {
            //     // #ifdef APP-PLUS
            //         return ''
            //     // #endif
            //     // #ifdef H5
            //         let canvas = await QRCode.toCanvas(text, { margin: 0, errorCorrectionLevel: 'M' })
            //         return canvas.toDataURL()
            //     // #endif
            // },
            async gen_label() {
                // #ifdef H5
                    for (let d of this.done_data) {
                        d._qr = await this.gen_qrcode(d.no)
                    }
                    let url = gen_pdf_material_label_batch(this.done_data)
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
