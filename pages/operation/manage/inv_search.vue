<template>
    <uni-section title="查询结果" type="line"
        :sub-title="no ? `${ {material_no: '物料编码', loc_no: '库位编码'}[mode] } ${no}` : ''"
    >
        <view v-if="mode == 'material_no'">
            <uni-collapse :open="true">
                <uni-collapse-item v-for="shelf in grid_shelves" :title="shelf.name" :open="true" title-border="show">
                    <view class="content">
                        <swiper :indicator-dots="true" :style="{ height: `${get_swiper_height(shelf)}px` }" class="shelf_swiper">
                            <swiper-item v-for="page in get_swiper_pages(shelf)" :key="page">
                                <uni-grid :column="10">
                                    <uni-grid-item
                                        v-for="grid in filter_swiper_grids(shelf, page)"
                                        :key="grid.index"
                                        :index="grid.index"
                                    >
                                        <view :class="['grid-item-box', grid.style]">
                                            <view class="name">{{ grid.name }}</view>
                                            <view v-if="grid.qty" class="qty">{{ grid.qty }}</view>
                                        </view>
                                    </uni-grid-item>
                                </uni-grid>
                            </swiper-item>
                        </swiper>
                    </view>
                </uni-collapse-item>
            </uni-collapse>
        </view>
        <view v-if="mode == 'loc_no'">
            查询库位编码结果，建设中...
        </view>
    </uni-section>
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { Inv, StockLoc } from '@/utils/model'
    import { is_material_no_format, is_loc_no_std_format, parse_stock_locs_with_invs, filter_swiper_grids, get_swiper_pages, get_swiper_height } from '@/utils'
    export default {
        data() {
            return {
                mode: '', // material_no/loc_no
                no: '',
                cur_stock: {},
                stock_locs: [],
                grid_shelves: [],
                invs: [],
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '更多' }
                    ],
                    button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad(options) {
            console.log('onLoad options:', options)
            // if (options.t) this.handle_scan_result(options.t.trim()) // options.t 是从上一个页面扫描传过来的参数
            this.cur_stock = store.state.cur_stock
            this.handle_scan_result('3.04.01.01.03.0019')
        },
        mounted() {
            
        },
        methods: {
            filter_swiper_grids,
            get_swiper_pages,
            get_swiper_height,
            // >>> component
            goods_nav_click(e) {
                if (e.index === 0) this.more_actions() // btn:更多
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
            },
            more_actions() {
                uni.showActionSheet({
                    itemList: ['扫描物料编码查询', '扫描库位编码查询', 'DEBUG'],
                    success: (e) => {
                        console.log('showActionSheet e:', e)
                        if (e.tapIndex === 0) {}
                        if (e.tapIndex === 1) {}
                        if (e.tapIndex === 2) console.log('this.$data:', this.$data)
                    }
                })
            },
            scan_code() {
                uni.scanCode({
                    success: (res) => {
                        this.handle_scan_result(res.result)
                    }
                })
            },
            handle_scan_result(text) {
                console.log('handle scan result:', text)
                if (!text) return
                if (this.stock_locs.length) {
                    this.case_load_invs(text)
                } else {
                    StockLoc.query({ FStockId: this.cur_stock.FStockId }).then(res => {
                        this.stock_locs = res.data
                        this.case_load_invs(text)
                    })
                }                              
            },
            case_load_invs(text) {
                if (is_material_no_format(text)) {
                    this.load_invs_by_material_no(text)
                } else if (is_loc_no_std_format(text)) {
                    this.load_invs_by_loc_no(text)
                } else {
                    this.invs = []
                    this.mode = ''
                    this.no = ''
                    this.grid_shelves = []
                    uni.showToast({ icon: 'error', title: '未知格式的编码' })
                }
            },
            load_invs_by_material_no(material_no) {
                Inv.query({
                    FStockId: this.cur_stock.FStockId,
                    'FMaterialId.FNumber': material_no,
                    FQty_gt: 0 }, {}
                ).then(res => { 
                    this.invs = res.data
                    this.mode = 'material_no'
                    this.no = material_no
                    this.grid_shelves = parse_stock_locs_with_invs(this.stock_locs, this.invs)
                })
            },
            load_invs_by_loc_no(loc_no) {
                Inv.query({
                    FStockId: this.cur_stock.FStockId,
                    'FStockLocId.FNumber': loc_no,
                    FQty_gt: 0 }, {}
                ).then(res => { 
                    this.invs = res.data
                    this.mode = 'loc_no'
                    this.no = loc_no
                })
            }
        }
    }
</script>

<style>

</style>
