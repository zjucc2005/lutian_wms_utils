<template>
    <uni-notice-bar single scrollable text="本功能建议仅在初始化库存时使用" />
    <uni-section title="期初库存(草稿)" type="square"
        class="above-uni-goods-nav">
        <uni-table ref="new_invs" border stripe class="new-invs">
            <uni-tr>
                <uni-th align="center" width="60">物料ID</uni-th>
                <uni-th align="center" width="80">物料编号</uni-th>
                <uni-th align="center" width="80">库位</uni-th>
                <uni-th align="center" width="60">数量</uni-th>
                <uni-th align="center">批次</uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in new_invs" :key="index">
                <uni-td align="center">
                    {{ item.material_id }}
                </uni-td>
                <uni-td align="center">
                    {{ item.material_no }}
                </uni-td>
                <uni-td align="center">
                    {{ item.loc_no }}
                </uni-td>
                <uni-td align="center">
                    {{ item.qty }}
                </uni-td>
                <uni-td align="center">
                    {{ item.batch_no }}
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
            @button-click="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import { InvLog } from '@/utils/model'
    import { get_bd_material } from '@/utils/api'
    export default {
        data() {
            return {
                bd_materials: [],
                is_valid: false,
                new_invs: [
                    // { material_no: '3.07.03.15.0014', loc_no: 'XFC-A01-011', qty: 60, batch_no: '20241001' }
                ],
                // raw_data: 
                // `3.01.01.01.07.0075	133
                //  3.01.01.01.07.0075	179`,
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' },
                    ],
                    button_group: [
                        {
                            text: '读取文件',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        },
                        {
                            text: '获取物料ID',
                            backgroundColor: store.state.goods_nav_color.yellow,
                            color: '#fff'
                        },
                        
                        {
                            text: '确认导入',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data) // btn:刷新
            },
            goods_nav_button_click(e) {
                // if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 0) this.open_excel() // btn:读取excel + 验证补全
                if (e.index === 1) this.validate_data() //btn:预处理数据，获取物料ID
                if (e.index === 2) this.import_data() // btn:确认提交
                // if (e.index === 0) this.validate_data() // btn:数据校验
                // if (e.index === 1) this.if_import_data() // btn:导入
                // if (e.index === 2) this.handle_raw_data() // btn:处理raw data
            },
            // if_import_data() {
            //     uni.showModal({
            //         title: '导入',
            //         content: '是否确定导入当前表格中的期初库存信息？',
            //         success: (res) => {
            //             if (res.confirm) this.import_data()
            //         },
            //         fail: (err) => {}
            //     })
            // },
            // 导入盘点数据
            open_excel() {
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
                            // _this_._merge_check_invs(sheet_data)
                            _this_.handle_sheet_data(sheet_data)
                            uni.hideLoading()  
                        };
                        reader.readAsBinaryString(temp_file)
                    }
                })
            },
            async handle_sheet_data(sheet_data) {
                if (sheet_data[0][0] == 'LOC_NO') sheet_data.shift() // 移除表头
                let new_invs = []
                for (let row of sheet_data) {
                    
                    new_invs.push({
                        material_id: 0,
                        material_no: row[1],
                        loc_no: `NX3-${row[0]}`,
                        qty: row[4],
                        batch_no: '20250121'
                    })
                }
                this.new_invs = new_invs
            },
            // async handle_raw_data() {
            //     let arr = this.raw_data.split('\n').map(x => x.trim())
            //     this.$logger.info('raw_data', arr)
            //     this.$logger.info('stock_locs', store.state.stock_locs)
            //     let pre_data = [] // 预处理数据
            //     let cur_loc_no = 'NX3-B01-101' // 起点库位
            //     let qty_limit = 60 // 库位放置库存数限制
            //     for (let i = 0; i < arr.length; i++) {
            //         let item_arr = arr[i].split('\t')
            //         let material_no = item_arr[0]
            //         let res = await get_bd_material(material_no, store.state.cur_stock.FUseOrgId)
            //         let material_id = res.data[0]?.FMaterialId
            //         let qty = Number(item_arr[1])
            //         let times = Math.ceil(qty / 60) // 循环次数
            //         let rest_qty = qty
            //         for (let j = 0; j < times; j++) {
            //             pre_data.push({
            //                 material_no,  material_id,
            //                 qty: j < times - 1 ? 60 : qty - j * 60,
            //                 loc_no: cur_loc_no,
            //                 batch_no: '20241017'
            //             })
            //             cur_loc_no = this._next_loc_no(cur_loc_no)
            //         }
            //         uni.showToast({ icon: 'none', title: `${i+1}/${arr.length}` })
            //     }
            //     this.new_invs = pre_data
            //     this.$logger.info('pre_data', pre_data)
            // },
            // _next_loc_no(loc_no) {
            //     let index = store.state.stock_locs.findIndex(x => x.FNumber == loc_no)
            //     return store.state.stock_locs[index + 1]?.FNumber || store.state.stock_locs[0].FNumber
            // },
            // 加载/验证物料编号
            async validate_data() {
                let is_valid = true
                this.$logger.info('stock_locs', store.state.stock_locs)
                for (var i = 0; i < this.new_invs.length; i++) {
                    let new_inv = this.new_invs[i]
                    let bd_material = this.bd_materials.find(x => x.FNumber == new_inv.material_no)
                    if (bd_material) {
                        new_inv.material_id = bd_material.FMaterialId
                    } else {
                        let res = await get_bd_material(new_inv.material_no, store.state.cur_stock.FUseOrgId)
                        if (res.data[0]) {
                            new_inv.material_id = res.data[0]?.FMaterialId
                            this.bd_materials.push(res.data[0])
                        } else {
                            is_valid = false
                            this.$logger.info(`>>> validate: 物料编号 ${new_inv.material_no} 未找到`)
                            break
                        }
                    }
                    let stock_loc = store.state.stock_locs.find(x => x.FNumber == new_inv.loc_no)
                    if (!stock_loc) {
                        is_valid = false
                        this.$logger.info(`>>> validate: 库位编号 ${new_inv.loc_no} 未找到`)
                        break
                    }
                }
                this.is_valid = is_valid
            },
            async import_data() {
                // return
                // uni.showLoading({ title: 'Loading' })
                for (var i = 0; i < this.new_invs.length; i++) {
                    let new_inv = this.new_invs[i]
                    let inv_log = new InvLog({
                        FOpType: 'in',
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: new_inv.loc_no,
                        FMaterialId: new_inv.material_id,
                        FOpQTY: new_inv.qty,
                        FBatchNo: new_inv.batch_no,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                        FRemark: '期初库存'
                    })
                    await inv_log.save()
                    // uni.hideLoading() 
                    uni.showToast({ icon: 'none', title: `${i+1}/${this.new_invs.length}` })
                }
                this.new_invs = []
            },
        }
    }
</script>

<style lang="scss">
    .new-invs {
        table {
            min-width: 0 !important;
        }
    }
</style>
