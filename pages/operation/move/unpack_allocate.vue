<template>
    <uni-section title="发料信息" type="square">
        <uni-list>
            <uni-list-item>
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ material.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ material.material_name }}</view> 
                            <view>规格：{{ material.material_spec }}</view>
                            <view>仓库：<text class="text-primary">{{ material.stock_name }}</text></view>
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
    
    <uni-section title="库存信息" type="square">
        <template #right>
            <view>已选择：<text class="text-primary">{{ sum_checked_qty }}</text></view>
        </template>
        <uni-list-item v-for="(inv, index) in invs" :key="index">
            <template #header>
                <view class="uni-list-item__head">
                    <checkbox
                        :checked="inv.checked"
                        :disabled="inv.disabled"
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
                        <view v-if="inv['FSupplierId.FName']">供应商：{{ inv['FSupplierId.FName'] }}</view>
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
</template>

<script>
    import store from '@/store'
    import { Inv, InvPlan } from '@/utils/model'
    export default {
        data() {
            return {
                bill_no: '',
                material: {},
                invs: []
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel()
            eventChannel.on('eventInput', res => {
                this.$logger.info('eventChannel res:', res)
                this.bill_no = res.bill_no
                this.material = res.material
                this.load_invs()
            })
        },
        computed: {
            sum_checked_qty() {
                let res = 0
                for (let inv of this.invs) {
                    if (inv.checked) res += inv.FQty
                }
                return res
            }
        },
        methods: {
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
            async load_invs() {
                let options = { FStockId: store.state.cur_stock.FStockId, 'FMaterialId.FNumber': this.material.material_no, FQty_gt: 0 }
                let meta = { order: 'FSupplierId ASC, FBatchNo ASC, FStockLocId.FNumber ASC' }
                let res = await Inv.query(options, meta)
                this.invs = res.data
            },
        }
    }
</script>

<style>

</style>
