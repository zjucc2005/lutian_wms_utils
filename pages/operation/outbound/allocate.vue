<template>
    <view>        
        <uni-section
            v-for="(obj, index) in cur_outbound_task.outbound_list"
            :key="index"
            :title="obj.material_no"
            :sub-title="[obj.material_name, obj.material_spec].join('\n')"
            
        >
            <template v-slot:decoration>
                <uni-icons
                    @click="search_invs(obj.material_no)"
                    type="search" size="30" color="#007aff"
                    class="uni-section-icon"
                />
            </template>
            <template v-slot:right>
                <view class="uni-section-right-text">
                    <text v-if="obj.unmounted_qty || obj.checked_qty">{{ obj.unmounted_qty + obj.checked_qty }} /</text>
                    {{ [obj.base_unit_qty, obj.base_unit_name].join(' ') }}                    
                </view>                
            </template>
            <uni-list>
                <checkbox-group @change="handle_inv_check($event, obj)">
                <uni-list-item
                    v-for="(inv, index) in filter_invs(obj.material_no)"
                    :key="index"
                    :title="`库位号：${inv['FStockLocId.FNumber']}`"
                    :note="`批次号: ${inv.FBatchNo}`"
                    :rightText="[inv.FQty, inv['FStockUnitId.FName']].join(' ')"
                >
                    <template v-slot:header>
                        <view class="uni-list-item-header">
                            <checkbox :value="inv.FID.toString()" :checked="inv.checked" :disabled="inv.disabled" />
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item-footer">
                            <text>{{ [inv.FQty, inv['FStockUnitId.FName']].join(' ') }}</text>
                            <uni-badge :text="-inv.checked_qty" size="normal" class="unmount-qty" />
                        </view>
                    </template>
                </uni-list-item>
                </checkbox-group>
                <uni-list-item
                    v-for="(inv_log, index) in filter_inv_logs(obj.material_no)"
                    :key="index"
                    :title="`库位号：${inv_log['FStockLocId.FNumber']}`"
                    :note="`批次号: ${inv_log.FBatchNo}`"
                    :rightText="`已下架 ${[inv_log.FOpQTY, inv_log['FStockUnitId.FName']].join(' ')}` "
                >
                    <template v-slot:header>
                        <view class="uni-list-item-header">
                            <checkbox :value="inv_log.FID.toString()" :checked="true" :disabled="true" />
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { Inv, InvLog } from '@/utils/model'
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_outbound_task: {},
                invs: [], // 加载库存信息，预览自动分配的待下架信息
                inv_logs: [], // 加载库存变更日志，获取已下架信息
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '更多' }
                    ],
                    button_group: [
                        {
                            text: '自动分配',
                            backgroundColor: 'linear-gradient(90deg, #FFCD1E, #FF8A18)',
                            color: '#fff'
                        },
                        {
                            text: '批量下架',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
            this.cur_staff = store.state.cur_staff
            this.cur_outbound_task = uni.getStorageSync('cur_outbound_task')  
            this.load_invs()
            console.log('onShow:', this.$data)
        },
        onShow() {
            
        },
        methods: {
            // >>> component
            goods_nav_click(e) {
                if (e.index === 0) this.more_actions() // btn:更多
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.if_auto_allocate() // btn:自动分配
                if (e.index === 1) this.if_submit_batch_unmount() // btn:批量下架
            },
            // action 相关
            more_actions() {
                uni.showActionSheet({
                    itemList: ['扫描下架', '出库详情', '操作日志'],
                    success: (e) => {
                        console.log('showActionSheet e:', e)
                        if (e.tapIndex === 0) uni.navigateTo({ url: '/pages/operation/outbound/unmount' })
                        if (e.tapIndex === 1) uni.navigateTo({ url: '/pages/operation/outbound/task' })
                        if (e.tapIndex === 2) uni.navigateTo({ url: '/pages/operation/outbound/logs' })
                    }
                })
            },
            if_auto_allocate() {
                if (this.invs.some(inv => inv.checked)) {
                    uni.showModal({
                        title: "自动分配注意事项",
                        content: "当前已有库存分配信息，开始自动分配后，将会清除之前的分配并产生新的分配，自动分配遵循先入先出原则",
                        success: (res) => {
                            if (res.confirm) this.auto_allocate()
                        },
                        fail: (err) => {
                            console.log('if_auto_allocate fail:', err)
                        }
                    })
                } else {
                    this.auto_allocate()
                }               
            },
            auto_allocate() {
                this.invs.forEach(inv => {
                    inv.checked = false
                    inv.checked_qty = 0
                    inv.disabled = false
                })
                this.cur_outbound_task.outbound_list.forEach(obj => {
                    let unmount_qty = obj.base_unit_qty - obj.unmounted_qty
                    let sum_checked_qty = 0
                    this.invs.map(inv => {
                        if(inv['FMaterialId.FNumber'] == obj.material_no) {
                            if (unmount_qty - sum_checked_qty > 0) {
                                let checking_qty = Math.min(inv.FQty, unmount_qty - sum_checked_qty) // [inv.FQty, unmount_qty - sum_checked_qty].sort((x,y) => x-y)[0]
                                inv.checked = true
                                inv.checked_qty = checking_qty
                                sum_checked_qty += checking_qty
                            } else {
                                inv.disabled = true
                            }
                        }
                    })
                    obj.checked_qty = sum_checked_qty
                })
            },
            if_submit_batch_unmount() {
                if (this.invs.some(inv => inv.checked)) {
                    uni.showModal({
                        title: "确认下架注意事项",
                        content: '请仔细核对下架信息，确认下架操作后，将会批量扣减库存。',
                        success: (res) => {
                            if (res.confirm) this.submit_batch_unmount()
                        },
                        fail: (err) => {
                            console.log('if_submit_batch_unmount fail:', err)
                        }
                    })
                } else {
                    uni.showToast({ icon: 'none', title: '未勾选任何库存' })
                }                
            },
            submit_batch_unmount() {
                uni.showLoading({ title: 'Loading' })
                let inv_logs = []
                this.invs.filter(inv => inv.checked).forEach(inv => {
                    let inv_log = new InvLog({
                        FOpType: 'out',
                        FStockId: inv.FStockId,
                        FStockLocNo: inv['FStockLocId.FNumber'],
                        FMaterialId: inv.FMaterialId,
                        FOpQTY: inv.checked_qty,
                        FBatchNo: inv.FBatchNo,
                        FBillNo: this.cur_outbound_task.bill_no,
                        FOpStaffNo: this.cur_staff.FNumber
                    })
                    inv_log.save()
                })
                uni.hideLoading()
            },
            handle_inv_check(e, obj) {
                // console.log('handle_inv_check e, obj', e, obj)
                let invs = this.invs.filter(inv => inv['FMaterialId.FNumber'] == obj.material_no) // 筛选当前物料的库存
                let unmount_qty = obj.base_unit_qty - obj.unmounted_qty // 待下架数量
                let sum_checked_qty = 0 // 已勾选数量                
                let cur_checked_ids = e.detail.value.map(v => v * 1) // 当前勾选的
                let prev_checked_ids = [] // 之前勾选，当前仍保持勾选的
                let new_checked_id = null
                // 清除去勾选的check信息，记录之前保持勾选的
                invs.forEach(inv => {
                    if (inv.checked) {
                        if (cur_checked_ids.includes(inv.FID)) {
                            prev_checked_ids.push(inv.FID)
                            sum_checked_qty += inv.checked_qty
                        } else {
                            inv.checked = false
                            inv.checked_qty = 0
                        }
                    }
                    inv.disabled = false
                })              
                cur_checked_ids.forEach(id => {
                    if (!prev_checked_ids.includes(id)) new_checked_id = id
                })                
                if (new_checked_id) {
                    // 处理新check信息
                    // console.log('新增的check id', new_checked_id)
                    let new_check_inv = invs.find(inv => inv.FID == new_checked_id)
                    let checking_qty = Math.min(new_check_inv.FQty, unmount_qty - sum_checked_qty) // [new_check_inv.FQty, unmount_qty - sum_checked_qty].sort((x,y) => x-y)[0]
                    new_check_inv.checked = true
                    new_check_inv.checked_qty = checking_qty
                    sum_checked_qty += checking_qty
                }                
                if (sum_checked_qty < unmount_qty) {
                    // 如果check数量不足，则优先从已check的补足
                    invs.forEach(inv => {
                        if (prev_checked_ids.includes(inv.FID) && (inv.FQty - inv.checked_qty > 0)) {
                            let checking_qty = Math.min(inv.FQty - inv.checked_qty, unmount_qty - sum_checked_qty) // [inv.FQty - inv.checked_qty, unmount_qty - sum_checked_qty].sort((x,y) => x-y)[0]
                            inv.checked_qty += checking_qty
                            sum_checked_qty += checking_qty
                        }
                    })                    
                } else {
                    invs.forEach(inv => inv.disabled = !inv.checked) // check数量足够时，禁用其他check选项
                }
                obj.checked_qty = sum_checked_qty
            },
            // Inv 相关
            load_invs() {
                const options = {
                    FStockId: this.cur_stock.FStockId,
                    'FMaterialId.FNumber_in': this.cur_outbound_task.outbound_list.map(x => x.material_no),
                    FQty_gt: 0,
                }
                const meta = { order: 'FBatchNo ASC, FStockLocId.FNumber ASC' }
                Inv.query(options, meta).then(res => {
                    this.invs = res.data
                    this.load_inv_logs()
                })
            },
            search_invs(material_no) {
                uni.navigateTo({ url: '/pages/operation/manage/inv_search?t=' + material_no })
            },
            // InvLog 相关
            load_inv_logs() {
                InvLog.query(
                    { FStockId: this.cur_stock.FStockId, FBillNo: this.cur_outbound_task.bill_no, FOpType_in: ['out', 'out_cl'] }, 
                    { page: 1, per_page: 5, order: 'FCreateTime DESC' }).then(res => {
                    res.data.reverse().forEach(log => this.unshift_inv_log(log))
                    this.cur_outbound_task.outbound_list.forEach(obj => {
                        let unmounted_qty = 0
                        this.filter_inv_logs(obj.material_no).forEach(inv_log => unmounted_qty += inv_log.FOpQTY)
                        obj.unmounted_qty = unmounted_qty
                        obj.checked_qty = 0 // init
                        if (unmounted_qty > obj.base_unit_qty) {
                            this.filter_invs(obj.material_no).forEach(inv => inv.disabled = true)
                        }
                    })
                })
            },
            // 日志逐条插入列表中，判断是否取消
            unshift_inv_log(inv_log) {
                if (inv_log.FOpType == 'out_cl') {
                    let refer_inv_log = this.inv_logs.find(x => x.FID === inv_log.FReferId )
                    if (refer_inv_log) refer_inv_log.status = '已取消'
                }
                this.inv_logs.unshift(inv_log)
            },
            filter_invs(material_no) {
                return this.invs.filter(x => x['FMaterialId.FNumber'] == material_no)
            },
            filter_inv_logs(material_no) {
                return this.inv_logs.filter(x => x['FMaterialId.FNumber'] == material_no && x.FOpType == 'out' && !x.status )
            }
        }
    }
</script>

<style lang="scss">
    .uni-section-icon {
        margin-right: 10px;
    }
    .uni-section-right-text {
        color: #999;
        font-size: 12px;
    }
    .uni-list-item-header {
        display: flex; 
        align-items: center;
        margin-right: 6px;
    }
    .uni-list-item-footer {
        display: flex;
        align-items: center;
        color: #999;
        font-size: 12px;
        .unmount-qty {
            margin-left: 5px;
        }
    }
</style>
