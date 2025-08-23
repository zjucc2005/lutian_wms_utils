<template>
    <uni-section title="处理进度" sub-title="选择文件需先解密" type="square" class="container">
        <progress :percent="progress_percent" show-info stroke-width="3" />
        <button type="primary" class="uni-mt-10" @click="choose_file">选择文件</button>
    </uni-section>
</template>

<script>
    import XLSX from 'xlsx'
    import { string_to_arraybuffer } from '@/utils'
    export default {
        data() {
            return {
                raw_data: [],
                done_data: [],
                raw_len: 1,
                done_len: 0
            }
        },
        computed: {
            progress_percent() {
                return (this.done_len * 100 / this.raw_len).toFixed()
            }
        },
        methods: {
            // import
            choose_file() {
                let _this_ = this
                uni.chooseFile({
                    count: 1,
                    extension: ['.xlsx', '.xls'],
                    success (res) {
                        this.raw_data = [] // init
                        this.done_data = [] // init
                        this.raw_data = 1
                        this.done_data = 0
                        let temp_file = res.tempFiles[0]
                        let extname = temp_file.name.split('.').pop()
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            let data = e.target.result
                            let book = XLSX.read(data, { type: 'binary' })
                            let sheet = book.Sheets[book.SheetNames[0]]
                            let sheet_data =  XLSX.utils.sheet_to_json(sheet, { header: 1 })
                            _this_.raw_data = sheet_data
                            _this_.raw_len = sheet_data.length
                            _this_.handle_data()
                            _this_.export_excel()
                        };
                        reader.readAsBinaryString(temp_file)
                    }
                })
            },
            // main logic
            handle_data() {
                let seq = 0
                for(let i=0;i < this.raw_data.length;i++) {
                    let row = this.raw_data[i]
                    if (i == 0) {
                        // 继承标题
                        this.done_data.push(['BOM层级(脚本处理)', ...row])
                    } else {
                        if (row[0] === '0') {
                            seq += 1
                            this.done_data.push([String(seq), ...row])
                        } else {
                            let arr = row[0].split('.')
                            arr[0] = seq
                            this.done_data.push([arr.join('.'), ...row])
                        }
                    }
                    this.done_len += 1
                }
            },
            // after handle
            export_excel() {
                let sheet = XLSX.utils.aoa_to_sheet(this.done_data)
                let book = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
                var book_output = XLSX.write(book, { bookType: 'xlsx', bookSST: true, type: 'binary'})
                const blob = new Blob([string_to_arraybuffer(book_output)], { type: "application/octet-stream" })
                // 下载
                let link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `BOM层级号转换_${Date.now()}.xlsx`
                link.click()
                URL.revokeObjectURL(link.href)
            }
        }
    }
</script>

<style>

</style>
