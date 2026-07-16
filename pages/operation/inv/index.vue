<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
        sub-title-color="#007aff"
        @click="debug"
        >
        <uni-row v-if="$store.state.screen_type === 'h5'" >
            <uni-col :span="6">
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
                        <uni-forms-item v-if="stk_invs.length" label="库存差异">
                            <uni-data-select v-model="search_form.inv_diff" :localdata="[{ value: 'Y', text: '是' },{ value: 'N', text: '否' }]" />
                        </uni-forms-item>
                    </uni-forms>
                    <button type="primary" size="mini" @click="search">搜索</button>
                    <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
                </uni-group>
                
                <uni-group title="其他操作" mode="card">
                    <button size="mini" @click="inv_map">库存地图</button>
                    <button type="primary" size="mini" @click="link_to('/pages/operation/manage/inv_check')" class="uni-ml-5" >库存盘点</button>
                </uni-group>
            </uni-col>
            
            <uni-col :span="18">
                <uni-table ref="table" stripe>
                    <uni-tr>
                        <uni-th align="center">物料编码</uni-th>
                        <uni-th align="center">物料名称</uni-th>
                        <uni-th align="center">规格型号</uni-th>
                        <uni-th align="center" width="50">单位</uni-th>
                        <uni-th align="center" width="100">数量</uni-th>
                        <uni-th v-if="stk_invs.length" align="center" width="100">
                            <image src="/static/icon/cc_k3cloud_active.png" style="width:20px; height:20px;" mode="aspectFit" />
                            金蝶账面
                        </uni-th>
                        <uni-th v-if="stk_invs.length" align="center" width="100">差异</uni-th>
                        <uni-th align="center" width="220">操作</uni-th>
                    </uni-tr>
                    <uni-tr v-for="(obj, index) in table_data" :key="index">
                        <uni-td align="center">
                            <view class="text-primary" @click="link_to(`/pages/operation/material/show?id=${obj.material_id}`)">
                                {{ obj.material_no }}
                            </view>
                        </uni-td>
                        <uni-td align="center">{{ obj.material_name }}</uni-td>
                        <uni-td align="center">{{ obj.material_spec }}</uni-td>
                        <uni-td align="center">{{ obj.unit_name }}</uni-td>
                        <uni-td align="center">{{ obj.qty }}</uni-td>
                        <uni-td v-if="stk_invs.length" align="center">{{ obj.stk_qty }}</uni-td>
                        <uni-td v-if="stk_invs.length" align="center">
                            <text v-if="obj.qty - obj.stk_qty > 0" class="text-primary">{{ obj.qty - obj.stk_qty }}</text>
                            <text v-if="obj.qty - obj.stk_qty < 0" class="text-error">{{ obj.qty - obj.stk_qty }}</text>
                            <text v-if="obj.qty - obj.stk_qty == 0" class="text-grey">{{ obj.qty - obj.stk_qty }}</text>
                        </uni-td>
                        <uni-td align="center">
                            <uni-tag text="库存明细" type="primary" size="small" inverted @click="link_to(`/pages/operation/manage/inv_search?t=${obj.material_no}`)"/>
                            <uni-tag text="库存调整" type="primary" size="small" @click="inv_modify(obj.material_no)" class="uni-ml-2"/>
                            <uni-tag text="库存日志" type="primary" size="small" inverted @click="link_to(`/pages/operation/inv/logs?material_no=${obj.material_no}`)" class="uni-ml-2"/>
                        </uni-td>
                    </uni-tr>
                </uni-table>
                
                <uni-pagination v-if="inv_groups_q.length > 0"
                    :total="inv_groups_q.length" 
                    :current="cur_page" 
                    :page-size="per_page" 
                    show-icon
                    @change="change_page"
                    class="uni-mt-5"
                />
            </uni-col>
        </uni-row>
        
        <template v-else>
            <uni-list class="cc-list-scroll" :style="{ height: cc_list_height }">
                <uni-list-item
                    v-for="(obj, index) in table_data" :key="index"
                    @click="inv_menu(obj)" clickable show-arrow
                    @longpress="inv_menu(obj)"
                    >
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title text-bold">{{ obj.material_no }} / {{ obj.material_name }}</view>
                            <view class="note">
                                <!-- <view>名称：{{ obj.material_name }}</view> -->
                                <view>规格：{{ obj.material_spec }}</view>
                            </view>
                        </view>
                    </template>
                    <template #footer>
                        <view class="uni-list-item__foot">
                            <view>{{ obj.qty }} {{ obj.unit_name }}</view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            
            <uni-pagination v-if="inv_groups_q.length > 0"
                :total="inv_groups_q.length" 
                :current="cur_page" 
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
                            <uni-forms-item v-if="stk_invs.length" label="库存差异">
                                <uni-data-select v-model="search_form.inv_diff" :localdata="[{ value: 'Y', text: '是' },{ value: 'N', text: '否' }]" />
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
                stk_invs: [], // 金蝶库存
                inv_groups: [], // 按物料分组
                inv_groups_q: [], // 过滤结果
                cur_page: 1,
                per_page: 20,
                // #ifdef H5
                    cc_list_height: 'calc(100vh - 187px)',
                // #endif
                // #ifdef APP-PLUS
                    cc_list_height: `calc(100vh - ${187 - store.state.system_info.statusBarHeight}px)`,
                // #endif
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                search_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    inv_diff: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索' },
                        { icon: 'clear', text: '重置' },
                        { icon: 'map', text: '平面图' }
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
        onPullDownRefresh() {
            this.refresh()
            uni.stopPullDownRefresh()
        },
        mounted() {
            this.load_data()
        },
        computed: {
            table_data() {
                let a = (this.cur_page - 1) * this.per_page
                return this.inv_groups_q.slice(a, a + this.per_page)
            }
        },
        methods: {
            breadcrumb_stockname,
            link_to,
            debug() {
                this.$logger.info('>>> $data', this.$data)
                // this.$logger.info('>>> store.state', store.state)
            },
            change_page(e) {
                this.cur_page = e.current
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
            inv_menu(obj) {
                if (!obj.material_id) {
                    uni.showToast({ icon: 'none', title: '物料ID不能为空' })
                    return
                } 
                uni.showActionSheet({
                    itemList: ['库存明细', '库存调整', '库存日志', '物料详情'],
                    success: (e) => {
                        if (e.tapIndex === 0) link_to(`/pages/operation/manage/inv_search?t=${obj.material_no}`)
                        if (e.tapIndex === 1) this.inv_modify(obj.material_no)
                        if (e.tapIndex === 2) link_to(`/pages/operation/inv/logs?material_no=${obj.material_no}`)
                        if (e.tapIndex === 3) link_to(`/pages/operation/material/show?id=${obj.material_id}`)
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
            refresh_page() {
                let o_cur_page = this.cur_page
                this.search()
                this.cur_page = o_cur_page
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
            search() {
                this.inv_groups_q = this.inv_groups.filter(obj => {
                    for (let field of ['material_no', 'material_name', 'material_spec']) {
                        let kw = this.search_form[field].toUpperCase()
                        if (kw && !obj[field].toUpperCase().includes(kw)) return false
                    }
                    if (this.search_form.inv_diff == 'Y') return obj.qty != obj.stk_qty
                    if (this.search_form.inv_diff == 'N') return obj.qty == obj.stk_qty
                    return true
                })
                this.cur_page = 1
            },
            search_dialog_confirm() {
                this.search()
                this.$refs.search_dialog.close()
            },
            async load_invs() {
                let invs = await Inv.get_all()
                this.invs = invs
            },
            async load_stk_invs() {
                let stk_invs = await StkInventory.get_all()
                this.stk_invs = stk_invs
            },
            async load_data() {
                uni.showLoading({ title: 'Loading' })
                await this.load_invs()
                if (!store.state.cur_area?.value) {
                    // await this.load_stk_invs() // 不分库区的仓库，加载金蝶即时库存
                }
                uni.hideLoading()
                this.get_inv_groups()
            },
            async refresh() {
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                await this.load_data()
                this.last_refresh_time = Date.now()
            },
            get_inv_groups() {
                let inv_groups = []
                let i = 0, j = 0
                while (i < this.stk_invs.length || j < this.invs.length) {
                    let stk_inv = this.stk_invs[i]
                    let inv = this.invs[j]
                    if (!inv || (stk_inv && stk_inv['FMaterialId.FNumber'] <= inv['FMaterialId.FNumber'])) {
                        let inv_group = inv_groups.find(x => x.material_no == stk_inv['FMaterialId.FNumber'])
                        if (inv_group) {
                            inv_group.stk_qty += stk_inv['FBaseQty']
                        } else {
                            inv_group = {
                                material_id: stk_inv['FMaterialId'],
                                material_no: stk_inv['FMaterialId.FNumber'],
                                material_name: stk_inv['FMaterialId.FName'],
                                material_spec: stk_inv['FMaterialId.FSpecification'],
                                material_image: inv?.['FMaterialId.FImageFileServer'],
                                stk_qty: stk_inv['FBaseQty'],
                                qty: 0,
                                unit_name: stk_inv['FBaseUnitId.FName'],
                                thumbnail: '/static/default_40x40.png'
                            }
                            inv_groups.push(inv_group)
                        }
                        i += 1
                        if (inv_group.material_no == inv?.['FMaterialId.FNumber']) {
                            inv_group.qty += inv.FQty
                            j += 1
                        }
                    } else {
                        let inv_group = inv_groups.find(x => x.material_no == inv['FMaterialId.FNumber'])
                        if (inv_group) {
                            inv_group.qty += inv.FQty
                        } else {
                            inv_groups.push({
                                material_id: inv.FMaterialId,
                                material_no: inv['FMaterialId.FNumber'],
                                material_name: inv['FMaterialId.FName'],
                                material_spec: inv['FMaterialId.FSpecification'],
                                material_image: inv['FMaterialId.FImageFileServer'],
                                stk_qty: 0,
                                qty: inv.FQty,
                                unit_name: inv['FStockUnitId.FName'],
                                thumbnail: '/static/default_40x40.png'
                            })
                        }
                        j += 1
                    }
                }
                this.inv_groups = inv_groups
                this.inv_groups_q = inv_groups
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
    .cc-list-scroll {
        width: 100%;
        overflow-x: auto;
        height: calc(100vh - 187px);
    }
    .uni-table-tr::v-deep {
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
</style>
