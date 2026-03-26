<template>
    <uni-section title="查询结果" type="square"
        :sub-title="set_section_sub_title()"
        sub-title-color="#007aff"
        class="above-uni-goods-nav"
        >
        <cc-shelf
            v-if="display_mode == 'grid' && invs.length"
            :stock_locs="$store.state.stock_locs"
            :invs="invs"
            only-inv
            open />
            
        <uni-list v-if="mode == 'material_no' && display_mode == 'list'">
            <uni-list-item v-for="(inv, index) in invs" :key="index">
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">{{ inv['FStockLocId.FNumber'] }}</view>
                        <view class="note">
                            <view>批次：{{ inv.FBatchNo }}</view>
                            <view>供应商：{{ inv['FSupplierId.FName'] }}</view>
                        </view>
                    </view>
                </template>
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <view class="op_qty">
                            <text>{{ inv.FQty }} {{ inv['FStockUnitId.FName'] }}</text>
                        </view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
        
        <uni-list v-if="mode == 'loc_no' && display_mode == 'list'">
            <uni-list-item v-for="(inv, index) in invs" :key="index">
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">{{ inv['FMaterialId.FNumber'] }}</view>
                        <view class="note">
                            <view>名称：{{ inv['FMaterialId.FName'] }}</view>
                            <view>规格：{{ inv['FMaterialId.FSpecification'] }}</view>
                            <view>批次：{{ inv.FBatchNo }}</view>
                            <view>供应商：{{ inv['FSupplierId.FName'] }}</view>
                        </view>
                    </view>
                </template>
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <view class="op_qty">
                            <text>{{ inv.FQty }} {{ inv['FStockUnitId.FName'] }}</text>
                        </view>
                    </view>
                </template>
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
    import { play_audio_prompt } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import ccShelf from '@/components/cc-shelf/cc-shelf.vue'
    export default {
        props: {
            t: {
                type: String
            },
            m: {
                type: Number
            }
        },
        components: {
            ccShelf
        },
        data() {
            return {
                mode: '', // material_no/loc_no
                display_mode: 'list', // grid/list
                // scan_mode: 0, // 0: material_no, 1: loc_no，可以指定扫描的是哪种编码
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
                        // { icon: 'more-filled', text: '更多' },
                        { icon: 'list', text: '列表' }
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
                // if (options.m) this.scan_mode = options.m
                this.handle_scan_code(options.t)
            }
            // #ifdef APP-PLUS
            if (!this.broadcast_receiver) this.reg_broadcast_receiver()
            // #endif
        },
        onUnload() {
            // #ifdef APP-PLUS
            this.unreg_broadcast_receiver()
            // #endif
        },
        mounted() {
            // this.handle_scan_code('3.08.02.01.10.0013') // 调试用
        },
        methods: {
            goods_nav_click(e) {
                // if (e.index == 0) this.more_actions() // btn:更多
                if (e.index == 0) this.switch_display_mode() // btn:切换显示 网格/列表
            },
            goods_nav_button_click(e) {
                if (e.index == 0) this.scan_code() // btn:扫码
            },
            // more_actions() {
            //     uni.showActionSheet({
            //         itemList: ['扫码查询（物料编号）', '扫码查询（库位号）'],
            //         success: (e) => {
            //             if (e.tapIndex === 0) this.scan_code(0)
            //             if (e.tapIndex === 1) this.scan_code(1)
            //         }
            //     })
            // },
            switch_display_mode() {
                uni.showActionSheet({
                    itemList: ['网格显示', '列表显示'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.set_display_mode('grid')
                        if (e.tapIndex === 1) this.set_display_mode('list')
                    }
                })              
            },
            scan_code() {
                // this.scan_mode = scan_mode
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            async handle_scan_code(text) {
                text = text.trim()
                if (!text) return
                let material_no = ''
                let loc_no = ''
                 if (text.includes('||')) {
                    material_no = text.split('||')[1]
                } else if (text.includes('-')) {
                    loc_no = text
                } else {
                    material_no = text
                }
                uni.showLoading({ title: 'Loading' })
                if (loc_no) {
                    await this.load_invs_by_loc_no(text)
                } else {
                    await this.load_invs_by_material_no(text)
                    await this.load_material(text)
                }
                uni.hideLoading()
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
                    this.set_display_mode('list')
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
            set_display_mode(display_mode) {
                this.display_mode = display_mode
                if (display_mode == 'grid') {
                    this.goods_nav.options[0].icon = 'map'
                    this.goods_nav.options[0].text = '网格'
                } else if (display_mode == 'list') {
                    this.goods_nav.options[0].icon = 'list'
                    this.goods_nav.options[0].text = '列表'
                }
            },
            set_section_sub_title() {
                let text_list = []
                if (this.mode == 'material_no') {
                    text_list = [ 
                        `${this.material.material_no} / ${this.material.material_name}`, 
                        `规格：${this.material.material_spec}`
                    ]
                } else if (this.mode == 'loc_no') {
                    text_list = [ `库位：${this.no}` ]
                }
                return text_list.join('\n')
            },
            // #ifdef APP-PLUS
            // Broadcast receiver
            reg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                let IntentFilter = plus.android.importClass('android.content.IntentFilter')
                let filter = new IntentFilter()
                filter.addAction(store.state.android_intent_action)
                let receiver = plus.android.implements('io.dcloud.feature.internal.reflect.BroadcastReceiver', {
                    onReceive: (content, intent) => {
                        plus.android.importClass(intent)
                        let code = intent.getStringExtra(store.state.android_intent_string_label)
                        this.$logger.info('>>> broadcast:', code)
                        play_audio_prompt('laser_scan')
                        this.handle_scan_code(code)
                    }
                })
                this.broadcast_receiver = receiver
                main.registerReceiver(this.broadcast_receiver, filter)
                this.$logger.info('>>> main.registerReceiver:manage/inv_search', this.broadcast_receiver)
            },
            unreg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                main.unregisterReceiver(this.broadcast_receiver)
                this.$logger.info('>>> main.unregisterReceiver:manage/inv_search', this.broadcast_receiver)
            },
            // #endif
        }
    }
</script>

<style>

</style>
