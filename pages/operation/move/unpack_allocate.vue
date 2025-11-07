<template>
    <uni-section title="发料信息" type="square" :sub-title="bill_no" sub-title-color="#007aff">
        <uni-list>
            <uni-list-item>
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ material.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ material.material_name }}</view> 
                            <view>规格：{{ material.material_spec }}</view>
                            <view>仓库：<text :class="[material.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ material.stock_name }}</text></view>
                            <view>仓管员：{{ material.storekeeper }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ material.must_qty }} {{ material.unit_name }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <uni-section title="调拨日志" type="square">
        <template #right>
            <view>已调拨：<text class="text-primary">{{ sum_moved_qty }}</text></view>
        </template>
        <uni-list>
            <uni-list-item v-for="(inv_plan, index) in inv_plans" :key="index">
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            {{ inv_plan['FStockLocId.FNumber'] }}
                            <uni-icons type="redo" size="20" color="#007bff"></uni-icons>
                            <text class="dest_loc_no uni-ml-2">{{ inv_plan['FDestStockLocId.FNumber'] }}</text>
                        </view>
                        <view class="note">
                            <view>批次：{{ inv_plan.FBatchNo }}</view>
                            <view>供应商：{{ inv_plan['FSupplierId.FName'] }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view class="op_qty">
                            <text>{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                        </view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
        
        <uni-load-more v-if="inv_plans.length === 0" status="nomore" />
    </uni-section>
    
    <uni-section title="库存信息" type="square" class="above-uni-goods-nav">
        <template #right>
            <view>已选择：<text class="text-primary">{{ sum_checked_qty }}</text></view>
        </template>
        <uni-list-item v-for="(inv, index) in invs" :key="index">
            <template #header>
                <view class="uni-list-item__head">
                    <checkbox
                        :checked="inv.checked"
                        @click="checkbox_click"
                        :data-id="inv.FID"
                    />
                </view>
            </template>
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ inv['FStockLocId.FNumber'] }}</view>
                    <view class="note">
                        <view>批次：{{ inv.FBatchNo }}</view>
                        <view>供应商：{{ inv['FSupplierId.FName'] }}</view>
                    </view>
                </view>
            </template>
            <template v-slot:footer>
                <view class="uni-list-item__foot">
                    <view class="op_qty">
                        <text>{{ inv.FQty }} {{ inv['FStockUnitId.FName'] }}</text>
                    </view>
                </view>
            </template>
        </uni-list-item>
        <uni-load-more v-if="invs.length === 0" status="nomore" />
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
    import { Inv, InvPlan } from '@/utils/model'
    import { sleep } from '@/utils'
    export default {
        data() {
            return {
                bill_no: '',
                material: {},
                invs: [],
                inv_plans: [],
                goods_nav: {
                    options: [
                        // { icon: 'cart', text: '计划', info: '' }
                    ],
                    button_group: [
                        {
                            text: '新增调拨',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel()
            eventChannel.on('eventInput', res => {
                this.$logger.info('eventChannel res:', res)
                this.bill_no = res.bill_no
                this.material = res.material
                this.load_invs()
                this.load_inv_plans()
            })
        },
        computed: {
            sum_checked_qty() {
                let res = 0
                for (let inv of this.invs) {
                    if (inv.checked) res += inv.FQty
                }
                return res
            },
            sum_moved_qty() {
                let res = 0
                for (let inv_plan of this.inv_plans) {
                    res += inv_plan.FOpQTY
                }
                return res
            }
        },
        methods: {
            // 页面动作
            checkbox_click(e) {
                let inv = this.invs.find(x => x.FID == e.target.dataset.id)
                if (inv.checked) {
                    inv.checked = false
                } else {
                    inv.checked = true
                    if (this.sum_checked_qty >= this.material.must_qty) {
                        uni.showToast({ icon: 'none', title: '已选择足够数量' })
                    }
                }
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.submit_move() // btn:确认调拨
            },
            async load_invs() {
                let options = { FStockId: store.state.cur_stock.FStockId, 'FMaterialId.FNumber': this.material.material_no, FQty_gt: 0 }
                let meta = { order: 'FSupplierId ASC, FBatchNo ASC, FStockLocId.FNumber ASC' }
                // uni.showLoading({ title: 'Loading' })
                let res = await Inv.query(options, meta)
                // uni.hideLoading()
                this.invs = res.data
            },
            async load_inv_plans() {
                let options = { FStockId: store.state.cur_stock.FStockId, 'FMaterialId.FNumber': this.material.material_no, 
                                FBillNo: this.bill_no, FDocumentStatu: 'C', FOpType: 'mv' }
                let res = await InvPlan.query(options)
                this.inv_plans = res.data
            },
            async submit_move() {
                uni.showLoading({ title: 'Loading', mask: true })
                for (let inv of this.invs) {
                    let dest_loc_no = `${inv['FStockLocId.FNumber'].split('-')[0]}-拆包区`
                    if (inv.checked && inv['FStockLocId.FNumber'] !== dest_loc_no) {
                        let inv_plan = new InvPlan({
                            FOpType: 'mv',
                            FStockId: store.state.cur_stock.FStockId,
                            FStockLocNo: inv['FStockLocId.FNumber'],
                            FDestStockLocNo: dest_loc_no,
                            FMaterialId: inv.FMaterialId,
                            FOpQTY: inv.FQty,
                            FBatchNo: inv.FBatchNo,
                            FSupplierId: inv.FSupplierId,
                            FOpStaffNo: store.state.cur_staff.FNumber,
                            FBillNo: this.bill_no
                        })
                        let save_res = await inv_plan.save()
                        let query_res = await InvPlan.query({ FID: save_res.data.Result.Id })
                        await InvPlan.audit([save_res.data.Result.Id])
                        await InvPlan.execute(query_res.data[0])
                    }
                }
                await this.load_invs()
                await this.load_inv_plans()
                uni.hideLoading()
            }
        }
    }
</script>

<style>

</style>
