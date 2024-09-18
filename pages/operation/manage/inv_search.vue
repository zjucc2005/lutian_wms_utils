<template>
    <uni-section title="查询结果" type="line"
        :sub-title="set_section_sub_title()"
    >
        <view v-if="mode == 'material_no'">
            <uni-collapse v-if="display_mode == 'grid'" :open="true">
                <uni-collapse-item v-for="shelf in grid_shelves.filter(shelf => !shelf.disabled)" :title="shelf.name" :open="true" title-border="show">
                    <view class="content">
                        <swiper :indicator-dots="true" :style="{ height: `${get_swiper_height(shelf)}px` }" class="shelf_swiper">
                            <swiper-item v-for="page in get_swiper_pages(shelf)" :key="page">
                                <uni-grid :column="10" :show-border="false">
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
            
            <uni-list v-if="display_mode == 'list'">
                <uni-list-item
                    v-for="(inv, index) in invs"
                    :key="index"
                    :title="inv['FStockLocId.FNumber']"
                    :note="inv.FBatchNo"
                    :rightText="[inv.FQty, inv['FStockUnitId.FName']].join(' ')"
                >
                </uni-list-item>
            </uni-list>
        </view>
        <view v-if="mode == 'loc_no'">
            <uni-list v-if="display_mode == 'list'">
                <uni-list-item
                    v-for="(inv, index) in invs"
                    :key="index"
                    :title="inv['FMaterialId.FNumber']"
                    :note="[inv['FMaterialId.FName'], inv['FMaterialId.FSpecification'], `批次号：${inv.FBatchNo}`].join('\n')"
                    :rightText="[inv.FQty, inv['FStockUnitId.FName']].join(' ')"
                >
                </uni-list-item>
            </uni-list>
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
    import { get_bd_material } from '@/utils/api'
    import { Inv, StockLoc } from '@/utils/model'
    import { is_material_no_format, is_loc_no_std_format, parse_stock_locs_with_invs, filter_swiper_grids, get_swiper_pages, get_swiper_height } from '@/utils'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        props: {
            t: {
                type: String
            }
        },
        data() {
            return {
                mode: '', // material_no/loc_no
                display_mode: '', // grid/list
                no: '',                
                material: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    base_unit_name: ''
                },
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
                            text: '列表显示',
                            backgroundColor: 'linear-gradient(90deg, #AAA, #606266)',
                            color: '#fff'
                        },
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
            this.stock_locs = store.state.stock_locs
            if (options.t) this.handle_scan_result(options.t)
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
                if (e.index === 0) this.switch_display_mode() // btn:切换显示
                if (e.index === 1) this.scan_code() // btn:扫码
            },
            // >>> action
            set_section_sub_title() {
                let text_list = []
                if (this.mode == 'material_no') {
                    text_list = [ 
                        this.material.material_no, 
                        this.material.material_name, 
                        this.material.material_spec,
                        `计量单位：${this.material.base_unit_name}`
                    ]
                } else if (this.mode == 'loc_no') {
                    text_list = [ `库位号：${this.no}` ]
                }
                return text_list.join('\n')
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
            switch_display_mode() {
                if (this.mode == 'loc_no') {
                    uni.showToast({ icon: 'none', title: '不支持网格显示' })
                    return
                }
                this.set_display_mode(this.display_mode == 'grid' ? 'list' : 'grid')               
            },
            set_display_mode(display_mode) {
                this.display_mode = display_mode
                if (display_mode == 'grid') {
                    this.goods_nav.button_group[0].text = '列表显示'
                } else if (display_mode == 'list') {
                    this.goods_nav.button_group[0].text = '网格显示'
                }
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') this.handle_scan_code(res.result)
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        this.handle_scan_code(res.result)
                    }
                });
                // #endif
            },
            handle_scan_code(text) {
                console.log('handle scan result:', text)
                if (!text) return
                if (this.stock_locs.length) {
                    this.case_load_invs(text.trim())
                } else {
                    StockLoc.query({ FStockId: this.cur_stock.FStockId }).then(res => {
                        this.stock_locs = res.data
                        this.case_load_invs(text.trim())
                    })
                }                              
            },
            case_load_invs(text) {
                if (is_material_no_format(text)) {
                    this.load_invs_by_material_no(text)
                    this.load_material(text)
                } else if (is_loc_no_std_format(text)) {
                    this.load_invs_by_loc_no(text)
                } else {
                    this.invs = []
                    this.mode = ''
                    this.no = ''
                    this.grid_shelves = []
                    uni.showToast({ icon: 'none', title: '未知格式的编码' })
                }
            },
            load_material(material_no) {
                this.material = { material_no: material_no }
                get_bd_material(material_no, this.cur_stock.FUseOrgId).then(res => {
                    if (res.data[0]) {
                        let bd_material = res.data[0]
                        this.material = {
                            material_no: bd_material.FNumber,
                            material_name: bd_material.FName,
                            material_spec: bd_material.FSpecification,
                            base_unit_name: bd_material['FBaseUnitId.FName']
                        }
                    }
                })
            },
            load_invs_by_material_no(material_no) {
                Inv.query({
                    FStockId: this.cur_stock.FStockId,
                    'FMaterialId.FNumber': material_no,
                    FQty_gt: 0 }, {}
                ).then(res => { 
                    this.invs = res.data
                    this.mode = 'material_no'
                    this.set_display_mode('grid')
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
                    this.set_display_mode('list')
                    this.no = loc_no
                })
            }
        }
    }
</script>

<style>

</style>
