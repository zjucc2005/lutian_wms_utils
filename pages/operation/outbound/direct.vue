<template>
    <uni-section title="1. 查询出库单据" type="square" 
        :sub-title="breadcrumb_stockname()" sub-title-color="#007aff" @click="debug">
        <view class="container">
            <uni-forms ref="search_form" :model="search_form" :label-width="72" class="search-form">
                <uni-forms-item label="单据编号">
                    <uni-easyinput v-model="search_form.bill_no" trim placeholder="生产发料通知单" @confirm="load_scfltzd" />
                </uni-forms-item>
                <!--
                <uni-forms-item v-if="scfl.prd_line" label="产线">
                    <view class="form-text">{{ scfl.prd_line }}</view>
                    <uni-data-select v-model="search_form.prd_line" :localdata="prd_line_opts" :clear="false" style="height: 37px;" />
                </uni-forms-item>
                -->
            </uni-forms>
            <button type="primary" size="mini" @click="load_scfltzd">搜索</button>
            <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
        </view>
    </uni-section>
    
    <uni-section v-if="scfl.bill_no" title="2. 出库扫码" type="square" :sub-title="scfl.prd_line" sub-title-color="#007aff">
        <template #right>
            <text class="text-grey text-sm">替代模式</text>
            <switch :checked="alter_mode" @change="switch_alter_mode" style="transform:scale(0.7)"/>
        </template>
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
                <view style="border-bottom: 1px solid #cacaca"></view>
                <uni-forms-item v-if="alter_mode" label="原物料编码" name="old_material_no">
                    <template #label>
                        <view style="display: flex; justify-content: space-between;">
                            <view class="uni-forms-item__label">[原]物料编码</view>
                            <view v-if="material" class="text-grey" style="flex: 1; text-align: right;">{{ old_material?.FName ? [old_material?.FName, old_material?.FSpecification].join('; ') : '' }}</view>
                        </view>
                    </template>
                    <uni-easyinput 
                        v-model="form.old_material_no" trim
                        @change="handle_old_material_no_change"
                        @clear="handle_old_material_no_change"
                        :input-border="false">
                        <template #left>
                            <uni-icons v-if="old_material.FMaterialId" type="checkbox-filled" size="24" color="#67c23a"></uni-icons>
                            <uni-icons v-else-if="form.old_material_no && !old_material.FMaterialId" type="help-filled" size="24" color="#c0c4cc"></uni-icons>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
                <uni-forms-item label="物料编码" name="material_no">
                    <template #label>
                        <view style="display: flex; justify-content: space-between;">
                            <view class="uni-forms-item__label">{{ alter_mode ? '[替代]' : '' }}物料编码</view>
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
</template>

