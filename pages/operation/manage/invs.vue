<template>
    <!-- <uni-notice-bar single scrollable text="点击库存列表，可查询库存明细;长按弹出功能栏" /> -->
    <uni-section title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
        sub-title-color="#007aff"
        class="above-uni-goods-nav"
        @click="$logger.info('>>>', this.$data)"
        >
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.no"
                placeholder="请输入搜索内容"
                prefix-icon="scan"
                @icon-click="searchbar_icon_click"
                @change="search"
                @clear="search"
                primary-color="rgb(238, 238, 238)"
                class="uni-mb-4"
                :styles="{
                    color: '#000',
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgb(238, 238, 238)',
                    height: '100px'
                }"
            />
            <uni-tag text="库存差异" @click="search_form.no='库存差异';search();" type="primary" size="small" inverted circle />
        </view>
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <!-- <uni-th align="center" width="60">
                    <text class="text-link" @click="get_thumbnail">略图</text>
                </uni-th> -->
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center" width="50">单位</uni-th>
                <uni-th align="center">数量</uni-th>
                <uni-th align="center" width="100">
                    <image src="/static/icon/cc_k3cloud_active.png" style="width:20px; height:20px;" mode="aspectFit" />
                    金蝶账面
                </uni-th>
                <uni-th align="center" width="50">差异</uni-th>
                <uni-th align="center" width="230">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in tableData" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <!-- <uni-td><image :src="obj.thumbnail" mode="aspectFill" class="thumbnail" /></uni-td> -->
                <uni-td>
                    <view class="text-primary" @click="link_to(`/pages/operation/material/show?id=${obj.material_id}`)">
                        {{ obj.material_no }}
                    </view>
                </uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.unit_name }}</uni-td>
                <uni-td align="center">{{ obj.qty }}</uni-td>
                <uni-td align="center">{{ obj.stk_qty }}</uni-td>
                <uni-td align="center">
                    <text v-if="obj.qty - obj.stk_qty > 0" class="text-primary">{{ obj.qty - obj.stk_qty }}</text>
                    <text v-if="obj.qty - obj.stk_qty < 0" class="text-error">{{ obj.qty - obj.stk_qty }}</text>
                    <text v-if="obj.qty - obj.stk_qty == 0" class="text-grey">{{ obj.qty - obj.stk_qty }}</text>
                </uni-td>
                <uni-td align="center">
                    <uni-tag text="库存明细" type="primary" inverted @click="link_to(`/pages/operation/manage/inv_search?t=${obj.material_no}`)"/>
                    <uni-tag text="库存调整" type="primary" @click="inv_modify(obj.material_no)" class="uni-ml-2"/>
                    <uni-tag text="库存日志" type="primary" inverted @click="link_to(`/pages/operation/list/inv_logs?material_no=${obj.material_no}`)" class="uni-ml-2"/>
                </uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <!-- :thumb="obj.thumbnail" thumb-size="lg" -->
            <uni-list-item
                v-for="(obj, index) in tableData" :key="index"
                @click="inv_menu(obj)" clickable show-arrow
                @longpress="inv_menu(obj)"
                >
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">{{ obj.material_no }}</view>
                        <view class="note">
                            <view>名称：{{ obj.material_name }}</view>
                            <view>规格：{{ obj.material_spec }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ obj.qty }}</view>
                        <view style="display: flex; align-items: center;">
                            <image src="/static/icon/cc_k3cloud_active.png" style="width:16px; height:16px;" mode="aspectFit" />
                            <text v-if="obj.qty > obj.stk_qty" class="text-primary">{{ obj.stk_qty }}</text>
                            <text v-if="obj.qty < obj.stk_qty" class="text-error">{{ obj.stk_qty }}</text>
                            <text v-if="obj.qty == obj.stk_qty">{{ obj.stk_qty }}</text>
                        </view>
                        <view>{{ obj.unit_name }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
        
        <uni-load-more v-if="inv_groups.length === 0" status="nomore" />
        <uni-pagination v-else 
            :total="inv_groups_q.length" 
            :current="cur_page" 
            :page-size="per_page" 
            show-icon
            @change="change_page"
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
    import { Inv, StkInventory } from '@/utils/model'
    import { breadcrumb_stockname, play_audio_prompt, link_to } from '@/utils'
    import K3CloudApi from '@/utils/k3cloudapi'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                invs: [], // WMS库存
                stk_invs: [], // 金蝶库存
                inv_groups: [], // 组合数据
                inv_groups_q: [], // 组合数据（过滤）
                cur_page: 1,
                per_page: 10,
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                search_form: {
                    no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '更多' },
                    ],
                    button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        },
                        {
                            text: '库存地图',
                            backgroundColor: store.state.goods_nav_color.green,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad() {
            // #ifdef APP-PLUS
            if (!this.broadcast_receiver) this.reg_broadcast_receiver()
            // #endif
        },
        onUnload() {
            // #ifdef APP-PLUS
            this.unreg_broadcast_receiver()
            // #endif
        },
        onPullDownRefresh() {
            this.refresh()
            uni.stopPullDownRefresh()
        },
        mounted() {
            this.load_invs()
        },
        computed: {
            tableData() {
                let a = (this.cur_page - 1) * this.per_page
                return this.inv_groups_q.slice(a, a + this.per_page)
            }
        },
        methods: {
            breadcrumb_stockname,
            link_to,
            change_page(e) {
                this.cur_page = e.current
                uni.pageScrollTo({ scrollTop: 0 })
            },
            goods_nav_click(e) {
                // if (e.index === 0) this.refresh() // btn:刷新
                if (e.index === 0) this.more()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.inv_map() // btn:库存地图
            },
            search() {
                this.cur_page = 1
                let no = this.search_form.no.trim()
                if (!no) {
                    this.inv_groups_q = this.inv_groups
                    return
                }
                if (no === '库存差异') {
                    this.inv_groups_q = this.inv_groups.filter(inv_group => {
                        return inv_group.qty != inv_group.stk_qty
                    })
                    return
                }
                let kws = no.split('+')
                if (kws.length > 2) {
                    uni.showToast({ icon: 'error', title: '最多支持2个关键词' })
                    return
                }
                this.inv_groups_q = this.inv_groups.filter(inv_group => {
                    for (let kw of kws) {
                        if (inv_group.material_no.includes(kw) ||
                        inv_group.material_name.toUpperCase().includes(kw.toUpperCase()) ||
                        inv_group.material_spec.toUpperCase().includes(kw.toUpperCase())) {
                            continue
                        } else {
                            return false
                        }
                    }
                    return true
                })
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
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
                    this.search_form.no = code.split('||')[1]
                } else {
                    this.search_form.no = code
                }
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
                        if (e.tapIndex === 2) link_to(`/pages/operation/list/inv_logs?material_no=${obj.material_no}`)
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
            inv_map() {
                uni.navigateTo({
                    url: '/pages/operation/manage/inv_map',
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('sendInvs', { invs: this.invs })
                    }
                })
            },
            more() {
                if (!store.state.role.includes('admin')) return // 需要有仓库管理员权限
                uni.showActionSheet({
                    // #ifndef H5
                    itemList: ['刷新'],
                    // #endif
                    // #ifdef H5
                    itemList: ['刷新', '库存盘点'],
                    // #endif
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            this.refresh()
                        }
                        if (e.tapIndex === 1) {
                            play_audio_prompt('success')
                            uni.navigateTo({ 
                                url: '/pages/operation/manage/inv_check',
                                success: (res) => {
                                    play_audio_prompt('success')
                                }
                            })
                        }
                    }
                })
            },
            async load_invs() {
                uni.showLoading({ title: 'Loading' })
                let res = await Inv.get_all({ FStockId: store.state.cur_stock.FStockId })
                this.invs = res
                let stk_res = await StkInventory.query({ FStockId: this.$store.state.cur_stock.FStockId }, 
                    {   
                        fields: ['FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FBaseQty', 'FBaseUnitId.FName'],
                        order: 'FMaterialId.FNumber ASC', 
                        return: 'array'
                    }
                )
                this.stk_invs = stk_res.data
                uni.hideLoading()
                this.get_inv_groups()
                // if (store.state.screen_type === 'h5') this.get_thumbnail()
            },
            async refresh() {
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                await this.load_invs()
                this.last_refresh_time = Date.now()
            },
            // inv_groups_filtered() {
            //     let no = this.search_form.no.trim()
            //     if (!no) return this.inv_groups
            //     if (no === '库存差异') {
            //         return this.inv_groups.filter(inv_group => {
            //             return inv_group.qty != inv_group.stk_qty
            //         })
            //     }
            //     let kws = no.split('+')
            //     if (kws.length > 2) {
            //         uni.showToast({ icon: 'error', title: '最多支持2个关键词' })
            //         return
            //     }
            //     return this.inv_groups.filter(inv_group => {
            //         for (let kw of kws) {
            //             if (inv_group.material_no.includes(kw) ||
            //             inv_group.material_name.toUpperCase().includes(kw.toUpperCase()) ||
            //             inv_group.material_spec.toUpperCase().includes(kw.toUpperCase())) {
            //                 continue
            //             } else {
            //                 return false
            //             }
            //         }
            //         return true
            //     })
            // },
            get_inv_groups() {
                let inv_groups = []
                let i = 0, j = 0
                while (i < this.stk_invs.length || j < this.invs.length) {
                    let stk_inv = this.stk_invs[i]
                    let inv = this.invs[j]
                    if (!inv || (stk_inv && stk_inv[1] <= inv['FMaterialId.FNumber'])) {
                        let inv_group = inv_groups.find(x => x.material_no == stk_inv[1])
                        if (inv_group) {
                            inv_group.stk_qty += stk_inv[4]
                        } else {
                            inv_group = {
                                material_id: stk_inv[0],
                                material_no: stk_inv[1],
                                material_name: stk_inv[2],
                                material_spec: stk_inv[3],
                                material_image: inv?.['FMaterialId.FImageFileServer'],
                                stk_qty: stk_inv[4],
                                qty: 0,
                                unit_name: stk_inv[5],
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
            // set_inv_groups() {
            //     let inv_groups = []
            //     this.invs.forEach(inv => {
            //         let group = inv_groups.find(x => x.material_id == inv.FMaterialId)
            //         if (group) {
            //             group.qty += inv.FQty
            //         } else {
            //             inv_groups.push({
            //                 material_id: inv.FMaterialId,
            //                 material_no: inv['FMaterialId.FNumber'],
            //                 material_name: inv['FMaterialId.FName'],
            //                 material_spec: inv['FMaterialId.FSpecification'],
            //                 material_image: inv['FMaterialId.FImageFileServer'],
            //                 qty: inv.FQty,
            //                 unit_name: inv['FStockUnitId.FName'],
            //                 thumbnail: '/static/default_40x40.png'
            //             })
            //         }
            //     })
            //     this.inv_groups = inv_groups
            // },
            async get_thumbnail() {
                uni.showLoading({ title: '0%' })
                let i = 1
                for (let obj of this.inv_groups) {
                    let res = await K3CloudApi.thumbnail_url(obj.material_image)
                    obj.thumbnail = res
                    uni.showLoading({ title: `${(i * 100 / this.inv_groups.length).toFixed(1) }%` })
                    i++
                }
                uni.hideLoading()
                uni.showToast({ title: '加载略图完毕', duration: 2000 })
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
                this.$logger.info('>>> main.registerReceiver:inbound/v1/index', this.broadcast_receiver)
            },
            unreg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                main.unregisterReceiver(this.broadcast_receiver)
                this.$logger.info('>>> main.unregisterReceiver:inbound/v1/index', this.broadcast_receiver)
            },
            // #endif
        }
    }
</script>

<style lang="scss" scoped>
    .thumbnail {
        width: 40px;
        height: 40px;
        display: block;
    }
</style>
