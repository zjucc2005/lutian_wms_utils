<template>
    <!-- 搜素 -->
    <uni-section title="查询单据编号" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        sub-title-color="#007aff" @click="$logger.info('>>>', $data)">
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
                    borderColor: 'rgb(238, 238, 238)'
                }"
            />
        </view>
    </uni-section>
    
    <!-- 分配库位 -->
    <uni-section v-if="scfl.length" title="子项明细" type="square"
        :sub-title="`${ search_form.bill_no.startsWith('CGTL') ? '供应商' : '领用部门' }：${scfl[0]?.prd_line}`"
        sub-title-color="#007aff"
        class="above-uni-goods-nav">
        <template #right>
            <view>已勾选 <text class="text-primary">{{ scfl.filter(m => m.checked).length }}</text> 行</view>
        </template>
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="30"></uni-th>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">应发数量</uni-th>
                <uni-th align="center">拆包区数量</uni-th>
                <uni-th align="center">实发数量</uni-th>
                <uni-th align="center">仓库</uni-th>
                <uni-th align="center">仓管员</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in scfl_filtered" :key="index">
                <uni-td>
                    <uni-icons v-if="inv_logs_map[obj.material_id] >= obj.must_qty" type="paperplane" size="30" color="#007aff"></uni-icons>
                    <checkbox
                        v-else-if="invs_map[obj.material_id] && invs_map[obj.material_id] > 0"
                        :checked="obj.checked"
                        @click="checkbox_click"
                        :data-id="obj.material_id"
                    />
                    <checkbox v-else disabled></checkbox>
                </uni-td>
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td>{{ obj.material_no }}</uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.unit_name }}</uni-td>
                <uni-td align="center">{{ obj.must_qty }}</uni-td>
                <uni-td align="center">{{ invs_map[obj.material_id] || 0 }}</uni-td>
                <uni-td align="center">{{ inv_logs_map[obj.material_id] }}</uni-td>
                <uni-td><text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></uni-td>
                <uni-td>{{ obj.storekeeper }}</uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in scfl_filtered" :key="index">
                <template #header>
                    <view class="uni-list-item__head">
                        <uni-icons v-if="inv_logs_map[obj.material_id] >= obj.must_qty" type="paperplane" size="30" color="#007aff"></uni-icons>                       
                        <checkbox
                            v-else-if="invs_map[obj.material_id] && invs_map[obj.material_id] > 0"
                            :checked="obj.checked"
                            @click="checkbox_click"
                            :data-id="obj.material_id"
                        />
                        <checkbox v-else disabled></checkbox>
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ obj.material_name }}</view> 
                            <view>规格：{{ obj.material_spec }}</view>
                            <view>仓库：<text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></view>
                            <view>单位：{{ obj.unit_name }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>
                            应发：<text class="text-lg">{{ obj.must_qty }}</text>
                        </view>
                        <view v-if="inv_logs_map[obj.material_id]">
                            实发：<text class="text-primary text-lg">{{ inv_logs_map[obj.material_id] || 0 }}</text>
                        </view>
                        <view v-if="(inv_logs_map[obj.material_id] || 0) < obj.must_qty">
                            拆包区：<text class="text-lg">{{ invs_map[obj.material_id] || 0 }}</text>
                        </view>
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
    import { PrdIssueMtrNotice, StkOutStockApply, SpPickMtrl, PurMrb, InvLog, Inv } from '@/utils/model'
    export default {
        data() {
            return {
                scfl: [],          // 应发物料
                scfl_todo: [],     // 今日生产发料通知单
                invs: [],          // 拆包区库存
                invs_map: {},      // 优化库存查询性能
                inv_logs: [],      // 实发物料
                inv_logs_map: {},  // 优化实发查询性能
                filter_cond: '全部',
                search_form: {
                    bill_no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'checkbox', text: '全选' },
                        { icon: 'settings', text: '全部'}
                    ],
                    button_group: [
                        { text: '扫码查询单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '确认出库', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                    ]
                }
            }
        },
        onShow() {
            if (!this.search_form.bill_no) {
                this.load_scfl_todo()
            }
        },
        computed: {
            scfl_filtered() {
                if (this.filter_cond === '全部') {
                    return this.scfl
                } else if (this.filter_cond === '未出库') {
                    return this.scfl.filter(m => (this.inv_logs_map[m.material_id] || 0) < m.must_qty )
                } else if (this.filter_cond === '可出库') {
                    return this.scfl.filter(m => this.can_outbound(m))
                } else if (this.filter_cond === '已出库') {
                    return this.scfl.filter(m => (this.inv_logs_map[m.material_id] || 0) >= m.must_qty)
                }
            },
            is_completed() {
                let res = true
                if (this.scfl.length) {
                    for (let m of this.scfl) {
                        if (!this.inv_logs_map[m.material_id]) {
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
            check_all() {
                let result = this.scfl.some(m => !m.checked && this.can_outbound(m))
                for (let m of this.scfl) {
                    if (this.can_outbound(m))  m.checked = result
                }
            },
            can_outbound(m) {
                // 未（完全）出库 && 有库存
                return (this.inv_logs_map[m.material_id] || 0) < m.must_qty && this.invs_map[m.material_id]
            },
            checkbox_click(e) {
                let material = this.scfl.find(m => m.material_id === e.target.dataset.id)
                if (material) material.checked = !material.checked
            },
            goods_nav_click(e) {
                if (e.index === 0) this.check_all()
                if (e.index === 1) this.filter_list()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code()       // btn:扫码查询单据
                if (e.index === 1) this.submit_outbound() // btn:提交出库
            },
            filter_list() {
                let item_list = ['全部', '未出库', '可出库', '已出库']
                uni.showActionSheet({
                    itemList: item_list,
                    success: (e) => {
                        this.filter_cond = item_list[e.tapIndex]
                        this.goods_nav.options[1].text = item_list[e.tapIndex]
                    }
                })
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            // 搜索
            async handle_search() {
                this.scfl = []
                this.invs = []
                this.inv_logs = []
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
                    await this.load_invs()
                    await this.load_inv_logs()
                }
            },
            // ** 加载数据 **
            // 生产发料通知单
            async load_scfltzd() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    let res = await PrdIssueMtrNotice.query({ FBillNo: this.search_form.bill_no, FStockId: store.state.cur_stock.FStockId })
                    uni.hideLoading()
                    if (res.data.length == 0) {
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
                    let res = await StkOutStockApply.query({ FBillNo: this.search_form.bill_no, FStockId: store.state.cur_stock.FStockId })
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
                    let res = await SpPickMtrl.query({ FBillNo: this.search_form.bill_no, FStockId: store.state.cur_stock.FStockId })
                    uni.hideLoading()
                    if (res.data.length == 0) {
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
                    let res = await PurMrb.query({ FBillNo: this.search_form.bill_no, FStockId: store.state.cur_stock.FStockId })
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
            async load_invs() {
                let res = await Inv.get_all({ FStockId: store.state.cur_stock.FStockId, 'FStockLocId.FName_lk': '拆包区' }, { order: 'FBatchNo ASC' })
                this.invs = res
                let invs_map = {}
                for (let inv of this.invs) {
                    invs_map[inv.FMaterialId] ||= 0
                    invs_map[inv.FMaterialId] += inv.FQty
                }
                this.invs_map = invs_map
            },
            async load_inv_logs() {
                let res = await InvLog.query({ FBillNo: this.search_form.bill_no, FStockId: store.state.cur_stock.FStockId, FOpType: 'out' })
                this.inv_logs = res.data
                let inv_logs_map = {}
                for (let inv_log of this.inv_logs) {
                    inv_logs_map[inv_log.FMaterialId] ||= 0
                    inv_logs_map[inv_log.FMaterialId] += inv_log.FOpQTY
                }
                this.inv_logs_map = inv_logs_map
            },
            async submit_outbound() {
                let checked_materials = this.scfl.filter(m => m.checked)
                if (checked_materials.length === 0) {
                    uni.showToast({ icon: 'none', title: '未勾选出库信息' })
                    return
                }
                uni.showLoading({ title: 'Loading', mask: true }) 
                for (let i=0;i<checked_materials.length;i++) {
                    uni.showLoading({ title: `${i}/${checked_materials.length}`, mask: true })
                    let m = checked_materials[i]
                    let invs = this.invs.filter(inv => inv.FMaterialId === m.material_id)
                    let rest_must_qty = m.must_qty - (this.inv_logs_map[m.material_id] || 0) // 剩余应发数量
                    for (let inv of invs) {
                        if (rest_must_qty === 0) break; // 分配完毕，跳出循环
                        let op_qty = inv.FQty >= rest_must_qty ? rest_must_qty : inv.FQty
                        let inv_log = new InvLog({
                            FOpType: 'out',
                            FStockId: store.state.cur_stock.FStockId,
                            FStockLocNo: inv['FStockLocId.FNumber'],
                            FMaterialId: inv.FMaterialId,
                            FOpQTY: op_qty,
                            FBatchNo: inv.FBatchNo,
                            FSupplierId: inv.FSupplierId,
                            FBillNo: this.search_form.bill_no,
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
            // 查询今日的生产发料通知单
            async load_scfl_todo() {
                let scfl_todo = []
                uni.showLoading({ title: 'Loading' })
                // 生产发料
                let res = await PrdIssueMtrNotice.query({
                    FDocumentStatus: 'C',                                // 已审核
                    FCloseStatus: 'A',                                   // 未关闭
                    FStockId: store.state.cur_stock.FStockId,            // 本仓库
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
                    FDocumentStatus: 'C',                                // 已审核
                    FStockId: store.state.cur_stock.FStockId,            // 本仓库
                    FCreateDate_ge: formatDate(Date.now(), 'yyyy-MM-dd') // 今天
                }, {
                    fields: ['FBillNo', 'FWorkShopId.FName'],            // 指定返回字段，优化查询速度
                    order: 'FCreateDate DESC',                           // 时间降序
                })
                for (let d of res1.data) {
                    let obj = scfl_todo.find(x => x.bill_no == d.FBillNo)
                    if (!obj) scfl_todo.push({ bill_no: d.FBillNo, prd_line: d['FWorkShopId.FName'] })
                }
                uni.hideLoading()
                this.scfl_todo = scfl_todo
            }
        }
    }
</script>

<style>

</style>
