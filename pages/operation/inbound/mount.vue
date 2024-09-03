<template>
    <view>
        <uni-section title="上架" :sub-title="mount_form.material_name" type="line">
            <view class="container">
                <uni-forms ref="mount_form" :model="mount_form" :rules="mount_form_rules" labelWidth="80px">
                    <uni-forms-item label="物料编号" name="material_no">
                        <uni-easyinput 
                            v-model="mount_form.material_no"
                            trim="both"
                            @change="handle_material_no_change"
                            @clear="handle_material_no_change"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="库位号" name="loc_no">
                        <uni-easyinput v-model="mount_form.loc_no" trim="both" />
                    </uni-forms-item>
                    <uni-forms-item label="上架数量" name="op_qty">
                        <uni-easyinput v-model="mount_form.op_qty" type="number">
                            <template #right>
                                <text class="easyinput-suffix-text">{{ mount_form.base_unit_name }}</text>
                            </template>
                        </uni-easyinput>
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-section>
        <uni-section title="最近操作日志" type="line" style="padding-bottom: 60px;">
            <template v-slot:right>
                切换时间
            	<switch checked style="transform:scale(0.7)"/>
            </template>
            <uni-swipe-action>
                <uni-swipe-action-item
                    v-for="index in 5"
                    :key="index"
                    :threshold="60"
                    :right-options="log_options"
                    @click="swipe_action_click($event, index)"
                >
                    <uni-list-item title="{物料号} 上架 {数量} 到 { 库位号}" rightText="2024-08-20" />
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_buttonClick"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store';
    import { is_material_no_format, is_loc_no_std_format, is_decimal_unit } from '@/utils';
    import { get_bd_material } from '@/utils/api';
    import { get_c_stock_locs } from '@/utils/api/c_stock_loc';
    import InvLog from '@/utils/model/inv_log';
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_inbound_task: {},
                c_inv_logs: [],
                c_stock_locs: [],
                bd_materials: [], // 物料基础数据Array，cache
                mount_form: {
                    material_no: '',
                    material_name: '',
                    loc_no: '',
                    op_qty: '',
                    base_unit: 'Pcs',
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                },              
                mount_form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编号不能为空'},
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let material_no = value
                                    let use_org_id = this.cur_stock.FUseOrgId
                                    let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                                    if (!bd_material) {
                                        return get_bd_material(material_no, use_org_id).then(res => {
                                            if (res.data[0]) {
                                                bd_material = res.data[0]
                                                this.bd_materials.push(res.data[0])
                                                return bd_material
                                            } else {
                                                return callback('不存在此物料编码')
                                            }
                                        })
                                    }
                                }
                            }
                        ]
                    },
                    loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let c_stock_loc = this.c_stock_locs.find(x => x.FNumber == value)
                                    if (!c_stock_loc) {
                                        return callback('不存在此库位号')
                                    } else if (c_stock_loc.FDocumentStatus != 'C') {
                                        return callback('此库位号未审核')
                                    }
                                }
                            }
                        ]
                    },
                    op_qty: {
                        rules: [
                            { required: true, errorMessage: '上架数量不能为空' },
                            { format: 'number', errorMessage: '上架数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('上架数量必须大于0')
                                    if (!this.mount_form.decimal_unit && !Number.isInteger(value)) {        
                                        return callback('上架数量必须为整数')
                                    }                                    
                                }
                            }
                        ]
                    }
                },
                log_options: [
                    {
                        text: '撤回',
                        style: {
                            backgroundColor: '#f56c6c'
                        }
                    }
                ],
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '更多' }
                    ],
                    button_group: [
                        {
                            text: '扫码',
                            backgroundColor: 'linear-gradient(90deg, #999, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '提交上架',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock // 加载当前仓库
            this.cur_staff = store.state.cur_staff // 加载当前员工
            this.cur_inbound_task = uni.getStorageSync('cur_inbound_task')
            InvLog.query({ FStockId: this.cur_stock.FStockId }, { limit: 5, order: 'FCreateTime DESC' }).then(res => {
                this.c_inv_logs = res.data
            })
            get_c_stock_locs(this.cur_stock.FStockId).then(res => {
                this.c_stock_locs = res.data // 加载当前仓库的库位数据
            })
        },
        methods: {                          
            // button mapping
            swipe_action_click(e, index) {
               console.log('swipe action click e:', e, index) 
            },
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.more_actions() // btn:更多     
                }                         
            },
            goods_nav_buttonClick(e) {
                if (e.index === 0) {
                    this.scan_code() // btn:扫码
                } else if (e.index === 1) {
                    this.submit() // btn:提交上架
                }
            },
            // main function
            handle_material_no_change(e) {
                console.log('handle_material_no_change e:', e)
                let material_no = this.mount_form.material_no
                if (!material_no) {
                    this.set_base_unit()
                    return
                }
                let use_org_id = this.cur_stock.FUseOrgId
                let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                if (bd_material) {
                    this.set_base_unit(bd_material)
                } else {
                    get_bd_material(material_no, use_org_id).then(res => {
                        if (res.data[0]) {
                            bd_material = res.data[0]
                            this.bd_materials.push(res.data[0])
                            this.set_base_unit(bd_material)
                        } else {
                            this.set_base_unit()
                        }
                    })
                }
            },
            set_base_unit(bd_material) {
                if (bd_material) {
                    this.mount_form.material_name = bd_material.FName
                    this.mount_form.base_unit = bd_material['FBaseUnitId.FNumber']
                    this.mount_form.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.mount_form.decimal_unit = is_decimal_unit(bd_material['FBaseUnitId.FName'])
                } else {
                    this.mount_form.material_name = ''
                    this.mount_form.base_unit = 'Pcs'
                    this.mount_form.base_unit_name = 'Pcs'
                    this.mount_form.decimal_unit = false
                }
            },
            more_actions() {
                uni.showActionSheet({
                    title: '',
                    itemList: ['入库任务', '操作日志', 'debug'],
                    popover: {},
                    success: (e) => {
                        console.log('showActionSheet e:', e)
                        if (e.tapIndex === 0) {
                            uni.navigateTo({
                                url: './task'
                            })
                        } else if (e.tapIndex === 1) {
                            uni.navigateTo({
                                url: './logs'
                            })
                        } else if (e.tapIndex === 2) {
                            console.log('data:', this.$data)
                        }
                    }
                })
            },
            scan_code() {
                uni.scanCode({
                    success: (res) => {
                         console.log("uni.scanCode res:", res)
                        if (is_material_no_format(res.result)) {
                            this.mount_form.material_no = res.result
                        } else if (is_loc_no_std_format(res.result)) {
                            this.mount_form.loc_no = res.result
                        } else {
                            if(!this.mount_form.material_no) {
                                this.mount_form.material_no = res.result
                            } else if (!this.mount_form.loc_no) {
                                this.mount_form.loc_no = res.result
                            }                   
                        }                       
                    }
                })
            },
            submit() {
                this.$refs.mount_form.validate().then(e => {
                    let bd_material = this.bd_materials.find(x => x.FNumber == this.mount_form.material_no)
                    let c_stock_loc = this.c_stock_locs.find(x => x.FNumber == this.mount_form.loc_no)
                    let inv_log = new InvLog({
                        FOpType: 'in',
                        FStockId: this.cur_stock.FStockId,
                        FStockLocNo: c_stock_loc.FNumber,
                        FMaterialId: bd_material.FMaterialId,
                        FOpQTY: this.mount_form.op_qty * 1,
                        FBatchNo: this.cur_inbound_task.batch_no,
                        FBillNo: this.cur_inbound_task.bill_no,
                        FOpStaffNo: this.cur_staff.FNumber
                    })
                    inv_log.save()
                    // console.log("提交上架 inv_log:", inv_log)
                    // validate material_no & loc_no
                    // submit
                    // handle latest logs in current page
                }).catch(err => {
                    console.log('提交上架err:', err);
                })
            }
        }
    }
</script>

<style>
    .easyinput-suffix-text {
        color: #666;
        padding: 0 10px;
    }
</style>
