<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
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
                <uni-forms-item label="拣选区" style="margin-bottom: 0;">
                    <uni-data-select v-model="dest_loc_no" :localdata="dest_loc_no_options" :clear="false" @change="load_invs" />
                </uni-forms-item>
            </uni-forms>
        </view>
    </uni-section>
    
    <uni-section v-if="!outbound_bill.bill_no && ppboms.length" title="生产用料清单列表" type="square" sub-title="点击查看子项明细" class="above-uni-goods-nav">
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
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-card>
    </uni-section>
    
    <uni-section v-if="outbound_bill.bill_no" :title="`${bill_type_dict[outbound_bill.bill_type]}子项明细`" type="square" class="above-uni-goods-nav"
        :sub-title="entry_sub_title" sub-title-color="#007aff">
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
            
            <uni-tr v-for="(obj, index) in outbound_entry_filtered" :key="index">
                <uni-td v-if="outbound_mode == '分批'">
                    <uni-icons v-if="inv_logs_map[obj.material_id] >= obj.qty" type="paperplane" size="30" color="#007aff"></uni-icons>
                    <checkbox
                        v-else-if="can_outbound(obj)"
                        :checked="obj.checked"
                        @click="checkbox_click"
                        :data-id="obj.material_id"
                    />
                    <checkbox v-else disabled></checkbox>
                </uni-td>
                <uni-td align="center">{{ obj.seq }}</uni-td>
                <uni-td>{{ obj.material_no }}</uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.unit_name }}</uni-td>
                <uni-td align="center">{{ obj.qty }}</uni-td>
                <uni-td align="center">{{ invs_map[obj.material_id] || 0 }}</uni-td>
                <uni-td align="center">
                    <text :class="[(inv_logs_map[obj.material_id] || 0) >= obj.qty ? 'text-primary' : '']">{{ inv_logs_map[obj.material_id] }}</text>
                </uni-td>
                <uni-td><text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></uni-td>
                <uni-td>{{ obj.storekeeper }}</uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in outbound_entry_filtered" :key="index">
                <template #header v-if="outbound_mode == '分批'">
                    <view class="uni-list-item__head">
                        <uni-icons v-if="inv_logs_map[obj.material_id] >= obj.qty" type="paperplane" size="30" color="#007aff"></uni-icons>                       
                        <checkbox
                            v-else-if="can_outbound(obj)"
                            :checked="obj.checked"
                            @click="checkbox_click"
                            :data-id="obj.material_id"
                        />
                        <checkbox v-else disabled></checkbox>
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            <uni-badge :text="obj.seq" :type="obj.stock_id == $store.state.cur_stock.FStockId ? 'primary' : 'info'" />
                            {{ obj.material_no }} / {{ obj.material_name }}
                        </view>
                        <view class="note">
                            <view>规格：{{ obj.material_spec }}</view>
                            <view>仓库：<text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></view>
                            <view>单位：{{ obj.unit_name }}， {{ this.dest_loc_no }}：{{ invs_map[obj.material_id] || 0 }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>应发</view>
                        <view class="text-lg">{{ obj.qty }}</view>
                        <view>实发</view>
                        <view class="text-lg" :class="[(inv_logs_map[obj.material_id] || 0) >= obj.qty ? 'text-primary' : '']">{{ inv_logs_map[obj.material_id] || 0 }}</view>
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
    import { breadcrumb_stockname, play_audio_prompt, formatDate } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { Inv, InvLog, PrdPpbom, StkTransferDirect, StockLoc } from '@/utils/model'
    
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
                outbound_bill: {}, // 出库单据
                bill_type_dict: { 'ZJDB': '直接调拨单', 'PPBOM': '生产用料清单' },
                invs: [],          // 拆包区库存
                invs_map: {},      // 优化库存查询性能
                inv_logs: [],      // 实发物料
                inv_logs_map: {},  // 优化实发查询性能
                filter_cond: '全部',
                outbound_mode: '齐套', // 出库模式，齐套/分批
                new_inv_logs: [],  // 缓存待提交出库的日志报文，集中一次性提交，保持幂等性
                goods_nav: {
                    options: [
                        { icon: 'settings', text: '全部'},
                        { icon: 'star-filled', text: '齐套' },
                        // { icon: 'more-filled', text: '选项' }
                    ],
                    button_group: [
                        { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '确认出库', backgroundColor: store.state.goods_nav_color.grey, color: '#fff' }
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
            this.load_dest_loc_nos()
        },
        computed: {
            outbound_entry_filtered() {
                if (this.filter_cond === '全部') {
                    return this.outbound_bill.entry
                } else if (this.filter_cond === '未出库') {
                    return this.outbound_bill.entry.filter(m => (this.inv_logs_map[m.material_id] || 0) < m.qty )
                } else if (this.filter_cond === '可出库') {
                    return this.outbound_bill.entry.filter(m => this.can_outbound (m))
                } else if (this.filter_cond === '已出库') {
                    return this.outbound_bill.entry.filter(m => (this.inv_logs_map[m.material_id] || 0) >= m.qty )
                }
            },
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
                if (this.outbound_bill.entry?.length) {
                    for (let m of this.outbound_bill.entry) {
                        if (!this.inv_logs_map[m.material_id] || this.inv_logs_map[m.material_id] < m.qty) {
                            res = false
                            break
                        }
                    }
                } else {
                    res = false
                }
                return res
            },
            entry_sub_title() {
                if (this.outbound_bill.bill_type == 'ZJDB') {
                    return [
                        `单据：${this.outbound_bill.bill_no}`
                    ].join('\n')
                } else {
                    return [
                        `单据：${this.outbound_bill.bill_no} / ${this.outbound_bill.mo_bill_no}`,
                        `产品：${this.outbound_bill.material_no} / ${ this.outbound_bill.material_name}`,
                        `规格：${this.outbound_bill.material_spec}`
                    ].join('\n')
                }
            }
        },
        methods: {
            breadcrumb_stockname,
            // operations
            goods_nav_click(e) {
                if (e.index === 0) this.filter_list()
                if (e.index === 1) this.outbound_mode_list()
                if (e.index === 2) this.more_actions()
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
            more_actions() {
                uni.showActionSheet({
                    itemList: ['全选'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.check_all()
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
                        
                        if (e.tapIndex === 1) {
                            this.goods_nav.options[2] = { icon: 'more-filled', text: '选项' }
                        } else {
                            if (this.goods_nav.options.length > 2) this.goods_nav.options.pop()
                        }
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
                return m.stock_id == store.state.cur_stock.FStockId &&
                       (this.inv_logs_map[m.material_id] || 0) < m.qty &&
                       (this.invs_map[m.material_id] ||0) > 0
            },
            check_all() {
                if (!this.outbound_bill.entry?.length) return
                let result = this.outbound_bill.entry.some(m => !m.checked && this.can_outbound(m))
                for (let m of this.outbound_bill.entry) {
                    if (this.can_outbound(m))  m.checked = result
                }
            },
            checkbox_click(e) {
                let material = this.outbound_bill.entry.find(m => m.material_id === e.target.dataset.id)
                if (material) material.checked = !material.checked
            },
            clear_data() {
                this.ppboms = []
                // this.ppbom = {}
                this.outbound_bill = {}
                this.new_inv_logs = []
                this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.grey
            },
            // 搜索
            async handle_search() {
                if (this.search_form.bill_no) {
                    this.clear_data()
                    if (this.search_form.bill_no.startsWith('ZJDB')) {
                        await this.load_zjdb()
                    } else {
                        await this.load_ppboms()
                    }
                }  
            },
            async load_dest_loc_nos() {
                // let res = await StockLoc.query({ FGroup_lk: '拣选区', FStockId: store.state.cur_stock.FStockId })
                let res = await StockLoc.get_picking_area()
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
                    order: 'FReplaceGroup ASC'
                }
                uni.showLoading({ title: 'Loading' })
                let res = await PrdPpbom.query(options, meta)
                uni.hideLoading()
                let outbound_bill = {
                    bill_type: 'PPBOM',
                    bill_no: obj.FBillNo,
                    mo_bill_no: obj.FMoBillNo,
                    material_no: obj['FMaterialId.FNumber'],
                    material_name: obj['FMaterialId.FName'],
                    material_spec: obj['FMaterialId.FSpecification'],
                    entry: []
                }
                for (let d of res.data) {
                    let m = outbound_bill.entry.find(m => m.material_id == d['FMaterialId2'])
                    if (m) {
                        m.qty += d['FMustQty']
                    } else {
                        outbound_bill.entry.push({
                            seq: d['FReplaceGroup'],
                            material_id: d['FMaterialId2'],
                            material_no: d['FMaterialId2.FNumber'],
                            material_name: d['FMaterialId2.FName'],
                            material_spec: d['FMaterialId2.FSpecification'],
                            qty: d['FMustQty'],
                            unit_name: d['FUnitId2.FName'],
                            stock_id: d['FStockId'],
                            stock_name: d['FStockId.FName'],
                            storekeeper: d['FMaterialId2.F_PAEZ_Base1']
                        })
                    }
                }
                this.outbound_bill = outbound_bill
                await this.load_invs()
                await this.load_inv_logs()
                this.goods_nav.button_group[1].backgroundColor = this.is_completed ? store.state.goods_nav_color.grey : store.state.goods_nav_color.blue
            },
            async load_zjdb() {
                let options = { FBillNo: this.search_form.bill_no.trim(), FQty_gt: 0 }
                let meta = {
                    fields: ['FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FQty', 'FUnitId.FName',
                             'FSrcStockId', 'FSrcStockId.FName', 'FDestStockId', 'FDestStockId.FName', 'FMaterialId.F_PAEZ_Base1' ]
                }
                uni.showLoading({ title: 'Loading' })
                let res = await StkTransferDirect.query(options, meta)
                uni.hideLoading()
                let outbound_bill = {
                    bill_type: 'ZJDB',
                    bill_no: this.search_form.bill_no.trim(),
                    entry: []
                }
                let seq = 1
                for (let d of res.data) {
                    let m = outbound_bill.entry.find(m => m.material_id == d['FMaterialId'])
                    if (m) {
                        m.qty += d['FQty']
                    } else {
                        outbound_bill.entry.push({
                            seq: seq,
                            material_id: d['FMaterialId'],
                            material_no: d['FMaterialId.FNumber'],
                            material_name: d['FMaterialId.FName'],
                            material_spec: d['FMaterialId.FSpecification'],
                            qty: d['FQty'],
                            unit_name: d['FUnitId.FName'],
                            stock_id: d['FSrcStockId'],
                            stock_name: d['FSrcStockId.FName'],
                            dest_stock_id: d['FDestStockId'],
                            dest_stock_name: d['FDestStockId.FName'],
                            storekeeper: d['FMaterialId.F_PAEZ_Base1']
                        })
                        seq++
                    }
                }
                this.outbound_bill = outbound_bill
                await this.load_invs()
                await this.load_inv_logs()
                this.goods_nav.button_group[1].backgroundColor = this.is_completed ? store.state.goods_nav_color.grey : store.state.goods_nav_color.blue
            },
            async load_invs() {
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
                let res = await InvLog.query({ FBillNo_lk: this.outbound_bill.bill_no, FStockId: store.state.cur_stock.FStockId, FOpType: 'out' })
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
                if (!this.outbound_bill.bill_no) return // 1. 是否有生产订单数据
                if (this.is_completed) return // 2. 是否已完成生产订单
                // 3. 拆包区库存是否有充足
                let checked_materials = this.outbound_bill.entry
                if (this.outbound_mode == '分批') {
                    checked_materials = this.outbound_bill.entry.filter(m => m.checked)
                    if (checked_materials.length === 0) {
                        uni.showModal({ title: '提示', content: '未勾选出库信息' })
                        return
                    }
                }

                if (this.outbound_mode == '齐套') {
                    let op_cnt = 0
                    for (let m of this.outbound_bill.entry) {
                        if (m.stock_id != store.state.cur_stock.FStockId) continue
                        if (m.qty === 0) continue
                        if (m.qty - (this.inv_logs_map[m.material_id] || 0) > (this.invs_map[m.material_id] || 0)) {
                            uni.showModal({ title: '提示', content: `拆包区库存不足\n[${ m.seq }]${ m.material_name }\n剩余应发：${m.qty - (this.inv_logs_map[m.material_id] || 0)}\n拆包区：${this.invs_map[m.material_id] || 0}` })
                            return
                        }
                        op_cnt++
                    }
                    if (op_cnt === 0) {
                        uni.showModal({ title: '提示', content: `出库清单中不含[${store.state.cur_stock.FName}]的物料` })
                        return
                    }
                }
                
                // >>> main
                uni.showLoading({ title: 'Loading', mask: true })
                if (this.new_inv_logs.length === 0) {
                    for (let m of checked_materials) {
                        if (m.stock_id != store.state.cur_stock.FStockId) continue
                        if (m.qty === 0) continue
                        let invs = this.invs.filter(inv => inv.FMaterialId === m.material_id)
                        let rest_must_qty = m.qty - (this.inv_logs_map[m.material_id] || 0) // 剩余应发数量
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
                                FBillNo: this.outbound_bill.bill_type === 'PPBOM' ? `${this.outbound_bill.bill_no},${this.outbound_bill.mo_bill_no}` : this.outbound_bill.bill_no,
                                FOpStaffNo: store.state.cur_staff.FNumber
                            })
                            this.new_inv_logs.push(inv_log)
                            rest_must_qty -= op_qty
                        }
                        m.checked = false
                    }
                } else {
                    this.$logger.warn(">>> double click")
                }
                // 统一分配操作序号，统一提交保存，防重复提交
                for (let i = 0; i < this.new_inv_logs.length; i++) {
                    uni.showToast({ title: `${i}/${this.new_inv_logs.length}`, mask: true })
                    await this.new_inv_logs[i].save()
                }
                await this.load_invs()
                await this.load_inv_logs()
                this.new_inv_logs = []
                uni.hideLoading()
                uni.showToast({ title: '出库成功', mask: true })
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

<style>

</style>
