<template>
    <uni-section title="扫码" type="square">
        <view class="container">
            <uni-forms ref="form" :model="form" :rules="form_rules" labelWidth="80px">
                <uni-forms-item label="物料编码" name="material_no" required>
                    <uni-easyinput 
                        v-model="form.material_no"
                        trim="both"
                        @change="handle_material_no_change"
                        @clear="handle_material_no_change"
                    />
                </uni-forms-item>
                <uni-forms-item label="库位号" name="loc_no" required>
                    <uni-easyinput v-model="form.loc_no" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="入库数量" name="qty" required>
                    <uni-easyinput v-model="form.qty" type="number">
                        <template #right>
                            <text class="easyinput-suffix-text">{{ material?.['FBaseUnitId.FName'] }}</text>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
            </uni-forms>
            
            <button type="primary" @click="submit_inbound">提交入库</button>
        </view>
    </uni-section>
    
    <uni-section title="最近操作日志" type="line" class="above-uni-goods-nav">
        <template #right>
            <uni-tag text="清空日志" type="error" @click="inv_logs=[];"/>
        </template>
        <uni-list-item v-for="(inv_log, index) in inv_logs" :key="index">
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ inv_log['FMaterialId.FNumber'] }} / {{ inv_log['FMaterialId.FName'] }}</view>
                    <view class="note">
                        <!-- <view>名称：{{ inv_log['FMaterialId.FName'] }}</view> -->
                        <view>规格：{{ inv_log['FMaterialId.FSpecification'] }}</view>
                        <view>批次：{{ inv_log.FBatchNo }}</view>
                        <view>库位：<text class="text-default">{{ inv_log['FStockLocId.FNumber'] }}</text></view>
                        <view>时间：{{ formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <view>{{ inv_log['FOpQTY'] }} {{ inv_log['FStockUnitId.FName'] }}</view>
                </view>
            </template>
        </uni-list-item>
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
                            { required: true, errorMessage: '物料编码不能为空' }
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
                                    if (value <= 0) {
                                        return callback('入库数量必须大于0')
                                    }
                                }
                            } 
                        ]
                    }
                },
                goods_nav: {
                    options: [
                        // { icon: 'more-filled', text: '更多' }
                    ],
                    button_group: [
                        { text: '扫码', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                    ]
                }
            }
        },
        methods: {
            formatDate,
            // 操作
            goods_nav_click(e) {
                // if (e.index === 0) this.more_actions() // btn:更多
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
            },
            handle_material_no_change() {
                if (this.form.material_no) {
                    this.load_material()
                } else {
                    this.material = {}
                }
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(text) {
                if (text.includes('-')) {
                    this.form.loc_no = text
                } else {
                    this.form.material_no = text
                    this.load_material()
                }
            },
            reset_form() {
                this.form = {
                    material_no: '',
                    loc_no: '',
                    qty: null
                }
                uni.pageScrollTo({ scrollTop: 0 })
            },
            after_save(res) {
                if (res.data.Result.ResponseStatus.IsSuccess) {
                    InvLog.find(res.data.Result.Id).then(find_res => {
                        if (find_res.data[0]) {
                            this.inv_logs.unshift(find_res.data[0])
                            uni.showToast({ title: '提交成功' })                           
                        } 
                    })
                } else {
                    uni.showToast({ title: '提交失败' })
                }
            },
            async load_material() {
                let res = await BdMaterial.query({ FNumber: this.form.material_no, FUseOrgId: store.state.cur_stock.FUseOrgId })
                if (res.data.length) {
                    this.material = res.data[0]
                }
            },
            async submit_inbound() {
                try {
                    await this.$refs.form.validate()
                    let loc_no = this.form.loc_no.toUpperCase()
                    let batch_no = formatDate(Date.now(), 'yyyyMMdd')
                    let log_res = await InvLog.query({
                        FMaterialId: this.material.FMaterialId, 
                        'FStockLocId.FName': loc_no, 
                        FOpQTY: this.form.qty * 1,
                        FBatchNo: batch_no })
                    // console.log('log_res', log_res)
                    if (log_res.data.length) {
                        uni.showToast({ icon: 'error', title: '重复入库' })
                        return
                    }
                    uni.showLoading({ title: 'Loading' })
                    let inv_log = new InvLog({
                        FOpType: 'in',
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: loc_no,
                        FMaterialId: this.material.FMaterialId,
                        FOpQTY: this.form.qty * 1,
                        FBatchNo: batch_no,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                    })
                    console.log('inv_log', inv_log)
                    let res = await inv_log.save()
                    play_audio_prompt('success')
                    this.after_save(res)
                    this.reset_form()
                    uni.hideLoading()
                } catch (err) {
                    // console.log('err', err) 
                }
            }
        }
    }
</script>

<style>

</style>
