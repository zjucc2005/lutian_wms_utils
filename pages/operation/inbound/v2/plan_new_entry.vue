<template>
    <view>
        <uni-section type="square" title="新增计划明细"
            :sub-title="inbound_task.bill_no"
            sub-title-color="#007aff"
            >
            <uni-list v-if="plan_form.material_no">
                <template
                    v-for="(obj, index) in inbound_task.inbound_list"
                    :key="index"
                    >
                    <uni-list-item                   
                        v-if="obj.material_no == plan_form.material_no"
                        :right-text="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                        @click="handle_material_no_click()" clickable
                        >
                        <template v-slot:body>
                            <view class="uni-list-item__body">
                                <text class="title">{{ obj.material_no }}</text>
                                <view class="note">
                                    <view>名称：{{ obj.material_name }}</view> 
                                    <view>规格：{{ obj.material_spec }}</view>
                                    <view>
                                        <uni-icons type="home" color="#999"></uni-icons>
                                        <text class="src-stock">{{ obj.src_stock_name }}</text>
                                        <uni-icons type="redo" color="#007bff" style="margin: 0 5px;"></uni-icons> 
                                        <uni-icons type="home" color="#007bff" ></uni-icons>
                                        <text class="dest-stock">{{ obj.dest_stock_name }}</text>
                                    </view>
                                    <view>批次：{{ obj.batch_no }}</view>
                                </view>
                            </view>
                        </template>
                    </uni-list-item>
                </template>
            </uni-list>
            <uni-list v-else>
                <uni-list-item
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#007bff', size: '24', type: 'list' }"
                    title="点击选择物料"
                    @click="handle_material_no_click" clickable
                />
            </uni-list>
        </uni-section>
        <!-- plan form -->
        <view class="container">
            <uni-forms ref="plan_form" :model="plan_form" :rules="plan_form_rules" labelWidth="80px">
                <uni-forms-item name="material_no" style="height: 0;"></uni-forms-item>
                <uni-forms-item label="库位号" name="loc_no" required>
                    <uni-data-picker
                        v-model="plan_form.loc_no"
                        :localdata="$store.state.stock_loc_opts"
                        split="-"
                        popup-title="请选择库位"
                    />
                </uni-forms-item>
                <uni-forms-item label="上架数量" name="op_qty" required>
                    <uni-easyinput v-model="plan_form.op_qty" type="number">
                        <template #right>
                            <text class="easyinput-suffix-text">{{ plan_form.base_unit_name }}</text>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
                <uni-forms-item label="备注" name="remark">
                    <uni-easyinput v-model="plan_form.remark" trim="both" />
                </uni-forms-item>
            </uni-forms>
        </view>
        
        <uni-section type="square" title="当前计划明细" class="above-uni-goods-nav">
            <template v-slot:right>
                <text class="sum_op_qty">总和： {{ sum_inv_plan_op_qty() }} {{ plan_form.base_unit_name }}</text>
            </template>
            <uni-swipe-action ref="inv_plan_swipe">
                <uni-swipe-action-item
                    v-for="(inv_plan, index) in inv_plans"
                    :key="index"
                    :threshold="60"
                    :right-options="swipe_options"
                    @click="swipe_action_click($event, inv_plan)"
                    >
                    <uni-list-item
                        :show-extra-icon="true"
                        :extra-icon="{ color: '#dd524d', size: '24', type: 'arrow-up' }"
                        :title="inv_plan['FStockLocId.FNumber']"
                        :note="inv_plan.FRemark"
                        >
                        <template v-slot:footer>
                            <view class="uni-list-item__foot">
                                <text class="op_qty">{{ inv_plan.FOpQTY }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                                <text class="status">{{ inv_plan.status }}</text>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @button-click="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { InvPlan } from '@/utils/model'
    import { is_material_no_format, is_loc_no_std_format, is_decimal_unit, play_audio_prompt } from '@/utils'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        data() {
            return {
                inbound_task: {},
                inv_plans: [],
                plan_form: {
                    material_no: '',
                    loc_no: '',
                    op_qty: '',
                    remark: '',
                    base_unit: 'Pcs',
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                },
                plan_form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编号不能为空'},
                        ]
                    },
                    loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let stock_loc = store.state.stock_locs.find(x => x.FNumber == value)
                                    if (stock_loc.FDocumentStatus != 'C') {
                                        return callback('此库位号未审核')
                                    }
                                    let inv_plan = this.inv_plans.find(x => x['FStockLocId.FNumber'] == value)
                                    if (inv_plan) {
                                        return callback('此库位号已有计划明细')
                                    }
                                }
                            }
                        ]
                    },
                    op_qty: {
                        rules: [
                            { required: true, errorMessage: '计划上架数量不能为空' },
                            { format: 'number', errorMessage: '计划上架数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('计划上架数量必须大于0')
                                    if (!this.plan_form.decimal_unit && !Number.isInteger(value)) {
                                        return callback('计划上架数量必须为整数')
                                    }
                                    let inbound_obj = this.inbound_task.inbound_list.find(x => x.material_no == this.plan_form.material_no)
                                    let planned_qty = this.sum_inv_plan_op_qty()
                                    if (inbound_obj && value + planned_qty > inbound_obj.base_unit_qty) {
                                        return callback('计划上架数量超过上限')
                                    }
                                }
                            }
                        ]
                    }
                },
                swipe_options: [
                    {
                        text: '删除',
                        style: {
                            backgroundColor: '#dd524d'
                        }
                    }
                ],
                goods_nav: {
                    options: [
                        { icon: 'list', text: '物料' }
                    ],
                    button_group: [
                        {
                            text: '扫码',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '新增',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('sendInboundTask', res => {
                console.log('eventChannel.on sendInboundTask', res)
                this.inbound_task = res.inbound_task
                if (res.material_no) {
                    this.set_plan_form(res.material_no)
                    this.load_inv_plans(res.material_no)
                }
            })
        },
        mounted() {
            
        },
        methods: {
            // >>> binding
            swipe_action_click(e, inv_plan) {
               if (e.index === 0) this.submit_delete(inv_plan) // btn:删除
            },
            goods_nav_click(e) {
                if (e.index === 0) this.handle_material_no_click() // btn:选择物料
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.submit_save() // btn:保存
            },
            handle_material_no_click() {
                let list = this.inbound_task.inbound_list.filter(x => x.dest_stock_id == store.state.cur_stock.FStockId).map(x => x.material_no)
                uni.showActionSheet({
                    itemList: list,
                    success: (e) => {
                        play_audio_prompt('success')
                        this.plan_form.material_no = list[e.tapIndex]
                        this.set_plan_form(list[e.tapIndex])
                        this.load_inv_plans(list[e.tapIndex])
                    }
                })
            },
            scan_code() {
                console.log('debug', this.$data)
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') this.handle_scan_code(res.result)
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        this.handle_scan_code(res.result)
                    }
                })
                // #endif
            },
            handle_scan_code(text) {
                if (is_material_no_format(text)) {
                    this.set_plan_form(text)
                    this.load_inv_plans(text)
                } else if (is_loc_no_std_format(text)) {
                    this.plan_form.loc_no = text
                } else {
                    if(!this.plan_form.material_no) {
                        this.set_plan_form(text)
                        this.load_inv_plans(text)
                    } else if (!plan.mount_form.loc_no) {
                        this.plan_form.loc_no = text
                    }
                }
            },
            submit_save() {
                this.$refs.plan_form.validate().then(_ => {
                    let obj = this.inbound_task.inbound_list.find(x => x.material_no == this.plan_form.material_no)
                    let inv_plan = new InvPlan({
                        FOpType: 'in',
                        FStockId: store.state.cur_stock.FStockId,
                        FStockLocNo: this.plan_form.loc_no,
                        FMaterialId: obj.material_id,
                        FOpQTY: this.plan_form.op_qty * 1,
                        FBatchNo: obj.batch_no,
                        FBillNo: this.inbound_task.bill_no,
                        FOpStaffNo: store.state.cur_staff.FNumber,
                        FRemark: this.plan_form.remark
                    })
                    // console.log('inv_plan', inv_plan)
                    uni.showLoading({ title: 'Loading' })
                    inv_plan.save().then(res => {
                        play_audio_prompt('success')
                        uni.hideLoading()
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            this.load_inv_plans(obj.material_no)
                            uni.showToast({ title: '保存成功' }) 
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                        this.reset_form()
                    })
                }).catch(err => {})
            },
            submit_delete(inv_plan) {
                if (inv_plan.FDocumentStatu == 'A') {
                    uni.showLoading({ title: 'Loading' })
                    InvPlan.delete([inv_plan.FID]).then(res => {
                        uni.hideLoading()
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            play_audio_prompt('delete')
                            let index = this.inv_plans.findIndex(x => x.FID == inv_plan.FID)
                            this.inv_plans.splice(index, 1)
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    })
                } else {
                    this.$refs.inv_plan_swipe.closeAll()
                    uni.showToast({ icon: 'error', title: '只能删除新增的计划' })
                }
            },
            // >>>
            load_inv_plans(material_no) {
                uni.showLoading({ title: 'Loading' })
                InvPlan.query({ 
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.inbound_task.bill_no,
                    'FMaterialId.FNumber': material_no,
                    FOpType: 'in',
                }, { order: 'FCreateTime DESC' }).then(res => { 
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        if (inv_plan.FDocumentStatu != 'A') {
                            inv_plan.status = store.state.inv_plan_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
                    uni.hideLoading()
                })
            },
            sum_inv_plan_op_qty() {
                return this.inv_plans.map(x => x.FOpQTY).concat([0]).reduce((x, y) => x + y)
            },
            set_plan_form(material_no) {
                let obj = this.inbound_task.inbound_list.find(x => x.material_no == material_no)
                if (obj) {
                    this.plan_form.material_no = obj.material_no
                    this.plan_form.base_unit_name = obj.base_unit_name
                    this.plan_form.decimal_unit = is_decimal_unit(obj.base_unit_name)
                } else {
                    this.plan_form.material_no = ''
                    this.plan_form.base_unit_name = 'Pcs'
                    this.plan_form.decimal_unit = false
                }
            },
            reset_form() {
                this.plan_form.loc_no = ''
                this.plan_form.op_qty = ''
                this.plan_form.remark = ''
                uni.pageScrollTo({ scrollTop: 0 })
            }
        }
    }
</script>

<style lang="scss">
    .sum_op_qty {
        color: $uni-text-color-grey;
        font-size: $uni-font-size-sm;
    }
</style>
