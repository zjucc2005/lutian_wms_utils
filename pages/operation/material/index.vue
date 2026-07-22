<template>
    <uni-row v-if="$store.state.screen_type === 'h5'" >
        <uni-col :span="4">
            <uni-group title="搜索栏" mode="card" @click="debug">
                <uni-forms ref="search_form" :model="search_form" >
                    <uni-forms-item label="物料编码" name="material_no">
                        <uni-easyinput v-model="search_form.material_no" trim />
                    </uni-forms-item>
                    <uni-forms-item label="物料名称" name="material_name">
                        <uni-easyinput v-model="search_form.material_name" trim />
                    </uni-forms-item>
                    <uni-forms-item label="规格型号" name="material_spec">
                        <uni-easyinput v-model="search_form.material_spec" trim />
                    </uni-forms-item>
                    <uni-forms-item label="存货类别" name="material_category_id">
                        <uni-data-select v-model="search_form.material_category_id" :localdata="material_categories" />
                    </uni-forms-item>
                </uni-forms>
                <button type="primary" size="mini" @click="search">搜索</button>
                <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
            </uni-group>
            
<!--            <uni-group title="其他操作" mode="card">
                <button size="mini" @click="debug">debug</button>
            </uni-group> -->
        </uni-col>
        
        <uni-col :span="20">
            <scroll-view :scroll-top="scroll_top" @scroll="scroll" @scrolltolower="scrolltolower" scroll-y :style="{ height: scroll_height }">
                <uni-table ref="table" stripe style="width: 100%;">
                    <uni-tr>
                        <uni-th align="center">物料编码</uni-th>
                        <uni-th align="center">物料名称</uni-th>
                        <uni-th align="center">规格型号</uni-th>
                        <uni-th align="center" width="80">存货类别</uni-th>
                        <uni-th align="center" width="100">仓库</uni-th>
                        <uni-th align="center" width="62">仓管员</uni-th>
                        <uni-th align="center" width="76">安全库存</uni-th>
                        <uni-th align="center" width="76">数据状态</uni-th>
                        <uni-th align="center" width="82">修改时间</uni-th>
                    </uni-tr>
                    <uni-tr v-for="(mat, index) in materials" :key="index" :style="{ backgroundColor: mat.FForbidStatus == 'B' ? 'rgb(254, 240, 240)' : '' }">
                        <uni-td align="center">
                            <view class="text-primary" @click="link_to(`/pages/operation/material/show?id=${mat.FMaterialId}`)">{{ mat.FNumber }}</view>
                        </uni-td>
                        <uni-td align="center">{{ mat.FName }}</uni-td>
                        <uni-td align="center">{{ mat.FSpecification }}</uni-td>
                        <uni-td align="center">{{ mat['FCategoryId.FName'] }}</uni-td>
                        <uni-td align="center">{{ mat['FStockId.FName'] }}</uni-td>
                        <uni-td align="center">{{ mat['F_PAEZ_Base1.FName'] }}</uni-td>
                        <uni-td align="center">{{ mat.FSafeStock }}</uni-td>
                        <uni-td align="center">{{ $store.state.document_status_dict[mat.FDocumentStatus] || mat.FDocumentStatus }}</uni-td>
                        <uni-td align="center">{{ formatDate(mat.FModifyDate, 'yyyy-MM-dd') }}</uni-td>
                    </uni-tr>
                </uni-table>
            </scroll-view>
            <uni-pagination v-if="materials.length > 0"
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
                    v-for="(mat, index) in materials" :key="index"
                    @click="link_to(`/pages/operation/material/show?id=${mat.FMaterialId}`)" clickable show-arrow
                    >
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title text-bold">{{ mat.FNumber }} {{ mat.FName }}</view>
                            <view class="note">
                                <view>{{ mat.FSpecification }}</view>
                            </view>
                        </view>
                    </template>
                    <!-- <template #footer>
                        <view class="uni-list-item__foot">
                            <view>{{ mat['FCategoryId.FName'] }}</view>
                        </view>
                    </template> -->
                </uni-list-item>
            </uni-list>
        </scroll-view>
        <uni-pagination v-if="materials.length > 0"
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
                        <uni-forms-item label="物料编码" name="material_no">
                            <uni-easyinput v-model="search_form.material_no" trim
                                prefix-icon="scan"
                                @icon-click="searchbar_icon_click" />
                        </uni-forms-item>
                        <uni-forms-item label="物料名称" name="material_name">
                            <uni-easyinput v-model="search_form.material_name" trim />
                        </uni-forms-item>
                        <uni-forms-item label="规格型号" name="material_spec">
                            <uni-easyinput v-model="search_form.material_spec" trim />
                        </uni-forms-item>
                        <uni-forms-item label="存货类别" name="material_category_id">
                            <uni-data-select v-model="search_form.material_category_id" :localdata="material_categories" />
                        </uni-forms-item>
                    </uni-forms>
                </view>
            </uni-popup-dialog>
        </uni-popup>
    </template>
