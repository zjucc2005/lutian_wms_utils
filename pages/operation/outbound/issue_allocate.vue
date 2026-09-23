<template>
    <uni-section title="发料信息" type="square" :sub-title="bill_no" sub-title-color="#007aff" @click="$logger.info('>>>', $data)">
        <uni-list>
            <uni-list-item>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title text-bold">{{ material.material_no }} {{ material.material_name }}</view>
                        <view class="note">
                            <view>{{ material.material_spec }}</view>
                            <!-- <view>仓库：<text :class="[material.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ material.stock_name }}</text></view> -->
                            <view>仓管员：{{ material.storekeeper }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>应发 <text>{{ material.must_qty }}</text> {{ material.unit_name }}</view>
                        <view>实发 <text class="text-primary">{{ material.send_qty }}</text> {{ material.unit_name }}</view>
                        <view>未发 <text class="text-error">{{ Math.max(material.must_qty - material.send_qty, 0) }}</text> {{ material.unit_name }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>

    <uni-section title="库存信息" type="square" sub-title="点击或扫描库位号进行出库" sub-title-color="#007aff" class="above-uni-goods-nav">
        <uni-list-item v-for="(inv, index) in invs" :key="index"
            @click="select_inv(inv)" clickable show-arrow>
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ inv.stock_loc }}</view>
                    <view class="note">
                        <view>批次：<text class="text-primary">{{ inv.batch_no }}</text></view>
                        <view v-if="inv.supplier">供应商：{{ inv.supplier }}</view>
                    </view>
                </view>
            </template>
            <template v-slot:footer>
                <view class="uni-list-item__foot">
                    <view>{{ inv.qty }}</view>
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

    <uni-popup ref="outbound_dialog" type="dialog">
        <uni-popup-dialog title="出库数量" type="error"
            @close="outbound_dialog_close"
            @confirm="outbound_dialog_confirm">
            <view class="plan-form">
                <uni-number-box v-model="inv_editing.op_qty" :min="1" :max="inv_editing.qty"
                    @change="inv_editing.checked = inv_editing.checked_qty > 0" />
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import scan_code from '@/utils/scan_code'
    import { play_audio_prompt } from '@/utils'
    import { Inv, InvLog } from '@/utils/model'
    export default {
        data () {
            return {
                bill_no: '',
                material: {},
                outbound_qty: 0,
                invs: [],
                inv_editing: {},
                goods_nav: {
                    options: [
                    ],
                    button_group: [
                        { text: '扫码库位', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
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
                this.load_inv_logs()
            })
        },
        onShow() {
            // #ifdef APP-PLUS
            this.reg_broadcast_receiver()
            // #endif
        },
        computed: {
            need_outbound() {
                if (!this.material.material_no) return false
                return this.material.must_qty > this.material.send_qty
            },
        },
        methods: {
            goods_nav_click(e) {
                // code
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(code) {
                let inv = this.invs.find(x => x.stock_loc == code)
                if (inv) {
                    this.select_inv(inv)
                } else {
                    uni.showToast({ icon: 'none', title: '库位号不存在' })
                }
            },
            async load_invs() {
                let options = { FStockId: store.state.cur_stock.FStockId, 'FMaterialId.FNumber': this.material.material_no, FQty_gt: 0 }
                let meta = { 
                    fields: ['FID', 'FStockLocId', 'FStockLocId.FNumber', 'FQty', 'FBatchNo', 'FSupplierId', 'FSupplierId.FName'],
                    order: 'FSupplierId ASC, FBatchNo ASC, FStockLocId.FNumber ASC' }
                // uni.showLoading({ title: 'Loading' })
                let res = await Inv.query(options, meta)
                // uni.hideLoading()
                let invs = []
                for (let d of res.data) {
                    invs.push({
                        id: d['FID'],
                        stock_loc_id: d['FStockLocId'],
                        stock_loc: d['FStockLocId.FNumber'],
                        qty: d['FQty'],
                        op_qty: d['FQty'],
                        batch_no: d['FBatchNo'],
                        supplier_id: d['FSupplierId'],
                        supplier: d['FSupplierId.FName']
                    })
                }
                this.invs = invs
            },
            async load_inv_logs() {
                let options = { FStockId: store.state.cur_stock.FStockId, 'FMaterialId.FNumber': this.material.material_no,
                                FBillNo: this.bill_no, FOpType: 'out'}
                this.material.send_qty = await InvLog.sum_qty(options)
            },
            async submit_outbound() {
                try {
                    if (this.is_calling) return
                    this.is_calling = true
                    // validation
                    if (!this.need_outbound) {
                        uni.showModal({ title: '提示', content: `不能出库\n物料[${this.material.material_no}]已出库足够数量` }); return;
                    }
                    let inv_log = new InvLog({
                        FOpType: 'out',
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: this.inv_editing.stock_loc,
                        FMaterialId: this.material.material_id,
                        FOpQTY: this.inv_editing.op_qty,
                        FBatchNo: this.inv_editing.batch_no,
                        FSupplierId: this.inv_editing.supplier_id,
                        FBillNo: this.bill_no,
                        FOpStaffNo: store.state.cur_staff.FNumber
                    })
                    uni.showLoading({ title: 'Loading', mask: true })
                    await inv_log.save()
                    await this.load_invs()
                    await this.load_inv_logs()
                    uni.hideLoading()
                    uni.showToast({ title: '出库成功', mask: true })
                    // console.log('>>> submit_outbound', inv_log)
                    this.$refs.outbound_dialog.close()
                } catch (err) {
                    this.$logger.info('>>> err', err)
                } finally {
                    uni.hideLoading()
                    this.is_calling = false
                }
            },
            select_inv(inv) {
                this.$refs.outbound_dialog.open()
                this.inv_editing = inv
            },
            outbound_dialog_close() {
                this.$refs.outbound_dialog.close()
                this.inv_editing.op_qty = this.inv_editing.qty
            },
            outbound_dialog_confirm() {
                this.submit_outbound()
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

</style>
