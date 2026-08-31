<template>
    <uni-section title="1.输入单据编号" type="square" :sub-title="breadcrumb_stockname()" sub-title-color="#007aff" @click="debug">
        <view class="container">
            <uni-forms ref="search_form" :model="search_form" :label-width="72" class="search-form">
                <uni-forms-item label="单据编号" name="bill_no">
                    <uni-easyinput v-model="search_form.bill_no" trim placeholder="需求单据编号" />
                </uni-forms-item>
                <uni-forms-item label="客户编号" name="customer_abbr">
                    <uni-easyinput v-model="search_form.customer_abbr" trim />
                </uni-forms-item>
            </uni-forms>
            
            <button type="primary" size="mini" @click="search">查询</button>
            <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
        </view>
    </uni-section>
    
    <uni-section v-if="invs.length" title="库存信息" type="square" sub-title="勾选后，再次点击该行可修改选择数量" sub-title-color="#007aff">
        <uni-list>
            <uni-list-item v-for="(inv, index) in invs" :key="index"
                @click="edit_checked_qty(inv)" clickable show-arrow>
                <template #header>
                    <view class="uni-list-item__head">
                        <checkbox :checked="inv.checked" @click="checkbox_click" :data-id="inv.id" />
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title text-bold">{{ inv.material_no }} {{ inv.material_name }}</view>
                        <view class="note">
                            <view>{{ inv.material_spec }}</view>
                            <view>库位：<text class="text-primary">{{ inv.loc_no }}</text></view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ inv.qty }} {{ inv.unit }}</view>
                        <view v-if="inv.checked" class="text-primary">已选择：{{ inv.checked_qty }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <!-- <uni-section title="操作日志" type="square" sub-title="保留最近5条" class="above-uni-goods-nav">
        <uni-list>
            <uni-list-item
                v-for="(inv_log, index) in inv_logs"
                :key="index"
                @click="if_cancel(inv_log.FID)" clickable
                show-arrow
                >
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">{{ formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }} >> 入库成功</view>
                        <view class="note">
                            <view>物料编码：{{ inv_log['FMaterialId.FNumber'] }} [{{ inv_log['FMaterialId.FName'] }}]</view>
                            <view>库位号：{{ inv_log['FStockLocId.FNumber'] }}</view>
                            <view>入库数量：{{ inv_log['FOpQTY'] }} {{ inv_log['FStockUnitId.FName'] }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <text class="uni-list-item-right-text">{{ inv_log.status }}</text>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section> -->
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @button-click="goods_nav_button_click"
        />
    </view>
    
    <!-- 修改checked_qty -->
    <uni-popup ref="checked_qty_dialog" type="dialog">
        <uni-popup-dialog title="修改选择的库存数" type="error" :show-close="false">
            <view class="plan-form">
                <uni-number-box 
                    v-model="inv_editing.checked_qty" 
                    :min="0" :max="inv_editing.FQty"
                    @change="inv_editing.checked = inv_editing.checked_qty > 0"
                />
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
    <!-- 出库日志明细 -->
    <uni-drawer ref="inv_logs_drawer" mode="left" :width="$store.state.drawer_width" >
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="出库日志" type="square">
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.inv_logs_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list>
                    <uni-list-item v-for="(log, index) in inv_logs" :key="index">
                        <template #body>
                            <view class="uni-list-item__body">
                                <view class="title text-bold">{{ log['FMaterialId.FNumber'] }} {{ log['FMaterialId.FName'] }}</view>
                                <view class="note">
                                    <view>{{ log['FMaterialId.FSpecification'] }}</view>
                                    <view>库位：<text class="text-primary">{{ log['FStockLocId.FNumber'] }}</text></view>
                                    <view>创建时间：{{ formatDate(log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <view>{{ log['FOpQTY'] }} {{ log['FStockUnitId.FName'] }}</view>
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
    import scan_code from '@/utils/scan_code'
    import { Inv, InvLog } from '@/utils/model'
    import { breadcrumb_stockname, formatDate, play_audio_prompt } from '@/utils'
    
    export default {
        data() {
            return {
                broadcast_receiver: null,
                invs: [],
                inv_logs: [],
                new_inv_logs: [],
                inv_editing: {},
                search_form: {
                    bill_no: '',
                    customer_abbr: '',
                    batch_no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'checkbox', text: '全选' },
                        { icon: 'chat', text: '日志', info: 0 }
                    ],
                    button_group: [
                        // { text: '扫码', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '提交出库', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                    ]
                }
            }
        },
        mounted() {
            // this.set_batch_no()
        },
        methods: {
            breadcrumb_stockname,
            formatDate,
            debug () {
                this.$logger.info('>>>', this.$data)
            },
            // 页面动作
            check_all() {
                if (!this.invs.length) return 
                let result = this.invs.some(e => !e.checked || !e.checked_qty || e.checked_qty < e.FQty)
                for (let inv of this.invs) {
                    inv.checked = result
                    inv.checked_qty = inv.FQty
                }
            },
            checkbox_click(e) {
                let inv = this.invs.find(x => x.id == e.target.dataset.id)
                if (inv.checked) {
                    inv.checked = false
                    inv.checked_qty = 0
                } else {
                    inv.checked = true
                    inv.checked_qty = inv.qty
                }
            },
            edit_checked_qty(inv) {
                if (inv.checked) {
                    this.$refs.checked_qty_dialog.open()
                    this.inv_editing = inv
                }
            },
            goods_nav_click(e) {
                if (e.index === 0) this.check_all()
                if (e.index === 1) this.$refs.inv_logs_drawer.open()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.submit_outbound() // btn:提交
            },
            reset_search_form() {
                this.search_form = { bill_no: '', customer_abbr: '', batch_no: '' }
                this.invs = []
                this.inv_logs = []
                this.goods_nav.options[1].info = 0
            },
            async search() {
                // set batch_no
                let batch_no = ['PK', '', '']
                if (this.search_form.bill_no) batch_no[1] = this.search_form.bill_no.toUpperCase()
                if (this.search_form.customer_abbr) batch_no[2] = this.search_form.customer_abbr.toUpperCase()
                if (!batch_no[1]) return
                this.search_form.batch_no = batch_no.join('|')
                uni.showLoading({ title: 'Loading', mask: true })
                await this.load_invs()
                await this.load_inv_logs()
                uni.hideLoading()
            },
            async load_invs() {
                this.invs = []
                if (!this.search_form.batch_no) return
                let options = { FQty_gt: 0, FBatchNo_sw: this.search_form.batch_no }
                let res = await Inv.query(options, { order: 'FMaterialId.FNumber ASC' })
                if (res.data.length == 0) {
                    uni.showModal({ title: '提示', content: '未找到库存信息' })
                    return
                }
                for (let d of res.data) {
                    this.invs.push({
                        id: d['FID'],
                        material_id: d['FMaterialId'],
                        material_no: d['FMaterialId.FNumber'],
                        material_name: d['FMaterialId.FName'],
                        material_spec: d['FMaterialId.FSpecification'],
                        loc_no: d['FStockLocId.FNumber'],
                        batch_no: d['FBatchNo'],
                        supplier_id: d['FSupplierId'],
                        qty: d['FQty'],
                        unit: d['FStockUnitId.FName']
                    })
                }
            },
            async load_inv_logs() {
                this.inv_logs = []
                if (!this.search_form.batch_no) return
                let options = { FOpType: 'out', FBatchNo_sw: this.search_form.batch_no }
                let res = await InvLog.query(options, { order: 'FCreateTime DESC'})
                for (let d of res.data) {
                    this.inv_logs.push(d)
                }
                this.goods_nav.options[1].info = res.data.length
            },
            async submit_outbound() {
                try {
                    if (this.is_calling) return
                    this.is_calling = true
                    uni.showLoading({ title: 'Loading', mask: true })
                    for (let inv of this.invs) {
                        let inv_log = new InvLog({
                            FOpType: 'out',
                            FStockId: store.state.cur_stock.FStockId,
                            FStockLocNo: inv.loc_no,
                            FMaterialId: inv.material_id,
                            FOpQTY: inv.checked_qty,
                            FBatchNo: inv.batch_no,
                            FSupplierId: inv.supplier_id,
                            FBillNo: '',
                            FOpStaffNo: store.state.cur_staff.FNumber
                        })
                        this.new_inv_logs.push(inv_log)
                    }
                    // 统一分配操作序号，统一提交保存，防重复提交
                    for (let i = 0; i < this.new_inv_logs.length; i++) {
                        uni.showToast({ title: `${i}/${this.new_inv_logs.length}`, mask: true })
                        await this.new_inv_logs[i].save()
                    }
                    await this.load_invs()
                    await this.load_inv_logs()
                    uni.hideLoading()
                    uni.showToast({ title: '出库成功', mask: true })
                } catch (err) {
                    // console.log('err', err) 
                } finally {
                    uni.hideLoading()
                    this.new_inv_logs = []
                    this.is_calling = false
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-forms.search-form::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
</style>
