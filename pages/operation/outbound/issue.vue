<template>
    <!-- 搜素 -->
    <uni-section :title="breadcrumb_stockname()" type="square" title-color="#007aff" @click="$logger.info('>>>', $data)">
        <template #right>
            <text class="text-grey text-sm">{{ multiuser ? '多人' : '单人' }}</text>
            <switch @change="switch_click" style="transform:scale(0.7)"/>
        </template>
        <view class="searchbar-container">
            <uni-forms ref="search_form">
                <uni-forms-item label="单据编号">
                    <uni-easyinput
                        v-model="search_form.bill_no" 
                        placeholder="请输入单据编号"
                        prefix-icon="scan"
                        @confirm="handle_search"
                        @clear="handle_search"
                        @icon-click="searchbar_icon_click"
                        primary-color="rgb(238, 238, 238)"
                        :styles="{
                            color: '#000',
                            backgroundColor: 'rgb(238, 238, 238)',
                            borderColor: 'rgb(238, 238, 238)',
                            height: '60px'
                        }"
                    />
                </uni-forms-item>
            </uni-forms>
        </view>
    </uni-section>
    <!-- 分配库位 -->
    <uni-section v-if="scfl.length" title="子项物料明细" type="square" sub-title="点击或扫描物料编码进入下一步" sub-title-color="#007aff" class="above-uni-goods-nav">
        <uni-list>
            <uni-list-item v-for="(obj, index) in scfl_filtered" :key="index"
                @click="allocate_loc_no(obj)" clickable show-arrow>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title text-bold">{{ obj.material_no }} {{ obj.material_name }}</view>
                        <view class="note">
                            <view>{{ obj.material_spec }}</view>
                            <view>
                                仓库：<text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text>,
                                <text>仓管员：{{ obj.storekeeper }}</text>
                            </view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ obj.must_qty }} {{ obj.unit_name }}</view>
                        <view v-if="inv_logs_map[obj.material_id]">实发 <text class="text-primary">{{ inv_logs_map[obj.material_id] }}</text> {{ obj.unit_name }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <!-- 当日生产发料提醒 -->
    <uni-section v-if="!scfl.length && scfl_todo.length" title="今日生产发料" type="square">
        <uni-card spacing="0" padding="0">
            <uni-list>
                <uni-list-item v-for="(obj, index) in scfl_todo" :key="index"
                    :extra-icon="{ type: 'chat', size: '24', color: '#007bff' }"  show-extra-icon
                    :title="obj.bill_no" :right-text="obj.prd_line"
                    @click="search_form.bill_no=obj.bill_no;handle_search();" clickable show-arrow
                    />
            </uni-list>
        </uni-card>
    </uni-section>
    
    <view v-if="$store.state.screen_type === 'app-plus'" class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <cover-image v-if="is_completed" src="/static/icon/yiwancheng_stamp.png" class="yiwancheng-stamp" />
</template>

<script>
    import store from '@/store'
    import { breadcrumb_stockname, play_audio_prompt } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { PrdIssueMtrNotice, InvLog } from '@/utils/model'
    export default {
        data() {
            return {
                scfl: [], // 发料物料
                scfl_todo: [], // 今日生产发料通知单
                inv_logs: [], // 出库日志
                inv_logs_map: {}, // 出库数量的映射
                multiuser: false,
                filter_cond: '全部',
                search_form: {
                    bill_no: '' // SCFLTZD35388
                },
                goods_nav: {
                    options: [
                        { icon: 'clear', text: '清空' },
                        { icon: 'settings', text: '全部' },
                    ],
                    button_group: [
                        { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                    ]
                }
            }
        },
        onShow() {
            if (this.search_form.bill_no) {
                this.load_inv_logs()
            }
            // #ifdef APP-PLUS
            this.reg_broadcast_receiver()
            // #endif
        },
        mounted() {
            this.handle_search()
        },
        computed: {
            is_completed() {
                let res = true
                if (this.scfl.length) {
                    for (let m of this.scfl) {
                        if (!this.inv_logs_map[m.material_id] || this.inv_logs_map[m.material_id] < m.must_qty) {
                            res = false
                            break
                        }
                    }
                } else {
                    res = false
                }
                return res
            },
            scfl_filtered() {
                if (this.filter_cond === '全部') {
                    return this.scfl
                } else if (this.filter_cond === '未出库') {
                    return this.scfl.filter(obj => obj.must_qty > (this.inv_logs_map[obj.material_id] || 0))
                } else if (this.filter_cond === '已出库') {
                    return this.scfl.filter(obj => obj.must_qty <= (this.inv_logs_map[obj.material_id] || 0))
                }
            }
        },
        methods: {
            breadcrumb_stockname,
            // 页面动作
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.search_form.bill_no = ''
                    this.handle_search()
                }
                if (e.index === 1) {
                    let item_list = ['全部', '已出库', '未出库']
                    uni.showActionSheet({
                        itemList: item_list,
                        success: (e) => {
                            this.filter_cond = item_list[e.tapIndex]
                            this.goods_nav.options[1].text = item_list[e.tapIndex]
                        }
                    })
                }
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            switch_click(e) {
                this.multiuser = e.detail.value
                this.handle_search()
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(code) {
                if (this.scfl.length) {
                    let obj = this.scfl.find(m => m.material_no == code)
                    if (obj) {
                        this.allocate_loc_no(obj)
                    } else{
                        uni.showToast({ icon: 'none', title: '物料编码不存在' })
                    }
                } else {
                    this.search_form.bill_no = code
                    this.handle_search()
                }
            },
            // 搜索
            async handle_search() {
                this.scfl = []
                this.inv_plans = []
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim().toUpperCase()
                    if (this.search_form.bill_no.match(/^\d+$/)) {
                        this.search_form.bill_no = 'SCFLTZD' + this.search_form.bill_no // 自动补充前缀
                    }
                    if (this.search_form.bill_no.startsWith('SCFLTZD')) {
                        await this.load_scfltzd()
                    }
                    // await this.load_inv_plans()
                    await this.load_inv_logs()
                }
                if (this.scfl.length) {
                    this.goods_nav.button_group[0] = { text: '扫描物料', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                } else {
                    this.goods_nav.button_group[0] = { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                }
            },
            // 选择库位
            allocate_loc_no(obj) {
                uni.navigateTo({
                    url: '/pages/operation/outbound/issue_allocate',
                    events: {
                        eventOutput: (data) => {
                            // callback
                        }
                    },
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('eventInput', { bill_no: this.search_form.bill_no, material: obj }) // 候选的库位列表
                    }
                })
            },
            // ** 加载数据 **
            // 生产发料通知单
            async load_scfltzd() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    // 区分仓管员
                    let options = { FBillNo: this.search_form.bill_no }
                    if (this.multiuser) {
                        options.FStockId = store.state.cur_stock.FStockId
                    } else {
                        options.F_PAEZ_BaseProperty1 = store.state.cur_staff.FName
                    }
                    let res = await PrdIssueMtrNotice.query(options)
                    uni.hideLoading()
                    if (res.data.length === 0) {
                        uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                        return
                    }
                    let materials = []
                    for (let d of res.data) {
                        let material = materials.find(m => m.material_id === d.FMaterialId)
                        if (material) {
                            material.must_qty += d.FMustQty
                            material.base_must_qty += d.FBaseMustQty
                        } else {
                            materials.push({
                                material_id: d.FMaterialId,
                                material_no: d['FMaterialId.FNumber'],
                                material_name: d['FMaterialId.FName'],
                                material_spec: d['FMaterialId.FSpecification'],
                                storekeeper: d['F_PAEZ_BaseProperty1'],
                                stock_id: d.FStockId,
                                stock_name: d['FStockId.FName'],
                                prd_line: d['F_PAEZ_Base.FName'],
                                must_qty: d.FMustQty,
                                unit_id: d.FUnitId1,
                                unit_name: d['FUnitId1.FName'],
                                base_must_qty: d.FBaseMustQty,
                                base_unit_id: d.FBaseUnitId1,
                                base_unit_name: d['FBaseUnitId1.FName']
                            })
                        }
                    }
                    this.scfl = materials
                } catch (err) { }
            },
            async load_inv_logs() {
                let options = { 
                    FBillNo: this.search_form.bill_no,
                    FStockId: store.state.cur_stock.FStockId, 
                    FOpType: 'out'
                }
                let meta = { fields: ['FMaterialId', 'FOpQTY'], order: 'FMaterialId ASC', return: 'array' }
                let res = await InvLog.query(options, meta)
                let inv_logs_map = {}
                for (let log of res.data) {
                    inv_logs_map[log[0]] ||= 0
                    inv_logs_map[log[0]] += log[1]
                }
                this.inv_logs_map = inv_logs_map
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
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 0;
        }
    }
</style>
