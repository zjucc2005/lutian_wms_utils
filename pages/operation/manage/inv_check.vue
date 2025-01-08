<template>
    <uni-notice-bar single scrollable text="盘点数量和账面数量一致时,可不填写盘点数量" />
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        class="above-uni-goods-nav"
        >
        <uni-table ref="table" class="table-sm" border stripe>
            <uni-tr>
                <uni-th align="center" width="140">物料编码</uni-th>
                <uni-th align="center" width="140">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center" width="106">库位</uni-th>
                <uni-th align="center" width="80">批次</uni-th>
                <uni-th align="center" width="40">单位</uni-th>
                <uni-th align="center" width="70">账面数量</uni-th>
                <uni-th align="center" width="70">盘点数量</uni-th>
                <uni-th align="center" width="70">盘盈盘亏</uni-th>
            </uni-tr>
            <uni-tr v-for="(inv, index) in check_invs_filtered" :key="index">
                <uni-td>{{ inv.material_no }}</uni-td>
                <uni-td>{{ inv.material_name }}</uni-td>
                <uni-td>{{ inv.material_spec }}</uni-td>
                <uni-td>{{ inv.stock_no }}</uni-td>
                <uni-td>{{ inv.batch_no }}</uni-td>
                <uni-td>{{ inv.base_unit_name }}</uni-td>
                <uni-td align="center">{{ inv.qty }}</uni-td>
                <uni-td align="center">{{ inv.check_qty }}</uni-td>
                <uni-td align="center">
                    <uni-icons v-if="inv.check_qty >= 0 && inv.qty === inv.check_qty" type="checkmarkempty" color="#808080" ></uni-icons>
                    <view v-if="inv.check_qty >= 0 && inv.qty < inv.check_qty" class="text-error">+{{ inv.check_qty - inv.qty }}</view>
                    <view v-if="inv.check_qty >= 0 && inv.qty > inv.check_qty" class="text-primary">-{{ inv.qty - inv.check_qty }}</view>
                </uni-td>
            </uni-tr>
        </uni-table>
    </uni-section>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    // #ifdef H5
    import { pdf_template_inv_check } from '@/gen_pdf'
    // #endif
    import { play_audio_prompt, string_to_arraybuffer } from '@/utils'
    import { BdMaterial, Inv, InvLog } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                step: 'export', // export,import
                only_different: false, // 只展示盘点有差异的行
                invs: [], // 即时库存
                check_invs: [], // 即时库存 -> 盘点库存
                goods_nav: {
                    options: [
                        { icon: 'circle', text: '盘盈盘亏' }
                    ],
                    button_group: [
                        {
                            text: '下载盘点模板',
                            backgroundColor: store.state.goods_nav_color.yellow,
                            color: '#fff'
                        },
                        {
                            text: '导入盘点数据',
                            backgroundColor: store.state.goods_nav_color.green,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        // onLoad(options) {
        //     const eventChannel = this.getOpenerEventChannel();
        //     eventChannel.on('sendInvs', res => {
        //         this.invs = res.invs
        //         this._init_check_invs()
        //         // console.log('this.invs', this.invs)
        //     })
        // },
        mounted() {
            this.$nextTick(_ => {
                if (!this.invs.length) {
                    uni.showLoading({ title: 'Loading' })
                    Inv.get_all({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                        uni.hideLoading()
                        this.invs = res
                        this._init_check_invs()
                    })
                }
            })
        },
        computed: {
            check_invs_filtered() {
                if (this.only_different) {
                    return this.check_invs.filter(x => x.qty != x.check_qty)
                } else {
                    return this.check_invs
                }
            }
        },
        methods: {
            goods_nav_click(e) {
                // btn:只展示盘盈盘亏
                if (e.index === 0) {
                    this.only_different = !this.only_different
                    if (this.only_different) {
                        this.goods_nav.options[0].icon = 'checkbox'
                        uni.showToast({ icon: 'none', title: '只显示盘盈盘亏' })
                    } else {
                        this.goods_nav.options[0].icon = 'circle'
                        uni.showToast({ icon: 'none', title: '显示全部' })
                    }
                }
            },
            goods_nav_button_click(e) {
                if (this.step === 'export') {
                    if (e.index === 0) this.check_template_download() // btn:盘点模板
                    if (e.index === 1) this.check_data_import() // btn:导入盘点数据
                }
                if (this.step === 'import') {
                    if (e.index === 0) this.back() // btn:返回
                    if (e.index === 1) this.if_submit_confirm() // btn:提交确认
                }
                
            },
            back() {
                this._activate_step('export')
                this._init_check_invs()
            },
            // 选择盘点模板
            check_template_download() {
                uni.showActionSheet({
                    itemList: ['盘点模板（打印用PDF）', '盘点模板（导入用Excel）'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            this.check_template_pdf()
                        }
                        if (e.tapIndex === 1) {
                            this.check_template_excel()
                        }
                    }
                })
            },
            check_template_pdf() {
                let url = pdf_template_inv_check(this.invs)
                uni.navigateTo({ url: `/pages/my/preview_pdf?url=${url}` }) // 打开预览页面
            },
            check_template_excel() {
                let sheet_data = [
                    ['物料编码', '物料名称', '规格型号', '库位', '批次', '单位', '账面数量', '盘点数量']
                ]
                for (let inv of this.invs) {
                    sheet_data.push(
                        [
                            inv['FMaterialId.FNumber'], inv['FMaterialId.FName'],inv['FMaterialId.FSpecification'],
                            inv['FStockLocId.FNumber'], inv.FBatchNo, inv['FStockUnitId.FName'], inv.FQty, ''
                        ]
                    )
                }
                let sheet = XLSX.utils.aoa_to_sheet(sheet_data)
                let book = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
                var book_output = XLSX.write(book, { bookType: 'xlsx', bookSST: true, type: 'binary'})
                const blob = new Blob([string_to_arraybuffer(book_output)], { type: "application/octet-stream" })
                // 下载
                let link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `库存盘点模板_${Date.now()}.xlsx`
                link.click()
                URL.revokeObjectURL(link.href)
            },
            // 导入盘点数据
            check_data_import() {
                let _this_ = this
                uni.chooseFile({
                    count: 1,
                    extension: ['.xlsx', '.xls'],
                    success (res) {
                        let temp_file = res.tempFiles[0]
                        let extname = temp_file.name.split('.').pop()
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            let data = e.target.result
                            let book = XLSX.read(data, { type: 'binary' })
                            let sheet = book.Sheets[book.SheetNames[0]]
                            let sheet_data =  XLSX.utils.sheet_to_json(sheet, { header: 1 })
                            uni.showLoading({ title: '解析数据...' })
                            _this_._merge_check_invs(sheet_data)
                            _this_._activate_step('import')
                            uni.hideLoading()  
                        };
                        reader.readAsBinaryString(temp_file)
                    }
                })
            },
            if_submit_confirm() {
                uni.showModal({
                    title: "确认盘点结果",
                    content: "提交确认后，系统会根据盘点结果更新账面数据。",
                    success: (res) => {
                        if (res.confirm) {
                            play_audio_prompt('success')
                            this.submit_confirm()
                        }
                    }
                })
            },
            async submit_confirm() {
                let check_invs = this.check_invs.filter(x => x.qty != x.check_qty)
                if (check_invs.length === 0) {
                    uni.showToast({ icon: 'none', title: '库存数量无误' })
                    return
                }
                uni.showLoading({ title: '更新库存...' })
                for (let check_inv of check_invs) {
                    let options = {
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: check_inv.stock_no,
                        FMaterialId: check_inv.material_id,
                        FOpQTY: Math.abs(check_inv.qty - check_inv.check_qty),
                        FBatchNo: check_inv.batch_no,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                        FRemark: '库存盘点'
                    }
                    if (check_inv.qty > check_inv.check_qty) {
                        options.FOpType = 'sub'
                    } else if (check_inv.qty < check_inv.check_qty) {
                        options.FOpType = 'add'
                    }
                    // cond - 新增物料种类（不在账上）时，查询物料基础数据
                    if (!options.FMaterialId) {
                        let bd_material_res = await BdMaterial.query({ FNumber: check_inv.material_no, FUseOrgId: store.state.cur_stock.FUseOrgId })
                        if (bd_material_res.data) {
                            options.FMaterialId = bd_material_res.data[0].FMaterialId
                        }
                    }
                    // console.log('options', options)
                    let inv_log = new InvLog(options)
                    await inv_log.save()
                }
                uni.hideLoading()
                uni.showToast({ title: '更新库存成功' })
                uni.navigateBack({ delta: 2 })
            },
            _init_check_invs() {
                let check_invs = []
                for (let inv of this.invs) {
                    check_invs.push({
                        material_id: inv.FMaterialId,
                        material_no: inv['FMaterialId.FNumber'],
                        material_name: inv['FMaterialId.FName'],
                        material_spec: inv['FMaterialId.FSpecification'],
                        stock_no: inv['FStockLocId.FNumber'],
                        batch_no: inv.FBatchNo,
                        base_unit_name: inv['FStockUnitId.FName'],
                        qty: inv.FQty
                    })
                }
                this.check_invs = check_invs
            },
            // 结合即时库存展示盘盈盘亏
            _merge_check_invs(sheet_data) {
                if (sheet_data[0][0] == '物料编码') sheet_data.shift() // 移除表头
                let check_invs = []
                for (let inv of this.invs) {
                    let check_inv = {
                        material_id: inv.FMaterialId,
                        material_no: inv['FMaterialId.FNumber'],
                        material_name: inv['FMaterialId.FName'],
                        material_spec: inv['FMaterialId.FSpecification'],
                        stock_no: inv['FStockLocId.FNumber'],
                        batch_no: inv.FBatchNo,
                        base_unit_name: inv['FStockUnitId.FName'],
                        qty: inv.FQty,
                        check_qty: inv.FQty // 未填写盘点数量的行，默认和账面相同；
                    }
                    let row = sheet_data.find(x => x[0] == inv['FMaterialId.FNumber'] && x[3] == inv['FStockLocId.FNumber'] && x[4] == inv.FBatchNo)
                    if (row) {
                        if (row[7]) check_inv.check_qty = parseFloat(row[7])
                        row[8] = true // 标记为已check，sheet_data遍历时跳过该行
                    }
                    check_invs.push(check_inv)
                }
                for (let row of sheet_data.filter(x => x[0] && !x[8])) {
                    let _inv = this.invs.find(inv => inv['FMaterialId.FNumber'] == row[0].trim())
                    let check_inv = {
                        material_id: _inv?.FMaterialId, // 继承已有物料的相关数据
                        material_no: row[0].trim(),
                        material_name: row[1],
                        material_spec: row[2],
                        stock_no: row[3],
                        batch_no: row[4] || _inv?.FBatchNo || formatDate(Date.now(), 'yyyyMMdd'), // 批次赋值优先级，指定 > 继承 > 当天
                        base_unit_name: row[5],
                        qty: 0,
                        check_qty: parseFloat(row[7])
                    }
                    row[8] = true
                    check_invs.push(check_inv)
                }
                check_invs.sort((x, y) => x.material_no < y.material_no ? -1 : 1)
                this.check_invs = check_invs
            },
            _activate_step(step) {
                this.step = step
                if (this.step == 'import') {
                    this.goods_nav.button_group[0] = { text: '返回', backgroundColor: store.state.goods_nav_color.grey, color: '#fff' }
                    this.goods_nav.button_group[1] = { text: '提交确认', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                }
                if (this.step == 'export') {
                    this.goods_nav.button_group[0] = { text: '下载盘点模板', backgroundColor: store.state.goods_nav_color.yellow, color: '#fff' }
                    this.goods_nav.button_group[1] = { text: '导入盘点数据', backgroundColor: store.state.goods_nav_color.green, color: '#fff' }
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
</style>
