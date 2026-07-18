<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
        sub-title-color="#007aff"
        @click="debug"
        >
        <uni-row v-if="$store.state.screen_type === 'h5'" >
            <uni-col :span="4">
                <uni-group title="搜索栏" mode="card" style="margin-top: 0;">
                    <uni-forms ref="search_form" :model="search_form" >
                        <uni-forms-item label="物料编码">
                            <uni-easyinput v-model="search_form.material_no" trim />
                        </uni-forms-item>
                        <uni-forms-item label="物料名称">
                            <uni-easyinput v-model="search_form.material_name" trim />
                        </uni-forms-item>
                        <uni-forms-item label="规格型号">
                            <uni-easyinput v-model="search_form.material_spec" trim />
                        </uni-forms-item>
                        <uni-forms-item label="库位号">
                            <uni-easyinput v-model="search_form.loc_no" trim />
                        </uni-forms-item>
                    </uni-forms>
                    <button type="primary" size="mini" @click="search">搜索</button>
                    <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
                </uni-group>
                
                <uni-group title="其他操作" mode="card">
                    <!-- <button size="mini" @click="inv_map">库存地图</button> -->
                    <button type="primary" size="mini" @click="link_to('/pages/operation/manage/inv_check')" class="uni-ml-5" >库存盘点</button>
                </uni-group>
                
                <uni-group title="总数量" mode="card">
                    <view class="sum_qty">{{ sum_qty }}</view>
                </uni-group>
            </uni-col>
            
            <uni-col :span="20">
                <scroll-view :scroll-top="scroll_top" @scroll="scroll" @scrolltolower="scrolltolower" scroll-y :style="{ height: scroll_height }">
                    <uni-table ref="table" stripe>
                        <uni-tr>
                            <uni-th align="center">物料编码</uni-th>
                            <uni-th align="center">物料名称</uni-th>
                            <uni-th align="center">规格型号</uni-th>
                            <uni-th align="center" width="100">数量</uni-th>
                            <uni-th align="center" width="50">单位</uni-th>
                            <uni-th align="center" width="120">库位号</uni-th>
                            <uni-th align="center" width="50">批次</uni-th>
                            <uni-th align="center" width="100">供应商</uni-th>
                            <uni-th align="center" width="220">操作</uni-th>
                        </uni-tr>
                        <uni-tr v-for="(inv, index) in invs" :key="index">
                            <uni-td align="center">
                                <view class="text-primary" @click="link_to(`/pages/operation/material/show?id=${inv.FMaterialId}`)">
                                    {{ inv['FMaterialId.FNumber'] }}
                                </view>
                            </uni-td>
                            <uni-td align="center">{{ inv['FMaterialId.FName'] }}</uni-td>
                            <uni-td align="center">{{ inv['FMaterialId.FSpecification'] }}</uni-td>
                            <uni-td align="center">{{ inv['FQty'] }}</uni-td>
                            <uni-td align="center">{{ inv['FStockUnitId.FName'] }}</uni-td>
                            <uni-td align="center">{{ inv['FStockLocId.FNumber'] }}</uni-td>
                            <uni-td align="center">{{ inv['FBatchNo'] }}</uni-td>
                            <uni-td align="center">{{ inv['FSupplierId.FName'] }}</uni-td>
                            <uni-td align="center">
                                <uni-tag text="只看" type="primary" size="small" inverted @click="search_material(inv['FMaterialId.FNumber'])"/>
                                <uni-tag text="调整" type="primary" size="small" @click="inv_modify(inv['FMaterialId.FNumber'])" class="uni-ml-2"/>
                                <uni-tag text="日志" type="primary" size="small" inverted @click="link_to(`/pages/operation/inv/logs?material_no=${inv['FMaterialId.FNumber']}`)" class="uni-ml-2"/>
                            </uni-td>
                        </uni-tr>
                    </uni-table>
                </scroll-view>
                <uni-pagination
                    :total="total" 
                    :current="page" 
                    :page-size="per_page" 
                    show-icon
                    @change="change_page"
                    class="uni-mt-5"
                />
            </uni-col>
        </uni-row>
        
        <template v-else>
            <scroll-view :scroll-top="scroll_top" @scroll="scroll" @scrolltolower="scrolltolower" scroll-y :style="{ height: scroll_height }">
                <uni-list>
                    <uni-list-item
                        v-for="(inv, index) in invs" :key="index"
                        @click="inv_menu(inv)" clickable show-arrow
                        >
                        <template #body>
                            <view class="uni-list-item__body">
                                <view class="title text-bold">{{ inv['FMaterialId.FNumber'] }} / {{ inv['FMaterialId.FName'] }}</view>
                                <view class="note">
                                    <view>规格：{{ inv['FMaterialId.FSpecification'] }}</view>
                                    <view>
                                        库位：<text class="text-primary uni-mr-5">{{ inv['FStockLocId.FNumber'] }}</text>
                                        批次：<text class="text-dark">{{ inv['FBatchNo'] }}</text>
                                    </view>
                                    <view v-if="inv['FSupplierId.FName']">供应商：{{ inv['FSupplierId.FName'] }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <view>{{ inv['FQty'] }} {{ inv['FStockUnitId.FName'] }}</view>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-list>
            </scroll-view>
            <uni-pagination
                :total="total" 
                :current="page" 
                :page-size="per_page" 
                show-icon
                @change="change_page"
            />
            <view class="uni-goods-nav-wrapper">
                <uni-goods-nav 
                    :options="goods_nav.options" 
                    :button-group="goods_nav.button_group"
                    :fill="$store.state.goods_nav_fill"
                    @click="goods_nav_click"
                    @buttonClick="goods_nav_button_click"
                />
            </view>
            <uni-popup ref="search_dialog" type="dialog">
                <uni-popup-dialog
                    type="info"
                    title="搜索条件"
                    cancelText="关闭"
                    @close="$refs.search_dialog.close()"
                    @confirm="search_dialog_confirm"
                    :before-close="true"
                    :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
                    >
                    <view style="flex: 1;">
                        <uni-forms ref="search_form" :model="search_form" >
                            <uni-forms-item label="物料编码">
                                <uni-easyinput v-model="search_form.material_no" trim />
                            </uni-forms-item>
                            <uni-forms-item label="物料名称">
                                <uni-easyinput v-model="search_form.material_name" trim />
                            </uni-forms-item>
                            <uni-forms-item label="规格型号">
                                <uni-easyinput v-model="search_form.material_spec" trim />
                            </uni-forms-item>
                            <uni-forms-item label="库位号">
                                <uni-easyinput v-model="search_form.loc_no" trim />
                            </uni-forms-item>
                        </uni-forms>
                    </view>
                </uni-popup-dialog>
            </uni-popup>
        </template>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { breadcrumb_stockname, link_to, play_audio_prompt } from '@/utils'
    import { Inv, StkInventory } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    
    export default {
        data() {
            return {
                invs: [], // 后端数据
                sum_qty: 0,
                total: 2000,
                page: 1,
                per_page: 50,
                scroll_top: 0,
                // #ifdef H5
                    scroll_height: 'calc(100vh - 187px)',
                // #endif
                // #ifdef APP-PLUS
                    scroll_height: `calc(100vh - ${187 - store.state.system_info.statusBarHeight}px)`,
                // #endif
                search_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    loc_no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索' },
                        { icon: 'clear', text: '重置' },
                        // { icon: 'map', text: '平面图' }
                    ],
                    button_group: [
                        { text: '扫码查询', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                    ]
                }
            }
        },
        onShow(options) {
            // #ifdef APP-PLUS
            this.reg_broadcast_receiver()
            // #endif
        },
        mounted() {
            this.load_invs()
        },
        methods: {
            breadcrumb_stockname,
            link_to,
            debug() {
                this.$logger.info('>>> $data', this.$data)
            },
            change_page(e) {
                this.page = e.current
                this.scroll_top = 0
                this.load_invs()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) this.reset_search_form()
                if (e.index === 2) this.inv_map()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code()
            },
            inv_map() {
                uni.navigateTo({
                    url: '/pages/operation/inv/map',
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('sendInvs', { invs: this.invs })
                    }
                })
            },
            inv_menu(inv) {
                if (!inv.FID) {
                    uni.showToast({ icon: 'none', title: '物料ID不能为空' })
                    return
                } 
                uni.showActionSheet({
                    itemList: ['只看该物料', '库存调整', '库存日志', '物料详情'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.search_material(inv['FMaterialId.FNumber'])
                        if (e.tapIndex === 1) this.inv_modify(inv['FMaterialId.FNumber'])
                        if (e.tapIndex === 2) link_to(`/pages/operation/inv/logs?material_no=${inv['FMaterialId.FNumber']}`)
                        if (e.tapIndex === 3) link_to(`/pages/operation/material/show?id=${inv['FMaterialId.FNumber']}`)
                    }
                })
            },
            inv_modify(material_no) {
                if (store.state.role.includes('admin')) {
                    link_to(`/pages/operation/move/v2/plan_new?material_no=${material_no}`)
                } else {
                    uni.showToast({ icon: 'error', title: '无权限' })
                }
            },
            reset_search_form() {
                this.search_form = { material_no: '', material_name: '', material_spec: '', inv_diff: '' }
                this.search()
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(text) {
                uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${text}`})
            },
            scroll(e) {
                this.scroll_top = e.detail.scrollTop
            },
            scrolltolower(e) {
                uni.showToast({ icon: 'none', title: '已经到底了' })
            },
            search() {
                this.page = 1
                this.load_invs()
            },
            search_material(material_no) {
                this.search_form = { material_no }
                this.search()
            },
            search_dialog_confirm() {
                this.search()
                this.$refs.search_dialog.close()
            },
            async load_invs() {
                let options = { FQty_gt: 0, FStockId: store.state.cur_stock.FStockId }
                if (store.state.cur_area?.value) options['FStockLocId.FNumber_sw'] = store.state.cur_area.value // 考虑库区
                if (this.search_form.material_no) options['FMaterialId.FNumber_lk'] = this.search_form.material_no
                if (this.search_form.material_name) options['FMaterialId.FName_lk'] = this.search_form.material_name
                if (this.search_form.material_spec) options['FMaterialId.FSpecification_lk'] = this.search_form.material_spec
                if (this.search_form.loc_no) options['FStockLocId.FNumber_lk'] = this.search_form.loc_no
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                uni.showLoading({ title: 'Loading' })
                this.total = await Inv.count(options)
                this.sum_qty = await Inv.sum_qty(options)
                let res = await Inv.query(options, meta)
                this.invs = res.data
                uni.hideLoading()
            },
            // #ifdef APP-PLUS
            // Broadcast receiver
            reg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                main.unregisterReceiver(store.state.broadcast_receiver)
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
                store.commit('set_broadcast_receiver', receiver)
                main.registerReceiver(receiver, filter)
                this.$logger.info(`>>> main.registerReceiver:${this.route}`, receiver)
            },
            // #endif
        }
    }
</script>

<style lang="scss" scoped>
    // .cc-list-scroll {
    //     width: 100%;
    //     overflow-x: auto;
    //     height: calc(100vh - 187px);
    // }
    .uni-table-tr::v-deep {
        .uni-table-th {
            color: $uni-text-color;
        }
        .uni-table-td {
            padding: 4px 5px;
        }
    }
    .uni-group--card::v-deep {
        overflow: visible;
    }
    .uni-list::v-deep {
        .uni-list--border-bottom {
            display: none;
        }
    }
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
    .sum_qty {
        color: $uni-color-primary;
        font-size: 30px;
        text-align: center;
    }
</style>
