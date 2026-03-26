<template>
    <!-- 搜素 -->
    <uni-section title="当前仓库" type="square" 
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        sub-title-color="#007aff" @click="$logger.info('>>>', $data)">
        <template #right>
            <text class="text-grey text-sm">{{ multiuser ? '多人' : '单人' }}</text>
            <switch @change="switch_click" style="transform:scale(0.7)"/>
        </template>
        <view class="searchbar-container">
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
        </view>
    </uni-section>
    <!-- 分配库位 -->
    <uni-section v-if="scfl.length" title="子项明细" type="square"
        class="above-uni-goods-nav">
        <!--
        :sub-title="`${ search_form.bill_no.startsWith('CGTL') ? '供应商' : '领用部门' }：${scfl[0]?.prd_line}`"
        sub-title-color="#007aff"
        -->
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">应发数量</uni-th>
                <uni-th align="center">已调拨数量</uni-th>
                <uni-th align="center">仓库</uni-th>
                <uni-th align="center">仓管员</uni-th>
                <uni-th align="center">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in scfl" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td>{{ obj.material_no }}</uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.unit_name }}</uni-td>
                <uni-td align="center">{{ obj.must_qty }}</uni-td>
                <uni-td align="center">{{ inv_plans_map[obj.material_id] }}</uni-td>
                <uni-td><text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></uni-td>
                <uni-td>{{ obj.storekeeper }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="分配库位" type="primary" @click="allocate_loc_no(obj)"/>
                </uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in scfl" :key="index"
                @click="allocate_loc_no(obj)" clickable
                show-arrow>
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ obj.material_name }}</view> 
                            <view>规格：{{ obj.material_spec }}</view>
                            <view>仓库：<text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></view>
                            <view>仓管员：{{ obj.storekeeper }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ obj.must_qty }} {{ obj.unit_name }}</view>
                        <view v-if="inv_plans_map[obj.material_id]">已调拨：<text class="text-primary">{{ inv_plans_map[obj.material_id] }}</text></view>
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
    import { play_audio_prompt, formatDate } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { PrdIssueMtrNotice, StkOutStockApply, SpPickMtrl, PurMrb, InvPlan } from '@/utils/model'
    export default {
        data() {
            return {
                scfl: [], // 发料物料
                scfl_todo: [], // 今日生产发料通知单
                inv_plans: [], // 已计划
                inv_plans_map: {}, // 优化计划查询性能
                multiuser: false,
                search_form: {
                    bill_no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'clear', text: '清空' }
                    ],
                    button_group: [
                        { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                    ]
                }
            }
        },
        onShow() {
            if (this.search_form.bill_no) {
                this.load_inv_plans()
            } else {
                this.load_scfl_todo()
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
        },
        computed: {
            is_completed() {
                let res = true
                if (this.scfl.length) {
                    for (let m of this.scfl) {
                        if (!this.inv_plans_map[m.material_id] || this.inv_plans_map[m.material_id] < m.must_qty) {
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
            // 页面动作
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.$logger.info('this.$data', this.$data)
                    this.search_form.bill_no = ''
                    this.handle_search()
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
                    } else if (this.search_form.bill_no.startsWith('CKSQD')){
                        await this.load_cksqd()
                    } else if (this.search_form.bill_no.startsWith('JSCLL')) {
                        await this.load_jscll()
                    } else if (this.search_form.bill_no.startsWith('CGTL')) {
                        await this.load_cgtl()
                    }
                    await this.load_inv_plans()
                }
                if (this.scfl.length) {
                    this.goods_nav.button_group[0] = { text: '扫描物料', backgroundColor: store.state.goods_nav_color.yellow, color: '#fff' }
                } else {
                    this.goods_nav.button_group[0] = { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                }
            },
            // 选择库位
            allocate_loc_no(obj) {
                uni.navigateTo({
                    url: '/pages/operation/move/unpack_allocate',
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
            // 出库申请单
            async load_cksqd() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    // 区分仓管员
                    let options = { FBillNo: this.search_form.bill_no }
                    if (this.multiuser) {
                        options.FStockId = store.state.cur_stock.FStockId
                    } else {
                        options['FMaterialId.F_PAEZ_Base1'] = store.state.cur_staff.FName
                    }
                    let res = await StkOutStockApply.query(options)
                    uni.hideLoading()
                    if (res.data.length === 0) {
                        uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                        return
                    }
                    let materials = []
                    for (let d of res.data) {
                        let material = materials.find(m => m.material_id === d.FMaterialId)
                        if (material) {
                            material.must_qty += d.FQty
                            material.base_must_qty += d.FBaseQty
                        } else {
                            materials.push({
                                material_id: d.FMaterialId,
                                material_no: d['FMaterialId.FNumber'],
                                material_name: d['FMaterialId.FName'],
                                material_spec: d['FMaterialId.FSpecification'],
                                storekeeper: d['FMaterialId.F_PAEZ_Base1'],
                                stock_id: d.FStockId,
                                stock_name: d['FStockId.FName'],
                                prd_line: d['FDeptId.FName'],
                                must_qty: d.FQty,
                                unit_id: d.FUnitId,
                                unit_name: d['FUnitId.FName'],
                                base_must_qty: d.FBaseQty,
                                base_unit_id: d.FBaseUnitId,
                                base_unit_name: d['FBaseUnitId.FName']
                            })
                        }
                    }
                    this.scfl = materials
                } catch (err) { }
            },
            // 简易生产领料单
            async load_jscll() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    // 区分仓管员
                    let options = { FBillNo: this.search_form.bill_no }
                    if (this.multiuser) {
                        options.FStockId = store.state.cur_stock.FStockId
                    } else {
                        options['FMaterialId.F_PAEZ_Base1'] = store.state.cur_staff.FName
                    }
                    let res = await SpPickMtrl.query(options)
                    uni.hideLoading()
                    if (res.data.length === 0) {
                        uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                        return
                    }
                    let materials = []
                    for (let d of res.data) {
                        let material = materials.find(m => m.material_id === d.FMaterialId)
                        if (material) {
                            material.must_qty += d.FActualQty
                            material.base_must_qty += d.FBaseActualQty
                        } else {
                            materials.push({
                                material_id: d.FMaterialId,
                                material_no: d['FMaterialId.FNumber'],
                                material_name: d['FMaterialId.FName'],
                                material_spec: d['FMaterialId.FSpecification'],
                                storekeeper: d['FMaterialId.F_PAEZ_Base1'],
                                stock_id: d.FStockId,
                                stock_name: d['FStockId.FName'],
                                prd_line: d['FWorkShopId.FName'],
                                must_qty: d.FActualQty,
                                unit_id: d.FUnitId,
                                unit_name: d['FUnitId.FName'],
                                base_must_qty: d.FBaseActualQty,
                                base_unit_id: d.FBaseUnitId,
                                base_unit_name: d['FBaseUnitId.FName']
                            })
                        }
                    }
                    this.scfl = materials
                } catch (err) { }
            },
            // 采购退料
            async load_cgtl() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    // 区分仓库
                    let options = { FBillNo: this.search_form.bill_no, FStockId: store.state.cur_stock.FStockId }
                    let res = await PurMrb.query(options)
                    uni.hideLoading()
                    if (res.data.length === 0) {
                        uni.showToast({ icon: 'none' ,title: '没有相关数据' })
                        return
                    }
                    let materials = []
                    for (let d of res.data) {
                        let material = materials.find(m => m.material_id === d.FMaterialId)
                        if (material) {
                            material.must_qty += d.FRmRealQty
                            material.base_must_qty += d.FRmRealQty
                        } else {
                            materials.push({
                                material_id: d.FMaterialId,
                                material_no: d['FMaterialId.FNumber'],
                                material_name: d['FMaterialId.FName'],
                                material_spec: d['FMaterialId.FSpecification'],
                                storekeeper: d['FMaterialId.F_PAEZ_Base1'],
                                stock_id: d.FStockId,
                                stock_name: d['FStockId.FName'],
                                prd_line: d['FSupplierId.FName'], // 供应商
                                must_qty: d.FRmRealQty,
                                unit_id: d.FUnitId,
                                unit_name: d['FUnitId.FName'],
                                base_must_qty: d.FRmRealQty,
                                base_unit_id: d.FUnitId,
                                base_unit_name: d['FUnitId.FName']
                            })
                        }
                    }
                    this.scfl = materials
                } catch (err) { }
            },
            async load_inv_plans() {
                let res = await InvPlan.query({ FBillNo: this.search_form.bill_no, FStockId: store.state.cur_stock.FStockId, 
                                                FDocumentStatu: 'C', FOpType: 'mv' })
                this.inv_plans = res.data
                let inv_plans_map = {}
                for (let inv_plan of this.inv_plans) {
                    inv_plans_map[inv_plan.FMaterialId] ||= 0
                    inv_plans_map[inv_plan.FMaterialId] += inv_plan.FOpQTY
                }
                this.inv_plans_map = inv_plans_map
            },
            // 查询今日的生产发料通知单
            async load_scfl_todo() {
                let scfl_todo = []
                uni.showLoading({ title: 'Loading' })
                // 生产发料
                let res = await PrdIssueMtrNotice.query({
                    FDocumentStatus: 'C',                                // 已审核
                    FCloseStatus: 'A',                                   // 未关闭
                    // FStockId: store.state.cur_stock.FStockId,         // 本仓库
                    F_PAEZ_BaseProperty1: store.state.cur_staff.FName,   // 仓管员
                    FCreateDate_ge: formatDate(Date.now(), 'yyyy-MM-dd') // 今天
                }, {
                    fields: ['FBillNo', 'F_PAEZ_Base.FName'],            // 指定返回字段，优化查询速度
                    order: 'FCreateDate DESC' ,                          // 时间降序
                })
                for (let d of res.data) {
                    let obj = scfl_todo.find(x => x.bill_no == d.FBillNo)
                    if (!obj) scfl_todo.push({ bill_no: d.FBillNo, prd_line: d['F_PAEZ_Base.FName'] })
                }
                // 简单生产领料
                let res1 = await SpPickMtrl.query({
                    FDocumentStatus: 'C',                                    // 已审核
                    // FStockId: store.state.cur_stock.FStockId,             // 本仓库
                    'FMaterialId.F_PAEZ_Base1': store.state.cur_staff.FName, // 仓管员
                    FCreateDate_ge: formatDate(Date.now(), 'yyyy-MM-dd')     // 今天
                }, {
                    fields: ['FBillNo', 'FWorkShopId.FName'],                // 指定返回字段，优化查询速度
                    order: 'FCreateDate DESC',                               // 时间降序
                })
                for (let d of res1.data) {
                    let obj = scfl_todo.find(x => x.bill_no == d.FBillNo)
                    if (!obj) scfl_todo.push({ bill_no: d.FBillNo, prd_line: d['FWorkShopId.FName'] })
                }
                uni.hideLoading()
                this.scfl_todo = scfl_todo
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
                this.$logger.info('>>> main.registerReceiver:move/unpack', this.broadcast_receiver)
            },
            unreg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                main.unregisterReceiver(this.broadcast_receiver)
                this.$logger.info('>>> main.unregisterReceiver:move/unpack', this.broadcast_receiver)
            },
            // #endif
        }
    }
</script>

<style lang="scss" scoped>

</style>
