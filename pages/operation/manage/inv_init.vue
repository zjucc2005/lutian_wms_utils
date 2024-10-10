<template>
    <uni-notice-bar single scrollable text="本功能建议仅在初始化库存时使用" />
    <uni-section title="期初库存(草稿)" type="square"
        class="above-uni-goods-nav">
        <uni-table ref="new_invs" border stripe class="new-invs">
            <uni-tr>
                <uni-th align="center" width="80">物料编号</uni-th>
                <uni-th align="center" width="80">库位</uni-th>
                <uni-th align="center" width="60">数量</uni-th>
                <uni-th align="center">批次</uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in new_invs" :key="index">
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
            @click="goods_nav_click"
            @button-click="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { get_bd_material } from '@/utils/api'
    export default {
        data() {
            return {
                bd_materials: [],
                is_valid: false,
                new_invs: [
                    { material_no: '3.07.03.15.0014', loc_no: 'XFC-A01-011', qty: 60, batch_no: '20241001' },
                    { material_no: '3.07.03.15.0014', loc_no: 'XFC-A01-012', qty: 60, batch_no: '20241001' },
                    { material_no: '3.07.03.15.0014', loc_no: 'XFC-A01-013', qty: 60, batch_no: '20241001' },
                    { material_no: '3.07.03.02.0009', loc_no: 'XFC-A01-021', qty: 60, batch_no: '20241001' },
                    { material_no: '3.08.02.01.13.0001', loc_no: 'XFC-A01-015', qty: 60, batch_no: '20241001' }
                ],
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' },
                    ],
                    button_group: [
                        {
                            text: '数据校验',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '导入',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
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
                if (e.index === 0) console.log('this.$data', this.$data) // btn:刷新
            },
            goods_nav_button_click(e) {
                // if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 0) this.validate_data() // btn:数据校验
                if (e.index === 1) this.if_import_data() // btn:导入
            },
            if_import_data() {
                uni.showModal({
                    title: '导入',
                    content: '是否确定导入当前表格中的期初库存信息？',
                    success: (res) => {
                        if (res.confirm) this.import_data()
                    },
                    fail: (err) => {}
                })
            },
            // async load_bd_materials() {
            //     uni.showLoading({ title: 'Loading' })
            //     return get_all_bd_materials(store.state.cur_stock.FUseOrgId).then(res => {
            //         uni.hideLoading()
            //         this.bd_materials = res
            //     })
            // },
            // 加载/验证物料编号
            async validate_data() {
                let is_valid = true
                
                console.log('stock_locs', store.state.stock_locs)
                
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
                            console.log(`>>> validate: 物料编号 ${new_inv.material_no} 未找到`)
                            break
                        }
                    }
                    let stock_loc = store.state.stock_locs.find(x => x.FNumber == new_inv.loc_no)
                    if (!stock_loc) {
                        is_valid = false
                        console.log(`>>> validate: 库位编号 ${new_inv.loc_no} 未找到`)
                        break
                    }
                }
                this.is_valid = is_valid
            },
            async import_data() {
                console.log('this.$data', this.$data)
                return
                uni.showLoading({ title: 'Loading' })
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
                    uni.hideLoading()
                    this.new_invs = []
                }
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
