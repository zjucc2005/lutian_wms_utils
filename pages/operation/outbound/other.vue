<template>
    <uni-section title="1. 查询出库单据" type="square"
        :sub-title="breadcrumb_stockname()" sub-title-color="#007aff" @click="debug">
        <view class="container">
            <uni-forms ref="search_form" :model="search_form" :label-width="72" class="search-form">
                <uni-forms-item label="单据编号">
                    <uni-easyinput v-model="search_form.bill_no" trim placeholder="出库申请单、调拨申请单、生产发料通知单" @confirm="load_bill" />
                </uni-forms-item>
            </uni-forms>
            <button type="primary" size="mini" @click="load_bill">搜索</button>
            <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
        </view>
    </uni-section>
    
    <uni-section v-if="bill.bill_no" title="2. 出库扫码" type="square">
        <view class="container">
            <uni-forms 
                ref="form"
                :model="form"
                :rules="form_rules"
                label-position="top"
                label-width="80px"
                err-show-type="modal"
                :border="true"
                class="scan-form"
                >
                <uni-forms-item label="物料编码" name="material_no">
                    <template #label>
                        <view style="display: flex; justify-content: space-between;">
                            <view class="uni-forms-item__label">物料编码</view>
                            <view v-if="material" class="text-grey" style="flex: 1; text-align: right;">{{ material?.FName ? [material?.FName, material?.FSpecification].join('; ') : '' }}</view>
                        </view>
                    </template>
                    <uni-easyinput 
                        v-model="form.material_no" trim
                        @change="handle_material_no_change"
                        @clear="handle_material_no_change"
                        :input-border="false">
                        <template #left>
                            <uni-icons v-if="material.FMaterialId" type="checkbox-filled" size="24" color="#67c23a"></uni-icons>
                            <uni-icons v-else-if="form.material_no && !material.FMaterialId" type="help-filled" size="24" color="#c0c4cc"></uni-icons>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
                <uni-forms-item label="库位号" name="loc_no">
                    <template #label>
                        <view style="display: flex; justify-content: space-between;">
                            <view class="uni-forms-item__label">库位号</view>
                            <view class="text-grey" style="flex: 1; text-align: right;">{{ $store.state.stock_locs.find(x => x.FNumber == form.loc_no.toUpperCase())?.FRemark }}</view>
                        </view>
                    </template>
                    <uni-easyinput v-model="form.loc_no" trim :input-border="false">
                        <template #left>
                            <uni-icons v-if="form.loc_no && $store.state.stock_locs.some(x => x.FNumber == form.loc_no.toUpperCase() && x.FForbidStatus == 'A')" type="checkbox-filled" size="24" color="#67c23a"></uni-icons>
                            <uni-icons v-else-if="form.loc_no" type="clear" size="24" color="#dd524d"></uni-icons>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
                <uni-forms-item label="出库数量" name="qty">
                    <uni-easyinput ref="form_qty" v-model="form.qty" type="number" :clearable="false" :input-border="false">
                        <template #left>
                            <uni-icons v-if="form.qty && form.qty > 0" type="checkbox-filled" size="24" color="#67c23a"></uni-icons>
                            <uni-icons v-else-if="form.qty" type="help-filled" size="24" color="#c0c4cc"></uni-icons>
                        </template>
                        <template #right>
                            <text class="easyinput-suffix-text">{{ material?.['FBaseUnitId.FName'] || 'Pcs' }}</text>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
            </uni-forms>
        </view>
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
    
    <uni-drawer ref="entity_drawer" mode="left" :width="$store.state.drawer_width" >
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section :title="`出库物料明细 ${bill.bill_no}`" type="square" sub-title="可点击物料编码自动填入表单">
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.entity_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list>
                    <uni-list-item v-for="(obj, index) in bill.entity" :key="index">
                        <template #body>
                            <view class="uni-list-item__body">
                                <text class="title text-bold">
                                    <text class="text-primary text-underline" @click="select_material_no(obj.material_no)">{{ obj.material_no }}</text>
                                    {{ obj.material_name }}
                                </text>
                                <view class="note">
                                    <view>{{ obj.material_spec }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <view><text class="text-primary">{{ obj.send_qty }}</text> / {{ obj.must_qty }} {{ obj.unit }}</view>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
</template>

<script>
    import store from '@/store'
    import { breadcrumb_stockname, play_audio_prompt } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { BdMaterial, Inv, InvLog, StkOutStockApply, StkTransferApply, PrdIssueMtrNotice } from '@/utils/model'
    
    export default {
        data() {
            return {
                action_disabled: false,
                bill: { bill_no: '', entity: [] },
                material: {},
                invs: [],
                new_inv_logs: [],
                search_form: { bill_no: '' }, // 出库申请单，调拨申请单，生产发料通知单号
                form: {
                    material_no: '', // 1.01.01.06.0003
                    loc_no: '', // WL01-A02-101
                    qty: null
                },
                form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编码不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (!this.material.FMaterialId) return callback('物料编码不存在')
                                }
                            }
                        ]
                    },
                    loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let stock_loc = store.state.stock_locs.find(x => x.FNumber == value.toUpperCase())
                                    if (!stock_loc) return callback('库位号不存在')
                                    if (stock_loc.FForbidStatus == 'B') return callback('库位号不可用')
                                }
                            }
                        ]
                    },
                    qty: {
                        rules: [
                            { required: true, errorMessage: '出库数量不能为空' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('出库数量必须大于0')
                                }
                            } 
                        ]
                    }
                },
                goods_nav: {
                    options: [
                        { icon: 'clear', text: '清空' },
                        { icon: 'right', text: '明细' }
                    ],
                    button_group: [
                        { text: '扫码', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '提交出库', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
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
            
        },
        computed: {
            sum_available_qty() {
                let res = 0
                for (let inv of this.invs) res += inv.available_qty
                return res
            },
            bill_has_material_no() {
                if (!this.form.material_no) return false
                return this.bill.entity.some(e => e.material_no == this.form.material_no)
            }
        },
        methods: {
            breadcrumb_stockname,
            debug() {
                this.$logger.info('>>>', this.$data)
            },
            goods_nav_click(e) {
                if (e.index === 0) this.reset_form()
                if (e.index === 1) this.open_entity_drawer()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) {
                    if (this.bill?.bill_type == '生产发料通知单') {
                        this.submit_outbound_unlimited()
                    } else {
                        this.submit_outbound() // btn:提交出库
                    }
                } 
            },
            select_material_no(material_no) {
                this.form.material_no = material_no
                this.handle_material_no_change()
                this.$refs.entity_drawer.close()
            },
            handle_material_no_change() {
                if (this.form.material_no) {
                    this.load_material()
                } else {
                    this.material = {}
                }
            },
            open_entity_drawer() {
                if (this.bill.bill_no && ['出库申请单', '调拨申请单'].includes(this.bill.bill_type)) {
                    this.$refs.entity_drawer.open()
                    this.load_outbound_qty_all()
                } else {
                    uni.showToast({ icon: 'none' ,title: '没有相关信息' })
                }
            },
            reset_form() {
                this.form = { material_no: '', loc_no: '', qty: null }
                this.material = {}
            },
            reset_search_form() {
                this.search_form = { bill_no: '' }
                this.bill = {}
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(text) {
                if (text.startsWith('CKSQD') || text.startsWith('DBSQ') || text.startsWith('SCFLTZD')) {
                    this.search_form.bill_no = text
                    this.load_bill()
                } else {
                    if (!this.bill.bill_no) return
                    let field = 'material_no'
                    let no = text
                    if (text.includes('||')) {
                        no = text.split('||')[1]
                    } else if (text.includes('-') && !text.includes('.')) {
                        field = 'loc_no'
                    }
                    if (field == 'material_no') {
                        this.form.material_no = no
                        this.handle_material_no_change()
                    } else {
                        this.form.loc_no = no
                    }
                }
            },
            async load_bill() {
                try {
                    if (this.action_disabled) return
                    this.action_disabled = true
                    if (this.search_form.bill_no) {
                        this.search_form.bill_no = this.search_form.bill_no.toUpperCase()
                        if (this.search_form.bill_no.startsWith('CKSQD')) {
                            await this.load_cksq() // 出库申请单
                        } else if (this.search_form.bill_no.startsWith('DBSQ')) {
                            await this.load_dbsq() // 调拨申请单
                        } else if (this.search_form.bill_no.startsWith('SCFLTZD')) {
                            await this.load_scfl() // 生产发料通知单
                        } else {
                            uni.showToast({ icon: 'none', title: '非法单据编号' })
                        }
                    } else {
                        uni.showToast({ icon: 'none', title: '请输入单据编号' })
                        this.reset_search_form()
                    }
                } catch (err) {
                    this.$logger.info('err', err)
                } finally {
                    uni.hideLoading()
                    this.action_disabled = false
                }
            },
            async load_cksq() {
                uni.showLoading({ title: 'Loading', mask: true })
                let res = await StkOutStockApply.query({ FBillNo: this.search_form.bill_no }, 
                        { fields: ['FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FQty', 'FUnitId.FName'], return: 'array' })
                uni.hideLoading()
                if (res.data.length === 0) {
                    uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                    this.reset_search_form()
                    return
                }
                let entity = []
                for (let d of res.data) {
                    let item = entity.find(e => e.material_no == d[1])
                    if (item) {
                        item.must_qty += d[4]
                    } else {
                        entity.push({ material_id: d[0], material_no: d[1], material_name: d[2], material_spec: d[3], must_qty: d[4], unit: d[5], send_qty: 0 })
                    }
                }
                this.bill = { bill_no: this.search_form.bill_no, bill_type: '出库申请单', entity }
            },
            async load_dbsq() {
                uni.showLoading({ title: 'Loading', mask: true })
                let res = await StkTransferApply.query({ FBillNo: this.search_form.bill_no }, 
                        { fields: ['FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FQty', 'FUnitId.FName'], return: 'array' })
                uni.hideLoading()
                if (res.data.length === 0) {
                    uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                    this.reset_search_form()
                    return
                }
                let entity = []
                for (let d of res.data) {
                    let item = entity.find(e => e.material_no == d[1])
                    if (item) {
                        item.must_qty += d[4]
                    } else {
                        entity.push({ material_id: d[0], material_no: d[1], material_name: d[2], material_spec: d[3], must_qty: d[4], unit: d[5], send_qty: 0 })
                    }
                }
                this.bill = { bill_no: this.search_form.bill_no, bill_type: '调拨申请单', entity }
            },
            async load_scfl() {
                uni.showLoading({ title: 'Loading', mask: true })
                let res = await PrdIssueMtrNotice.query({ FBillNo: this.search_form.bill_no }, { fields: ['FBillNo'], return: 'array' })
                uni.hideLoading()
                if (res.data.length === 0) {
                    uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                    this.reset_search_form()
                    return
                }
                let entity = []
                this.bill = { bill_no: this.search_form.bill_no, bill_type: '生产发料通知单', entity }
            },
            // 加载物料信息
            async load_material() {
                let res = await BdMaterial.query(
                    { FNumber: this.form.material_no, FUseOrgId: store.state.cur_stock.FUseOrgId },
                    { fields: ["FMaterialId", "FName", "FNumber", "FSpecification", "FBaseUnitId.FName"] })
                if (res.data.length) {
                    this.material = res.data[0]
                } else {
                    this.material = {}
                }
            },
            // 获取已出库数量
            async load_outbound_qty() {
                let options = {
                    FStockId: store.state.cur_stock.FStockId,
                    FOpType: 'out',
                    'FMaterialId.FNumber': this.form.material_no,
                    'FBillNo': this.bill.bill_no,
                }
                let res = await InvLog.sum_qty(options)
                for (let e of this.bill.entity) {
                    if (e.material_no == this.form.material_no) e.send_qty = res
                }
            },
            async load_outbound_qty_all() {
                let options = {
                    FStockId: store.state.cur_stock.FStockId,
                    FOpType: 'out',
                    'FBillNo': this.bill.bill_no,
                }
                uni.showLoading({ title: 'Loading', mask: true })
                let res = await InvLog.query(options, { fields: ['FMaterialId.FNumber', 'FOpQTY'], return: 'array' })
                uni.hideLoading()
                let h = {}
                for (let d of res.data) {
                    h[d[0]] ||= 0
                    h[d[0]] += d[1]
                }
                for (let e of this.bill.entity) {
                    e.send_qty = h[e.material_no] || 0
                }
            },
            // 加载库存明细
            async load_invs() {
                let options = {
                    FStockId: store.state.cur_stock.FStockId,
                    'FMaterialId.FNumber': this.form.material_no,
                    'FStockLocId.FNumber': this.form.loc_no.toUpperCase()
                }
                let res = await Inv.query(options, { order: 'FBatchNo ASC' })
                let invs = []
                for (let d of res.data) {
                    invs.push({
                        id: d['FID'],
                        material_id: d['FMaterialId'],
                        material_no: d['FMaterialId.FNumber'],
                        loc_no: d['FStockLocId.FNumber'],
                        batch_no: d['FBatchNo'],
                        supplier_id: d['FSupplierId'],
                        qty: d['FQty'],
                        available_qty: d['FQty'],
                    })
                }
                this.invs = invs
            },
            // 提交出库
            async submit_outbound() {
                try {
                    if (this.action_disabled) return
                    this.action_disabled = true
                    if (!this.bill.bill_no) return // 校验单据
                    await this.$refs.form.validate()
                    if (!this.bill_has_material_no) {
                        uni.showModal({ title: '提示', content: `不能出库\n${this.bill.bill_type}中不含物料[${this.form.material_no}]` }); return;
                    }
                    uni.showLoading({ title: 'Loading', mask: true })
                    await this.load_outbound_qty()
                    await this.load_invs()
                    // 无限制超额出库
                    if (this.sum_available_qty < this.form.qty) {
                        uni.showModal({ title: '提示', content: `库存不足\n库存数量：${this.sum_available_qty}\n出库数量：${this.form.qty}` }); return;
                    }
                    // >>> main
                    let last_bill_no = ''
                    if (this.new_inv_logs.length === 0) {
                        let rest_qty = Number(this.form.qty) // 剩余出库数量
                        for (let e of this.bill.entity) {
                            if (rest_qty == 0) break
                            if (e.material_no != this.form.material_no) continue
                            let rest_must_qty = e.must_qty - e.send_qty // 剩余应发数量
                            for (let inv of this.invs) {
                                if (rest_must_qty <= 0) break // 分配完毕，跳出循环
                                if (inv.available_qty == 0) continue
                                let op_qty = Math.min(inv.available_qty, rest_must_qty, rest_qty)
                                let inv_log = new InvLog({
                                    FOpType: 'out',
                                    FStockId: store.state.cur_stock.FStockId,
                                    FStockLocNo: inv.loc_no,
                                    FMaterialId: inv.material_id,
                                    FOpQTY: op_qty,
                                    FBatchNo: inv.batch_no,
                                    FSupplierId: inv.supplier_id,
                                    FBillNo: this.bill.bill_no,
                                    FOpStaffNo: store.state.cur_staff.FNumber
                                })
                                this.new_inv_logs.push(inv_log)
                                last_bill_no = inv_log.FBillNo
                                rest_must_qty -= op_qty
                                rest_qty -= op_qty
                                inv.available_qty -= op_qty
                            }
                        }
                        // 尾数添加到最后一单
                        if (rest_qty > 0) {
                            for (let inv of this.invs) {
                                if (inv.available_qty == 0) continue
                                let op_qty = Math.min(inv.available_qty, rest_qty)
                                let inv_log = new InvLog({
                                    FOpType: 'out',
                                    FStockId: store.state.cur_stock.FStockId,
                                    FStockLocNo: inv.loc_no,
                                    FMaterialId: inv.material_id,
                                    FOpQTY: op_qty,
                                    FBatchNo: inv.batch_no,
                                    FSupplierId: inv.supplier_id,
                                    FBillNo: last_bill_no,
                                    FOpStaffNo: store.state.cur_staff.FNumber
                                })
                                this.new_inv_logs.push(inv_log)
                                rest_qty -= op_qty
                                inv.available_qty -= op_qty
                            }
                        }
                    } else {
                        this.$logger.warn(">>> double click")
                    }
                    // 统一分配操作序号，统一提交保存，防重复提交
                    for (let i = 0; i < this.new_inv_logs.length; i++) {
                        uni.showToast({ title: `${i}/${this.new_inv_logs.length}`, mask: true })
                        await this.new_inv_logs[i].save()
                    }
                    this.reset_form()
                    uni.hideLoading()
                    uni.showToast({ title: '出库成功', mask: true })
                } catch (err) {
                    this.$logger.info('>>> err',err)
                } finally {
                    uni.hideLoading()
                    this.new_inv_logs = []
                    this.action_disabled = false
                }
            },
            async submit_outbound_unlimited() {
                this.$logger.info('>>> submit_outbound_unlimited')
                try {
                    if (this.action_disabled) return
                    this.action_disabled = true
                    if (!this.bill.bill_no) return // 校验单据
                    await this.$refs.form.validate()
                    uni.showLoading({ title: 'Loading', mask: true })
                    await this.load_invs()
                    if (this.sum_available_qty < this.form.qty) {
                        uni.showModal({ title: '提示', content: `库存不足\n库存数量：${this.sum_available_qty}\n出库数量：${this.form.qty}` }); return;
                    }
                    // >>> main
                    if (this.new_inv_logs.length === 0) {
                        let rest_qty = Number(this.form.qty) // 剩余出库数量
                        for (let inv of this.invs) {
                            if (inv.available_qty == 0) continue
                            let op_qty = Math.min(inv.available_qty, rest_qty)
                            let inv_log = new InvLog({
                                FOpType: 'out',
                                FStockId: store.state.cur_stock.FStockId,
                                FStockLocNo: inv.loc_no,
                                FMaterialId: inv.material_id,
                                FOpQTY: op_qty,
                                FBatchNo: inv.batch_no,
                                FSupplierId: inv.supplier_id,
                                FBillNo: this.bill.bill_no,
                                FOpStaffNo: store.state.cur_staff.FNumber
                            })
                            this.new_inv_logs.push(inv_log)
                            rest_qty -= op_qty
                            inv.available_qty -= op_qty
                        }
                    } else {
                        this.$logger.warn(">>> double click")
                    }
                    // 统一分配操作序号，统一提交保存，防重复提交
                    for (let i = 0; i < this.new_inv_logs.length; i++) {
                        uni.showToast({ title: `${i}/${this.new_inv_logs.length}`, mask: true })
                        await this.new_inv_logs[i].save()
                    }
                    this.reset_form()
                    uni.hideLoading()
                    uni.showToast({ title: '出库成功', mask: true })
                } catch (err) {
                    this.$logger.info('>>> err',err)
                } finally {
                    uni.hideLoading()
                    this.new_inv_logs = []
                    this.action_disabled = false
                }
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
    .uni-forms.search-form::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
    .uni-forms.scan-form::v-deep {
        .uni-forms-item--border {
            border-bottom: 1px solid #cacaca;
            border-top: none;
            &.is-first-border {
                border-top: 1px solid #cacaca;
            }
        }
        .uni-forms-item__label {
            font-size: $uni-font-size-lg;
            color: $uni-text-color;
            height: 26px;
        }
        .uni-easyinput {
            .uni-input-input {
                font-size: 30px;
                text-align: right;
            }
        }
    }
</style>
