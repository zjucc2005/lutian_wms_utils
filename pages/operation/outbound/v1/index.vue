<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        sub-title-color="#007aff"
        @click="$logger.info('>>>', this.$data)"
        >
        <view class="searchbar-container">
            <uni-forms ref="search_form">
                <uni-forms-item label="单据编号">
                    <uni-easyinput
                        v-model="search_form.bill_no" 
                        placeholder="请输入单据编号"
                        prefix-icon="scan"
                        @confirm="handle_search"
                        @clear="clear_data"
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
                <uni-forms-item label="拆包区" style="margin-bottom: 0;">
                    <uni-data-select v-model="dest_loc_no" :localdata="dest_loc_no_options" :clear="false" @change="load_invs" />
                </uni-forms-item>
            </uni-forms>
        </view>
    </uni-section>
    
    <uni-section v-if="!ppbom.FID && ppboms.length" title="生产用料清单列表" type="square" sub-title="点击查看子项明细" class="above-uni-goods-nav">
        <uni-card spacing="0" padding="0">
            <uni-list>
                <uni-list-item v-for="(obj, index) in ppboms" :key="index"
                    @click="load_ppbom(obj)" clickable 
                    show-arrow
                    >
                    <template #body>
                        <view class="uni-list-item__body">
                            <view class="title">
                                <uni-badge :text="`${obj.FMoEntrySeq}`" type="primary" />
                                {{ obj.FBillNo }}
                            </view>
                            <view class="note">
                                <view>产品编码：{{ obj['FMaterialId.FNumber'] }}</view>
                                <view>产品名称：{{ obj['FMaterialId.FName'] }}</view>
                                <view>规格型号：{{ obj['FMaterialId.FSpecification'] }}</view>
                            </view>
                        </view>
                    </template>
                    <template #footer>
                        <view class="uni-list-item__foot">
                            <view>{{ obj.FQty }} {{ obj['FUnitId.FName'] }}</view>
                            <!-- <view class="text-primary">{{ 'status' }}</view> -->
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-card>
    </uni-section>
    
    <uni-section v-if="ppbom.FID" title="生产用料清单子项明细" type="square" class="above-uni-goods-nav"
        :sub-title="[
            `单据：${ppbom.FBillNo} / ${ppbom.FMoBillNo}`,
            `产品：${ppbom['FMaterialId.FNumber']} / ${ppbom['FMaterialId.FName']}`,
            `规格：${ppbom['FMaterialId.FSpecification']}`
        ].join('\n')"
        sub-title-color="#007aff"
        >
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th v-if="outbound_mode == '分批'" align="center" width="30"></uni-th>
                <uni-th align="center" width="60">项次</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">应发数量</uni-th>
                <uni-th align="center">{{ this.dest_loc_no }}</uni-th>
                <uni-th align="center">实发数量</uni-th>
                <uni-th align="center">仓库</uni-th>
                <uni-th align="center">仓管员</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in ppbom_entry_filtered" :key="index">
                <uni-td v-if="outbound_mode == '分批'">
                    <uni-icons v-if="inv_logs_map[obj.FMaterialId2] >= obj.FMustQty" type="paperplane" size="30" color="#007aff"></uni-icons>
                    <checkbox
                        v-else-if="can_outbound(obj)"
                        :checked="obj.checked"
                        @click="checkbox_click"
                        :data-id="obj.FMaterialId2"
                    />
                    <checkbox v-else disabled></checkbox>
                </uni-td>
                <uni-td align="center">{{ obj.FReplaceGroup }}</uni-td>
                <uni-td>{{ obj['FMaterialId2.FNumber'] }}</uni-td>
                <uni-td>{{ obj['FMaterialId2.FName'] }}</uni-td>
                <uni-td>{{ obj['FMaterialId2.FSpecification'] }}</uni-td>
                <uni-td align="center">{{ obj['FUnitId2.FName'] }}</uni-td>
                <uni-td align="center">{{ obj.FMustQty }}</uni-td>
                <uni-td align="center">{{ invs_map[obj.FMaterialId2] || 0 }}</uni-td>
                <uni-td align="center">
                    <text :class="[(inv_logs_map[obj['FMaterialId2']] || 0) >= obj['FMustQty'] ? 'text-primary' : '']">{{ inv_logs_map[obj.FMaterialId2] }}</text>
                </uni-td>
                <uni-td><text :class="[obj.FStockId == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj['FStockId.FName'] }}</text></uni-td>
                <uni-td>{{ obj['FMaterialId2.F_PAEZ_Base1'] }}</uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in ppbom_entry_filtered" :key="index">
                <template #header v-if="outbound_mode == '分批'">
                    <view class="uni-list-item__head">
                        <uni-icons v-if="inv_logs_map[obj.FMaterialId2] >= obj.FMustQty" type="paperplane" size="30" color="#007aff"></uni-icons>                       
                        <checkbox
                            v-else-if="can_outbound(obj)"
                            :checked="obj.checked"
                            @click="checkbox_click"
                            :data-id="obj.FMaterialId2"
                        />
                        <checkbox v-else disabled></checkbox>
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            <uni-badge :text="`${obj.FReplaceGroup}`" :type="obj['FStockId'] == $store.state.cur_stock.FStockId ? 'primary' : 'info'" />
                            {{ obj['FMaterialId2.FNumber'] }} / {{ obj['FMaterialId2.FName'] }}
                        </view>
                        <view class="note">
                            <view>规格：{{ obj['FMaterialId2.FSpecification'] }}</view>
                            <view>仓库：<text :class="[obj['FStockId'] == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj['FStockId.FName'] }}</text></view>
                            <view>单位：{{ obj['FUnitId2.FName'] }}， {{ this.dest_loc_no }}：{{ invs_map[obj['FMaterialId2']] || 0 }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>应发</view>
                        <view class="text-lg">{{ obj['FMustQty'] }}</view>
                        <view>实发</view>
                        <view class="text-lg" :class="[(inv_logs_map[obj['FMaterialId2']] || 0) >= obj['FMustQty'] ? 'text-primary' : '']">{{ inv_logs_map[obj['FMaterialId2']] || 0 }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
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
    <cover-image v-if="is_completed" src="/static/icon/yiwancheng_stamp.png" class="yiwancheng-stamp" />
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt, formatDate } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { Inv, InvLog, PrdPpbom, StockLoc } from '@/utils/model'
    
    export default {
        data() {
            return {
                broadcast_receiver: null,
                search_form: {
                    bill_no: '', // 生产订单编号
                },
                dest_loc_no: '',
                dest_loc_no_options: [],
                ppboms: [],
                ppbom: {},
                invs: [],          // 拆包区库存
                invs_map: {},      // 优化库存查询性能
                inv_logs: [],      // 实发物料
                inv_logs_map: {},  // 优化实发查询性能
                filter_cond: '全部',
                outbound_mode: '齐套', // 出库模式，齐套/分批
                goods_nav: {
                    options: [
                        // { icon: 'clear', text: '清空' },
                        { icon: 'settings', text: '全部'},
                        { icon: 'star-filled', text: '齐套' }
                        
                    ],
                    button_group: [
                        { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '确认出库', backgroundColor: store.state.goods_nav_color.grey, color: '#fff' }
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
        mounted() {
            this.load_dest_loc_nos()
        },
        computed: {
            ppbom_entry_filtered() {
                if (this.filter_cond === '全部') {
                    return this.ppbom.entry
                } else if (this.filter_cond === '未出库') {
                    return this.ppbom.entry.filter(m => (this.inv_logs_map[m.FMaterialId2] || 0) < m.FMustQty )
                } else if (this.filter_cond === '可出库') {
                    return this.ppbom.entry.filter(m => this.can_outbound(m))
                } else if (this.filter_cond === '已出库') {
                    return this.ppbom.entry.filter(m => (this.inv_logs_map[m.FMaterialId2] || 0) >= m.FMustQty)
                }
            },
            is_completed() {
                // return true
                let res = true
                if (this.ppbom.entry?.length) {
                    for (let m of this.ppbom.entry) {
                        if (!this.inv_logs_map[m.FMaterialId2] || this.inv_logs_map[m.FMaterialId2] < m.FMustQty) {
                            res = false
                            break
                        }
                    }
                } else {
                    res = false
                }
                return res
            }
        },
        methods: {
            // operations
            goods_nav_click(e) {
                // if (e.index === 0) {
                //     this.search_form.bill_no = ''
                //     this.clear_data()
                // }
                if (e.index === 0) this.filter_list()
                if (e.index === 1) this.outbound_mode_list()
            },
            filter_list() {
                let item_list = ['全部', '未出库', '可出库', '已出库']
                uni.showActionSheet({
                    itemList: item_list,
                    success: (e) => {
                        this.filter_cond = item_list[e.tapIndex]
                        this.goods_nav.options[0].text = item_list[e.tapIndex]
                    }
                })
            },
            outbound_mode_list() {
                let item_list = ['齐套', '分批']
                uni.showActionSheet({
                    itemList: item_list,
                    success: (e) => {
                        this.outbound_mode = item_list[e.tapIndex]
                        this.goods_nav.options[1].icon = ['star-filled', 'starhalf'][e.tapIndex]
                        this.goods_nav.options[1].text = item_list[e.tapIndex]
                    }
                })
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code()       // btn:扫码查询单据
                if (e.index === 1) this.submit_outbound() // btn:提交出库
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
                this.search_form.bill_no = code
                this.handle_search()
            },
            can_outbound(m) {
                // 本仓库 && 未（完全）出库 && 有库存
                return m.FStockId == store.state.cur_stock.FStockId &&
                       (this.inv_logs_map[m.FMaterialId2] || 0) < m.FMustQty && 
                       (this.invs_map[m.FMaterialId2] || 0) > 0
            },
            check_all() {
                let result = this.ppbom.entry.some(m => !m.checked && this.can_outbound(m))
                for (let m of this.ppbom.entry) {
                    if (this.can_outbound(m))  m.checked = result
                }
            },
            checkbox_click(e) {
                let material = this.ppbom.entry.find(m => m.FMaterialId2 === e.target.dataset.id)
                if (material) material.checked = !material.checked
            },
            clear_data() {
                this.ppboms = []
                this.ppbom = {}
                this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.grey
            },
            // 搜索
            async handle_search() {
                if (this.search_form.bill_no) {
                    this.clear_data()
                    await this.load_ppboms()
                }  
            },
            async load_dest_loc_nos() {
                let res = await StockLoc.query({ FGroup_lk: '拆包区', FStockId: store.state.cur_stock.FStockId })
                let options = []
                for (let obj of res.data) {
                    options.push({ text: obj.FNumber, value: obj.FNumber })
                }
                this.dest_loc_no_options = options
                this.dest_loc_no = options[0]?.value
            },
            async load_ppboms() {
                let options = { FMoBillNo: this.search_form.bill_no }
                let meta = {
                    fields: ['FID', 'FBillNo', 'FMoBillNo', 'FMoEntrySeq',
                             'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                             'FBOMID.FNumber', 'FQty', 'FUnitId.FName'],
                    replace_fields: true,
                    order: 'FMoEntrySeq ASC'
                }
                uni.showLoading({ title: 'Loading' })
                let res = await PrdPpbom.query(options, meta)
                uni.hideLoading()
                if (res.data.length) {
                    if (res.data.length == 1) this.load_ppbom(res.data[0])
                    this.ppboms = res.data
                } else {
                    this.ppboms = []
                    uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                }
            },
            async load_ppbom(obj) {
                let options = { FBillNo: obj.FBillNo, FMustQty_gt: 0 }
                let meta = {
                    fields: [ 'FMaterialId2', 'FMaterialId2.FNumber', 'FMaterialId2.FName', 'FMaterialId2.FSpecification', 'FMaterialId2.F_PAEZ_Base1', 'FMaterialType',
                              'FNumerator', 'FDenominator', 'FUnitId2.FName', 'FMustQty', 'FStockId', 'FStockId.FName', 'FReplaceGroup'],
                    replace_fields: true,
                    order: 'FReplaceGroup ASC'
                }
                uni.showLoading({ title: 'Loading' })
                let res = await PrdPpbom.query(options, meta)
                uni.hideLoading()
                this.ppbom = { ...obj, entry: res.data }
                await this.load_invs()
                await this.load_inv_logs()
                this.goods_nav.button_group[1].backgroundColor = this.is_completed ? store.state.goods_nav_color.grey : store.state.goods_nav_color.blue
            },
            async load_invs() {
                // let res = await Inv.get_all({ FStockId: store.state.cur_stock.FStockId, 'FStockLocId.FName_lk': '拆包区' }, { order: 'FBatchNo ASC' })
                let res = await Inv.get_all({ FStockId: store.state.cur_stock.FStockId, 'FStockLocId.FName': this.dest_loc_no }, { order: 'FBatchNo ASC' })
                this.invs = res
                let invs_map = {}
                for (let inv of this.invs) {
                    invs_map[inv.FMaterialId] ||= 0
                    invs_map[inv.FMaterialId] += inv.FQty
                }
                this.invs_map = invs_map
            },
            async load_inv_logs() {
                let res = await InvLog.query({ FBillNo_lk: this.ppbom.FBillNo, FStockId: store.state.cur_stock.FStockId, FOpType: 'out' })
                this.inv_logs = res.data
                let inv_logs_map = {}
                for (let inv_log of this.inv_logs) {
                    inv_logs_map[inv_log.FMaterialId] ||= 0
                    inv_logs_map[inv_log.FMaterialId] += inv_log.FOpQTY
                }
                this.inv_logs_map = inv_logs_map
            },
            async submit_outbound(){
                // >>> validation
                if (!this.ppbom.FID) return   // 1. 是否有生产订单数据
                if (this.is_completed) return // 2. 是否已完成生产订单
                // 3. 拆包区库存是否有充足
                let checked_materials = this.ppbom.entry
                if (this.outbound_mode == '分批') {
                    checked_materials = this.ppbom.entry.filter(m => m.checked)
                    if (checked_materials.length === 0) {
                        uni.showModal({ title: '提示', content: '未勾选出库信息' })
                        return
                    }
                }

                if (this.outbound_mode == '齐套') {
                    let op_cnt = 0
                    for (let m of this.ppbom.entry) {
                        if (m.FStockId != store.state.cur_stock.FStockId) continue
                        if (m.FMustQty === 0) continue
                        if (m.FMustQty - (this.inv_logs_map[m.FMaterialId2] || 0) > (this.invs_map[m.FMaterialId2] || 0)) {
                            uni.showModal({ title: '提示', content: `拆包区库存不足\n[${m.FReplaceGroup}]${m['FMaterialId2.FName']}\n剩余应发：${m.FMustQty - (this.inv_logs_map[m.FMaterialId2] || 0)}\n拆包区：${this.invs_map[m.FMaterialId2] || 0}` })
                            return
                        }
                        op_cnt++
                    }
                    if (op_cnt === 0) {
                        uni.showModal({ title: '提示', content: `生产用料清单中不含[${store.state.cur_stock.FName}]的物料` })
                        return
                    }
                }
                
                // >>> main
                uni.showLoading({ title: 'Loading', mask: true })
                for (let m of checked_materials) {
                    uni.showToast({ title: `${m.FReplaceGroup}/${this.ppbom.entry.length}`, mask: true })
                    if (m.FStockId != store.state.cur_stock.FStockId) continue
                    if (m.FMustQty === 0) continue
                    let invs = this.invs.filter(inv => inv.FMaterialId === m.FMaterialId2)
                    let rest_must_qty = m.FMustQty - (this.inv_logs_map[m.FMaterialId2] || 0) // 剩余应发数量
                    for (let inv of invs) {
                        if (rest_must_qty === 0) break // 分配完毕，跳出循环
                        let op_qty = inv.FQty >=  rest_must_qty ? rest_must_qty : inv.FQty
                        let inv_log = new InvLog({
                            FOpType: 'out',
                            FStockId: store.state.cur_stock.FStockId,
                            FStockLocNo: inv['FStockLocId.FNumber'],
                            FMaterialId: inv.FMaterialId,
                            FOpQTY: op_qty,
                            FBatchNo: inv.FBatchNo,
                            FSupplierId: inv.FSupplierId,
                            FBillNo: `${this.ppbom.FBillNo},${this.ppbom.FMoBillNo}`,
                            FOpStaffNo: store.state.cur_staff.FNumber
                        })
                        await inv_log.save()
                        rest_must_qty -= op_qty
                    }
                    m.checked = false
                }
                await this.load_invs()
                await this.load_inv_logs()
                uni.hideLoading()
                uni.showToast({ title: '出库成功', mask: true })
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
                this.$logger.info('>>> main.registerReceiver:outbound/v1/index', this.broadcast_receiver)
            },
            unreg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                main.unregisterReceiver(this.broadcast_receiver)
                this.$logger.info('>>> main.unregisterReceiver:outbound/v1/index', this.broadcast_receiver)
            },
            // #endif
        }
    }
</script>

<style>

</style>