<script>
    import store from '@/store'
    import { breadcrumb_stockname, play_audio_prompt, formatDate } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { BdMaterial, PrdIssueMtrNotice, PrdPpbom, Inv, InvLog } from '@/utils/model'
    
    export default {
        data() {
            return {
                action_disabled: false,
                alter_mode: false, // 替代料模式
                scfl: {},
                old_material: {},
                material: {},
                invs: [],
                new_inv_logs: [],
                search_form: {
                    bill_no: '',  // 生产发料通知单号, SCFLTZD37029
                },
                form: {
                    old_material_no: '',
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
                        { icon: 'clear', text: '清空' }
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
            scfl_has_material_no() {
                if (!this.form.material_no) return false
                return this.scfl.detail_entity.some(d => d.material_no == this.form.material_no)
            },
            scfl_has_old_material_no() {
                if (!this.form.old_material_no) return false
                return this.scfl.detail_entity.some(d => d.material_no == this.form.old_material_no)
            },
            need_outbound() {
                if (!this.form.material_no) return false
                for (let d of this.scfl.detail_entity) {
                    if (d.material_no == this.form.material_no && d.must_qty > d.send_qty) return true
                }
                return false
            },
            need_alter_outbound() {
                if (!this.form.old_material_no) return false
                for (let d of this.scfl.detail_entity) {
                    if (d.material_no == this.form.old_material_no && d.must_qty > d.send_qty) return true
                }
                return false
            }
        },
        methods: {
            breadcrumb_stockname,
            debug() {
                this.$logger.info('>>>', this.$data)
            },
            // operations
            goods_nav_click(e) {
                if (e.index === 0) this.reset_form()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) {
                    this.alter_mode ? this.submit_alter_outbound() : this.submit_outbound()  // btn:提交出库
                }
            },
            handle_material_no_change() {
                if (this.form.material_no) {
                    this.load_material()
                } else {
                    this.material = {}
                }
            },
            handle_old_material_no_change() {
                if (this.form.old_material_no) {
                    this.load_old_material()
                } else {
                    this.old_material = {}
                }
            },
            reset_form() {
                this.form = { old_material_no: '', material_no: '', loc_no: '', qty: null }
                this.old_material = {}
                this.material = {}
            },
            reset_search_form () {
                this.search_form = { bill_no: '' }
                this.scfl = {}
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(text) {
                if (text.startsWith('SCFLTZD')) {
                    this.search_form.bill_no = text
                    this.load_scfltzd()
                } else {
                    if (!this.scfl.bill_no) return
                    // >>> code: divided by alter mode
                    let field = 'material_no'
                    let no = text
                    if (text.includes('||')) {
                        no = text.split('||')[1]
                    } else if (text.includes('-') && !text.includes('.')) {
                        field = 'loc_no'
                    }
                    
                    if (field == 'material_no') {
                        if (this.alter_mode) {
                            if (!this.form.old_material_no) {
                                this.form.old_material_no = no
                                this.handle_old_material_no_change()
                            } else if (!this.form.material_no) {
                                this.form.material_no = no
                                this.handle_material_no_change()
                            } else {
                                uni.showToast({ icon: 'none', title: '物料编码已填满，请先清空需要重扫的编码' })
                            }
                        } else {
                            this.form.material_no = no
                            this.handle_material_no_change()
                        }
                    } else {
                        this.form.loc_no = no
                    }
                    // if (text.includes('||')) {
                    //     this.form.material_no = text.split('||')[1]
                    //     this.handle_material_no_change()
                    // } else if (text.includes('-') && !text.includes('.')) {
                    //     this.form.loc_no = text
                    // } else {
                    //     this.form.material_no = text
                    //     this.handle_material_no_change()
                    // }
                }
            },
            switch_alter_mode(e) {
                this.alter_mode = e.detail.value
            },
            // 加载生产发料信息
            async load_scfltzd() {
                try {
                    if (this.action_disabled) return
                    this.action_disabled = true
                    if (!this.search_form.bill_no) {
                        uni.showToast({ icon: 'none', title: '请输入单据编号' })
                        return
                    }
                    this.search_form.bill_no = this.search_form.bill_no.toUpperCase()
                    let options = { FBillNo: this.search_form.bill_no }
                    uni.showLoading({ title: 'Loading', mask: true })
                    // 1. 加载产线
                    let res1 = await PrdIssueMtrNotice.query(options, { fields: ['F_PAEZ_Base.FName' ], return: 'array' })
                    if (res1.data.length === 0) {
                        uni.hideLoading()
                        uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                        this.reset_search_form()
                        return
                    }
                    // 2. 加载生产订单和物料应发信息
                    let mo_entry_set = new Set()
                    let detail_entity = []
                    let res2 = await PrdIssueMtrNotice.query(options, 
                        { fields: ['FDetailEntity_FSeq', 'FMoBillNo', 'FMoBillSeq', 'FMaterialId', 'FMaterialId.FNumber', 'FMustQty' ], 
                          order: 'FDetailEntity_FSeq', return: 'array' })
                    for (let d of res2.data) {
                        let mo_entry = [d[1], d[2]].join('|')
                        mo_entry_set.add(mo_entry)
                        detail_entity.push({
                            seq: d[0],
                            mo_bill_no: d[1],
                            mo_entry_seq: d[2],
                            mo_entry: mo_entry,
                            material_id: d[3],
                            material_no: d[4],
                            must_qty: d[5],
                            send_qty: 0
                        })
                    }
                    // 3. 加载生产用料清单编号
                    let group = {} // 分组查询，减少查询次数
                    for (let text of Array.from(mo_entry_set)) {
                        let [mo_bill_no, mo_entry_seq] = text.split('|')
                        group[mo_entry_seq] ||= []
                        group[mo_entry_seq].push(mo_bill_no)
                    }
                    let mo_h = {}
                    let entity = []
                    for (let k in group) {
                        let res = await PrdPpbom.query({ FMoBillNo_in: group[k], FMoEntrySeq: k }, { fields: ['FBillNo', 'FMoBillNo', 'FMoEntrySeq'], return: 'array' })
                        for (let d of res.data) {
                            mo_h[[d[1], d[2]].join('|')] = d[0]
                            entity.push({ ppbom_bill_no: d[0], mo_bill_no: d[1], mo_entry_seq: d[2] })
                        }
                    }
                    for (let de of detail_entity) {
                        de.ppbom_bill_no = mo_h[de.mo_entry]
                    }
                    this.scfl = {
                        bill_no: this.search_form.bill_no,
                        prd_line: res1.data[0][0],
                        entity: entity,
                        detail_entity: detail_entity
                    }
                } catch (err) {
                    uni.showToast({ icon: 'none', title: err })
                } finally {
                    uni.hideLoading()
                    this.action_disabled = false
                }
            },
            // 加载物料信息
            async load_material() {
                let res = await BdMaterial.query(
                    { FNumber: this.form.material_no, FUseOrgId: store.state.cur_stock.FUseOrgId },
                    { fields: ["FMaterialId", "FName", "FNumber", "FSpecification", "FForbidStatus", "FDocumentStatus", 
                      "FBaseUnitId", "FBaseUnitId.FNumber", "FBaseUnitId.FName", "FMaterialGroup.FName", "FUseOrgId", 
                      "FUseOrgId.FName", "FImageFileServer", 'FBoxStandardQty'] })
                if (res.data.length) {
                    this.material = res.data[0]
                } else {
                    this.material = {}
                }
            },
            async load_old_material() {
                let res = await BdMaterial.query(
                    { FNumber: this.form.old_material_no, FUseOrgId: store.state.cur_stock.FUseOrgId },
                    { fields: ["FMaterialId", "FName", "FNumber", "FSpecification", "FBaseUnitId.FName"] })
                if (res.data.length) {
                    this.old_material = res.data[0]
                } else {
                    this.old_material = {}
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
            // 加载已出库信息
            async load_outbound_logs() {
                for (let d of this.scfl.detail_entity) d.send_qty = 0 // # init
                let nos = []
                for (let e of this.scfl.entity) {
                    nos.push([e.ppbom_bill_no, e.mo_bill_no].join(','))
                }
                let options = {
                    FStockId: store.state.cur_stock.FStockId,
                    FOpType: 'out',
                    'FMaterialId.FNumber': this.form.material_no,
                    'FBillNo_in': nos,
                }
                let res = await InvLog.query(options, { fields: ['FOpQTY', 'FBillNo'] })
                for (let d of res.data) {
                    let [ppbom_bill_no, mo_bill_no] = d.FBillNo.split(',')
                    for (let de of this.scfl.detail_entity) {
                        if (de.material_no == this.form.material_no && de.ppbom_bill_no == ppbom_bill_no) {
                            de.send_qty += d.FOpQTY
                        }
                    }
                }
            },
            async load_alter_outbound_logs() {
                for (let d of this.scfl.detail_entity) d.send_qty = 0 // # init
                let nos = []
                for (let e of this.scfl.entity) {
                    nos.push([e.ppbom_bill_no, e.mo_bill_no].join(','))
                }
                let options = {
                    FStockId: store.state.cur_stock.FStockId,
                    FOpType: 'out',
                    'FMaterialId.FNumber_in': [this.form.old_material_no, this.form.material_no], // 同时考虑原物料和替代料
                    'FBillNo_in': nos,
                }
                let res = await InvLog.query(options)
                for (let d of res.data) {
                    let [ppbom_bill_no, mo_bill_no] = d.FBillNo.split(',')
                    for (let de of this.scfl.detail_entity) {
                        if (de.material_no == this.form.old_material_no && de.ppbom_bill_no == ppbom_bill_no) {
                            de.send_qty += d.FOpQTY // 替代料的出库数量，汇总到原物料上，用于后续出库完毕判断
                        }
                    }
                }
            },
            // 提交出库
            async submit_outbound() {
                try {
                    if (this.action_disabled) return
                    this.action_disabled = true
                    if (!this.scfl.bill_no) return // 校验单据
                    await this.$refs.form.validate()
                    if (!this.scfl_has_material_no) {
                        uni.showModal({ title: '提示', content: `不能出库\n生产发料通知单中不含物料[${this.form.material_no}]` }); return;
                    }
                    uni.showLoading({ title: 'Loading', mask: true })
                    await this.load_outbound_logs()
                    await this.load_invs()
                    if (!this.need_outbound) {
                        uni.showModal({ title: '提示', content: `不能出库\n物料[${this.form.material_no}]已出库足够数量` }); return;
                    }
                    if (this.sum_available_qty < this.form.qty) {
                        uni.showModal({ title: '提示', content: `库存不足\n库存数量：${this.sum_available_qty}\n出库数量：${this.form.qty}` }); return;
                    }
                    // >>> main
                    let last_bill_no = ''
                    if (this.new_inv_logs.length === 0) {
                        let rest_qty = Number(this.form.qty) // 剩余出库数量
                        for (let d of this.scfl.detail_entity) {
                            if (rest_qty == 0) break
                            if (d.material_no != this.form.material_no) continue
                            let rest_must_qty = d.must_qty - d.send_qty // 剩余应发数量
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
                                    FBillNo: [d.ppbom_bill_no, d.mo_bill_no].join(','),
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
            async submit_alter_outbound() {
                try {
                    if (this.action_disabled) return
                    this.action_disabled = true
                    if (!this.scfl.bill_no) return // 校验单据
                    await this.$refs.form.validate()
                    if (!this.form.old_material_no) {
                        uni.showModal({ title: '提示', content: '原物料编码不能为空' }); return;
                    }
                    if (this.form.old_material_no == this.form.material_no) {
                        uni.showModal({ title: '提示', content: '原物料编码和替代料编码不能相同' }); return;
                    }
                    if (!this.old_material.FMaterialId) {
                        uni.showModal({ title: '提示', content: '原物料编码不存在' }); return;
                    }
                    if (!this.scfl_has_old_material_no) {
                        uni.showModal({ title: '提示', content: `不能出库\n生产发料通知单中不含[原]物料[${this.form.old_material_no}]` }); return;
                    }
                    if (this.scfl_has_material_no) {
                        uni.showModal({ title: '提示', content: `不能出库\n生产发料通知单中有物料[${this.form.material_no}]，无需替代模式` }); return;
                    }
                    uni.showLoading({ title: 'Loading', mask: true })
                    // 汇总原物料和替代料的出库记录，如果是相同替代料，会判断是否已出库足够数量；如果切换替代料，会绕过这一判断。（替代数据由外部提供，本地不保存）
                    await this.load_alter_outbound_logs()
                    await this.load_invs()
                    if (!this.need_alter_outbound) {
                        uni.showModal({ title: '提示', content: `不能出库\n物料[${this.form.old_material_no}]已出库足够数量` }); return;
                    }
                    if (this.sum_available_qty < this.form.qty) {
                        uni.showModal({ title: '提示', content: `库存不足\n库存数量：${this.sum_available_qty}\n出库数量：${this.form.qty}` }); return;
                    }
                    // >>> main
                    let last_bill_no = ''
                    let remark = `替代${this.form.old_material_no}`
                    if (this.new_inv_logs.length === 0) {
                        let rest_qty = Number(this.form.qty) // 剩余出库数量
                        for (let d of this.scfl.detail_entity) {
                            if (rest_qty == 0) break
                            if (d.material_no != this.form.old_material_no) continue // 筛选原物料编码
                            let rest_must_qty = d.must_qty - d.send_qty // 剩余应发数量
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
                                    FBillNo: [d.ppbom_bill_no, d.mo_bill_no].join(','),
                                    FOpStaffNo: store.state.cur_staff.FNumber,
                                    FRemark: remark
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
                                    FOpStaffNo: store.state.cur_staff.FNumber,
                                    FRemark: remark
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
    // .form-text {
    //     height: 37px;
    //     display: flex;
    //     align-items: center;
    // }
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
                // border-top: 1px solid #cacaca;
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
