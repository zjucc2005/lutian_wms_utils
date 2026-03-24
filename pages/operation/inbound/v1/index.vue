<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        sub-title-color="#007aff"
        @click="$logger.info('>>>', this.$data, this.$refs)"
        >
        <view class="container">
            <uni-forms 
                ref="form"
                :model="form"
                :rules="form_rules"
                label-position="top"
                label-width="80px"
                err-show-type="modal"
                :border="true"
                >
                <uni-forms-item label="物料编码" name="material_no">
                    <template #label>
                        <view style="display: flex; justify-content: space-between;">
                            <view class="uni-forms-item__label">物料编码</view>
                            <view v-if="material" class="text-grey">{{ material?.FName }}</view>
                        </view>
                    </template>
                    <uni-easyinput 
                        v-model="form.material_no"
                        trim="both"
                        @change="handle_material_no_change"
                        @clear="handle_material_no_change"
                        :clearable="false"
                        :input-border="false">
                        <template #left>
                            <uni-icons v-if="material.FMaterialId" type="checkbox-filled" size="24" color="#67c23a"></uni-icons>
                            <uni-icons v-else-if="form.material_no && !material.FMaterialId" type="help-filled" size="24" color="#c0c4cc"></uni-icons>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
                <uni-forms-item label="库位号" name="loc_no">
                    <uni-easyinput v-model="form.loc_no" trim="both" :clearable="false" :input-border="false">
                        <template #left>
                            <uni-icons v-if="form.loc_no && $store.state.stock_locs.some(x => x.FNumber == form.loc_no.toUpperCase())" type="checkbox-filled" size="24" color="#67c23a"></uni-icons>
                            <uni-icons v-else-if="form.loc_no" type="help-filled" size="24" color="#c0c4cc"></uni-icons>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
                <uni-forms-item label="入库数量" name="qty">
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
    
    <uni-section title="操作日志" type="square" sub-title="保留最近5条" class="above-uni-goods-nav">
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
    </uni-section>
        
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @button-click="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import scan_code from '@/utils/scan_code'
    import { BdMaterial, Inv, InvLog } from '@/utils/model'
    import { formatDate, play_audio_prompt } from '@/utils'
    
    export default {
        data() {
            return {
                broadcast_receiver: null,
                material: {},
                inv_logs: [],
                form: {
                    material_no: '',
                    loc_no: '',
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
                                    if (!store.state.stock_locs.some(x => x.FNumber == value.toUpperCase())) {
                                        return callback('库位号不存在')
                                    }
                                }
                            }
                        ]
                    },
                    qty: {
                        rules: [
                            { required: true, errorMessage: '入库数量不能为空' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('入库数量必须大于0')
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
                        { text: '提交', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                    ]
                }
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
            // this.load_inv_logs()
        },
        methods: {
            formatDate,
            // operations
            goods_nav_click(e) {
                if (e.index === 0) this.reset_form()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.submit() // btn:提交
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            // functions
            handle_material_no_change() {
                if (this.form.material_no) {
                    this.load_material()
                } else {
                    this.material = {}
                }
            },
            handle_scan_code(text) {
                if (text.includes('||')) {
                    this.form.material_no = text.split('||')[1]
                    this.handle_material_no_change()
                } else if (text.includes('-') && !text.includes('.')) {
                    this.form.loc_no = text
                } else {
                    this.form.material_no = text
                    this.handle_material_no_change()
                }
            },
            if_cancel(inv_log_id) {
                uni.showActionSheet({
                    itemList: ['回退'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.submit_cancel(inv_log_id)
                    }
                })
            },
            reset_form() {
                this.form = { material_no: '', loc_no: '', qty: null }
                this.material = {}
            },
            set_realtime_log() {
                
            },
            after_save(res) {
                if (res.data.Result.ResponseStatus.IsSuccess) {
                    InvLog.find(res.data.Result.Id).then(find_res => {
                        if (find_res.data[0]) {
                            if (this.inv_logs.length >= 5) this.inv_logs.pop()
                            this.inv_logs.unshift(find_res.data[0])
                            uni.showToast({ title: '提交成功' })
                        } 
                    })
                } else {
                    uni.showToast({ title: '提交失败' })
                }
            },
            after_cancel(inv_log_id) {
                let index = this.inv_logs.findIndex(x => x.FID == inv_log_id)
                this.inv_logs.splice(index, 1)
            },
            // calls
            async load_material() {
                let res = await BdMaterial.query(
                    { FNumber: this.form.material_no, FUseOrgId: store.state.cur_stock.FUseOrgId },
                    { fields: ['FBoxStandardQty'] })
                if (res.data.length) {
                    this.material = res.data[0]
                    // 自动赋值单箱标准数量，待定
                    // if (this.material.FBoxStandardQty && !this.form.qty) {
                    //     this.form.qty = this.material.FBoxStandardQty
                    // }
                } else {
                    this.material = {}
                }
            },
            async submit() {
                try {
                    await this.$refs.form.validate()
                    let loc_no = this.form.loc_no.toUpperCase()
                    let batch_no = formatDate(Date.now(), 'yyyyMMdd')
                    let log_res = await InvLog.query({
                        FMaterialId: this.material.FMaterialId, 
                        'FStockLocId.FName': loc_no, 
                        FOpQTY: this.form.qty * 1,
                        FBatchNo: batch_no,
                        FCreateTime_ge: formatDate(Date.now() - 15000, 'yyyy-MM-dd hh:mm:ss') // 15s内禁止重复入库，防呆
                        })
                    if (log_res.data.length) {
                        uni.showToast({ icon: 'error', title: '重复入库' })
                        return
                    }
                    uni.showLoading({ title: 'Loading', mask: true })
                    let inv_log = new InvLog({
                        FOpType: 'in',
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: loc_no,
                        FMaterialId: this.material.FMaterialId,
                        FOpQTY: this.form.qty * 1,
                        FBatchNo: batch_no,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                    })
                    let res = await inv_log.save()
                    play_audio_prompt('success')
                    this.after_save(res)
                    this.reset_form()
                    uni.hideLoading()
                } catch (err) {
                    // console.log('err', err) 
                }
            },
            async submit_cancel(inv_log_id) {
                let inv_log = this.inv_logs.find(x => x.FID == inv_log_id)
                if (inv_log.FOpType == 'in' && !inv_log.status) {
                    let cl_inv_log = new InvLog({
                        FOpType: 'in_cl',
                        FStockId: inv_log.FStockId,
                        FStockLocNo: inv_log['FStockLocId.FNumber'],
                        FMaterialId: inv_log.FMaterialId,
                        FOpQTY: inv_log.FOpQTY,
                        FBatchNo: inv_log.FBatchNo,
                        FBillNo: inv_log.FBillNo,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                        FReferId: inv_log.FID
                    })
                    let cl_res = await cl_inv_log.save()
                    play_audio_prompt('success')
                    this.after_cancel(inv_log_id)
                    uni.showToast({ title: '回退成功' })
                } else {
                    play_audio_prompt('warn')
                    uni.showToast({ icon: 'error', title: 'ERROR' })
                }
            },
            // async load_inv_logs() {
            //     let options = { FStockId: store.state.cur_stock.FStockId }
            //     InvLog.query(options, { order: 'FID DESC' }).then(res => {
            //         // this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
            //         res.data.forEach(item => this.inv_logs.push(item) )
            //     })
            // },
            // #ifdef APP-PLUS
            // Broadcast receiver
            reg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                let IntentFilter = plus.android.importClass('android.content.IntentFilter')
                let filter = new IntentFilter()
                filter.addAction('android.intent.ACTION_DECODE_DATA')
                let receiver = plus.android.implements('io.dcloud.feature.internal.reflect.BroadcastReceiver', {
                    onReceive: (content, intent) => {
                        plus.android.importClass(intent)
                        let code = intent.getStringExtra('barcode_string')
                        this.$logger.info('>>> broadcast:', code)
                        play_audio_prompt('laser_scan')
                        this.handle_scan_code(code)
                    }
                })
                this.broadcast_receiver = receiver
                main.registerReceiver(this.broadcast_receiver, filter)
                this.$logger.info('>>> main.registerReceiver', this.broadcast_receiver)
            },
            unreg_broadcast_receiver() {
                let main = plus.android.runtimeMainActivity()
                main.unregisterReceiver(this.broadcast_receiver)
                this.$logger.info('>>> main.unregisterReceiver', this.broadcast_receiver)
            },
            // #endif
        }
    }
</script>

<style lang="scss" scoped>
    .uni-forms::v-deep {
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
    }
    
    .uni-easyinput::v-deep {
        .uni-input-input {
            font-size: 30px;
            text-align: right;
        }
    }
</style>
