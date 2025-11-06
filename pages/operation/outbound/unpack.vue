<template>
    <!-- 搜素 -->
    <uni-section title="查询单据编号" type="square" sub-title="生产发料通知单" sub-title-color="#007aff" @click="console.log('this.$data', this.$data)">
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
        :sub-title="`产线：${scfl[0]?.prd_line}`" sub-title-color="#007aff" class="above-uni-goods-nav">
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">应发数量</uni-th>
                <uni-th align="center">可发数量</uni-th>
                <uni-th align="center">仓库</uni-th>
                <uni-th align="center">仓管员</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in scfl" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td>{{ obj.material_no }}</uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.unit_name }}</uni-td>
                <uni-td align="center">{{ obj.must_qty }}</uni-td>
                <uni-td align="center">{{  }}</uni-td>
                <uni-td><text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></uni-td>
                <uni-td>{{ obj.storekeeper }}</uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in scfl" :key="index">
                <template #header>
                    <view class="uni-list-item__head">
                        <uni-icons v-if="inv_logs_map[obj.material_id]" type="checkbox" size="30" color="#007aff"></uni-icons>
                        <checkbox
                            v-else-if="invs_map[obj.material_id] && invs_map[obj.material_id] >= obj.must_qty"
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
                            <view>单位：{{ obj.unit_name }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>应发：<text class="text-lg">{{ obj.must_qty }}</text></view>
                        <view v-if="inv_logs_map[obj.material_id]">实发：<text class="text-primary text-lg">{{ inv_logs_map[obj.material_id] || 0 }}</text></view>
                        <template v-else>
                            <view>拆包区：<text class="text-lg">{{ invs_map[obj.material_id] || 0 }}</text></view>
                            <view v-if="!invs_map[obj.material_id] || invs_map[obj.material_id] < obj.must_qty" class="text-error">库存不足</view>
                        </template>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
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
    import { play_audio_prompt } from '@/utils'
    import scan_code from '@/utils/scan_code'
    import { PrdIssueMtrNotice, InvLog, Inv } from '@/utils/model'
    export default {
        data() {
            return {
                scfl: [],          // 应发物料
                invs: [],          // 拆包区库存
                invs_map: {},      // 优化库存查询性能
                inv_logs: [],      // 实发物料
                inv_logs_map: {},  // 优化实发查询性能
                search_form: {
                    bill_no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'checkbox', text: '全选' }
                    ],
                    button_group: [
                        { text: '扫码查询单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '确认出库', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                    ]
                }
            }
        },
        computed: {
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
                let checked_all = !this.scfl.find(m => !m.checked && !m.sent_qty)
                for (let m of this.scfl) {
                    if (!m.is_sent) m.checked = !checked_all
                }
            },
            checkbox_click(e) {
                // console.log('checkbox_click e', e)
                let material = this.scfl.find(m => m.material_id === e.target.dataset.id)
                if (material) {
                    material.checked = !material.checked
                } 
            },
            goods_nav_click(e) {
                if (e.index === 0) this.check_all()
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
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            // 搜索
            async handle_search() {
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim().toUpperCase()
                    if (this.search_form.bill_no.match(/^\d+$/)) {
                        this.search_form.bill_no = 'SCFLTZD' + this.search_form.bill_no // 自动补充前缀
                    }
                    await this.load_scfltzd()
                    await this.load_invs()
                    await this.load_inv_logs()
                } else {
                    this.scfl = []
                    this.invs = []
                    this.inv_logs = []
                }
            },
            // ** 加载数据 **
            async load_scfltzd() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    let res = await PrdIssueMtrNotice.query({ FBillNo: this.search_form.bill_no })
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
            async load_invs() {
                let res = await Inv.get_all({ 'FStockLocId.FName_lk': '拆包区' }, { order: 'FBatchNo ASC' })
                this.invs = res
                let invs_map = {}
                for (let inv of this.invs) {
                    invs_map[inv.FMaterialId] ||= 0
                    invs_map[inv.FMaterialId] += inv.FQty
                }
                this.invs_map = invs_map
            },
            async load_inv_logs() {
                let res = await InvLog.query({ FBillNo: this.search_form.bill_no, FOpType: 'out' })
                this.inv_logs = res.data
                let inv_logs_map = {}
                for (let inv_log of this.inv_logs) {
                    inv_logs_map[inv_log.FMaterialId] ||= 0
                    inv_logs_map[inv_log.FMaterialId] += inv_log.FOpQTY
                }
                this.inv_logs_map = inv_logs_map
            },
            async submit_outbound() {
                uni.showLoading({ title: 'Loading' })
                let checked_materials = this.scfl.filter(m => m.checked)
                for (let m of checked_materials) {
                    let invs = this.invs.filter(inv => inv.FMaterialId === m.material_id)
                    let rest_must_qty = m.must_qty // 剩余应发数量
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
                }
                await this.load_invs()
                await this.load_inv_logs()
                uni.hideLoading()
            }
        }
    }
</script>

<style>

</style>