</template>

<script>
    import store from '@/store'
    import { link_to, formatDate, play_audio_prompt } from '@/utils'
    import { BdMaterial, StockLoc } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    
    export default {
        data() {
            return {
                materials: [],
                total: 2000,
                page: 1,
                per_page: 50,
                scroll_top: 0,
                // #ifdef H5
                    scroll_height: 'calc(100vh - 124px)',
                // #endif
                // #ifdef APP-PLUS
                    scroll_height: `calc(100vh - ${124 - store.state.system_info.statusBarHeight}px)`,
                // #endif
                search_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    material_category_id: '',
                    candidates: []
                },
                material_categories: [],
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索' },
                        { icon: 'clear', text: '重置' }
                    ],
                    button_group: [
                        { text: '扫码查询', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                    ]
                }
            }
        },
        onShow() {
            // #ifdef APP-PLUS
            this.reg_broadcast_receiver()
            // #endif
        },
        mounted() {
            this.load_bd_materialcategories()
            // #ifdef H5
            this.load_bd_materials()
            // #endif
            // #ifdef APP-PLUS
            this.$refs.search_dialog.open()
            // #endif
        },
        methods: {
            link_to,
            formatDate,
            debug() {
                this.$logger.info('>>> $data', this.$data)
            },
            change_page(e) {
                this.page = e.current
                this.scroll_top = 0
                this.load_bd_materials()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) this.reset_search_form()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code()
            },
            async load_bd_materialcategories() {
                if (!store.state.bd_materialcategories?.length) {
                    let res = await BdMaterial.categories()
                    store.commit('set_bd_materialcategories', res.data)
                }
                this.material_categories = store.state.bd_materialcategories.map(x => { return { value: x.FMasterId, text: x.FName } })
            },
            async load_bd_materials() {
                let options = { FUseOrgId: 1, FForbidStatus: 'A' }
                if (this.search_form.material_no) options.FNumber_lk = this.search_form.material_no
                if (this.search_form.material_name) options.FName_lk = this.search_form.material_name
                if (this.search_form.material_spec) options.FSpecification_lk = this.search_form.material_spec
                if (this.search_form.material_category_id) options.FCategoryId = this.search_form.material_category_id
                let fields = ['FMaterialId', 'FName', 'FNumber', 'FSpecification', 'FCategoryId.FName',
                              'FStockId.FName', 'F_PAEZ_Base1.FName', 'FSafeStock',
                              'FDocumentStatus', 'FCreateDate', 'FModifyDate' ]
                let meta = { fields, page: this.page, per_page: this.per_page, order: 'FMaterialId DESC' }
                uni.showLoading({ title: 'Loading' })
                this.total = await BdMaterial.count(options)
                let res = await BdMaterial.query(options, meta)
                this.materials = res.data
                uni.hideLoading()
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(code) {
                if (code.includes('||')) {
                    this.search_form.material_no = code.split('||')[1]
                } else {
                    this.search_form.material_no = code
                }
                this.search()
            },
            scroll(e) {
                this.scroll_top = e.detail.scrollTop
            },
            scrolltolower(e) {
                uni.showToast({ icon: 'none', title: '已经到底了' })
            },
            search() {
                this.page = 1
                this.load_bd_materials()
            },
            search_dialog_confirm() {
                this.search()
                this.$refs.search_dialog.close()
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            reset_search_form() {
                this.search_form = {}
                this.search()
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
    // .uni-list::v-deep {
    //     .uni-list--border-bottom {
    //         display: none;
    //     }
    // }
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
</style>
