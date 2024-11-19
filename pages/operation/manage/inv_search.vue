<template>
    <uni-section title="查询结果" type="square"
        :sub-title="set_section_sub_title()"
        class="above-uni-goods-nav"
        >
        <uni-collapse v-if="display_mode == 'grid'" :open="true">
            <cc-shelf
                :stock_locs="$store.state.stock_locs"
                :invs="invs"
                only-inv
                open />
        </uni-collapse>
            
        <uni-list v-if="mode == 'material_no' && display_mode == 'list'">
            <uni-list-item
                v-for="(inv, index) in invs"
                :key="index"
                :title="inv['FStockLocId.FNumber']"
                :note="`批次：${inv.FBatchNo}`"
                :rightText="[inv.FQty, inv['FStockUnitId.FName']].join(' ')"
                >
            </uni-list-item>
        </uni-list>
        
        <uni-list v-if="mode == 'loc_no' && display_mode == 'list'">
            <uni-list-item
                v-for="(inv, index) in invs"
                :key="index"
                :title="inv['FMaterialId.FNumber']"
                :note="[
                    `名称：${inv['FMaterialId.FName']}`, 
                    `规格：${inv['FMaterialId.FSpecification']}`, 
                    `批次：${inv.FBatchNo}`
                ].join('\n')"
                :rightText="[inv.FQty, inv['FStockUnitId.FName']].join(' ')"
                >
            </uni-list-item>
        </uni-list>
        
        <uni-load-more 
            v-if="invs.length == 0"
            status="nomore"
            :content-text="{ contentnomore: '没有相关数据' }"
        />
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
    import { get_bd_material } from '@/utils/api'
    import { Inv, StockLoc } from '@/utils/model'
    import { is_material_no_format, is_loc_no_std_format } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import ccShelf from '@/components/cc-shelf/cc-shelf.vue'
    export default {
        props: {
            t: {
                type: String
            }
        },
        components: {
            ccShelf
        },
        data() {
            return {
                mode: '', // material_no/loc_no
                display_mode: '', // grid/list
                scan_mode: '', // material_no/loc_no，可以指定扫描的是哪种编码
                no: '',
                material: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    base_unit_name: ''
                },
                invs: [],
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '更多' },
                        { icon: 'map', text: '网格' }
                    ],
                    button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad(options) {
            if (options.t) {
                this.scan_mode = 'material_no'
                this.handle_scan_code(options.t)
            }
        },
        mounted() {
            // this.handle_scan_code('3.08.02.01.10.0013') // 调试用
        },
        methods: {
            goods_nav_click(e) {
                if (e.index == 0) this.more_actions() // btn:更多
                if (e.index == 1) this.switch_display_mode() // btn:切换显示 网格/列表
            },
            goods_nav_button_click(e) {
                if (e.index == 0) this.scan_code() // btn:扫码
            },
            more_actions() {
                uni.showActionSheet({
                    itemList: ['扫码查询（物料编号）', '扫码查询（库位号）'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.scan_code('material_no')
                        if (e.tapIndex === 1) this.scan_code('loc_no')
                    }
                })
            },
            switch_display_mode() {
                uni.showActionSheet({
                    itemList: ['网格显示', '列表显示'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.set_display_mode('grid')
                        if (e.tapIndex === 1) this.set_display_mode('list')
                    }
                })              
            },
            scan_code(scan_mode='') {
                this.scan_mode = scan_mode
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            async load_material(material_no) {
                this.material = { material_no: material_no }
                return get_bd_material(material_no, store.state.cur_stock.FUseOrgId).then(res => {
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
            async load_invs_by_material_no(material_no) {
                const options = {
                    FStockId: store.state.cur_stock.FStockId,
                    'FMaterialId.FNumber': material_no,
                    FQty_gt: 0,
                }
                return Inv.query(options, { order: 'FBatchNo ASC, FStockLocId.FNumber ASC' }).then(res => { 
                    this.invs = res.data
                    this.mode = 'material_no'
                    this.set_display_mode('grid')
                    this.no = material_no
                })
            },
            async load_invs_by_loc_no(loc_no) {
                const options = {
                    FStockId: store.state.cur_stock.FStockId,
                    'FStockLocId.FNumber': loc_no,
                    FQty_gt: 0
                }
                return Inv.query(options, { order: 'FMaterialId.FNumber ASC, FBatchNo ASC' }).then(res => { 
                    this.invs = res.data
                    this.mode = 'loc_no'
                    this.set_display_mode('list')
                    this.no = loc_no
                })
            },
            async handle_scan_code(text) {
                text = text.trim()
                if (!text) return
                uni.showLoading({ title: 'Loading' })
                if (this.scan_mode == 'material_no') {
                    await this.load_invs_by_material_no(text)
                    await this.load_material(text)
                    uni.hideLoading()
                } else if (this.scan_mode == 'loc_no') {
                    await this.load_invs_by_loc_no(text)
                    uni.hideLoading()
                } else if (is_material_no_format(text)) {
                    await this.load_invs_by_material_no(text)
                    await this.load_material(text)
                    uni.hideLoading()
                } else if (is_loc_no_std_format(text)) {
                    await this.load_invs_by_loc_no(text)
                    uni.hideLoading()
                } else {
                    uni.hideLoading()
                    this.invs = []
                    this.mode = ''
                    this.no = ''
                    uni.showToast({ icon: 'none', title: '未知格式的编码' })
                }                   
            },
            set_display_mode(display_mode) {
                this.display_mode = display_mode
                if (display_mode == 'grid') {
                    this.goods_nav.options[1].icon = 'map'
                    this.goods_nav.options[1].text = '网格'
                } else if (display_mode == 'list') {
                    this.goods_nav.options[1].icon = 'list'
                    this.goods_nav.options[1].text = '列表'
                }
            },
            set_section_sub_title() {
                let text_list = []
                if (this.mode == 'material_no') {
                    text_list = [ 
                        this.material.material_no, 
                        `名称：${this.material.material_name}`, 
                        `规格：${this.material.material_spec}`,
                        `单位：${this.material.base_unit_name}`
                    ]
                } else if (this.mode == 'loc_no') {
                    text_list = [ `库位：${this.no}` ]
                }
                return text_list.join('\n')
            }
        }
    }
</script>

<style>

</style>
