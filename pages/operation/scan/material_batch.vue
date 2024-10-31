<template>
    <uni-section title="扫描单据" type="square"
        v-if="step == 'bill'"
        class="above-uni-goods-nav"
        >
        <view class="container">
            <uni-easyinput 
                v-model="no"
                trim="both" 
                prefix-icon="scan"
                @icon-click="icon_click"
                @confirm="search"
                :style="{
                    height: '50px'
                }"
            ></uni-easyinput>
        </view>
    </uni-section>
    
    <uni-section title="扫描物料" type="square"
        v-if="step == 'material'"
        :sub-title="bill.bill_no"
        sub-title-color="#007aff"
        >
        <view class="container">
            <uni-forms ref="form" :model="form" :rules="form_rules" labelWidth="80px">
                <uni-forms-item label="物料编码" name="material_no">
                    <uni-easyinput 
                        v-model="form.material_no"
                        trim="both"
                        prefix-icon="scan"
                        @icon-click="icon_click"
                        @change="material_no_change"
                        @clear="material_no_change"
                    />
                    <view class="form-info">{{ form.material_name }}</view>
                </uni-forms-item>
                <uni-forms-item label="供应商" name="supplier_no">
                    <uni-easyinput 
                        v-model="form.supplier_no"
                        trim="both"
                        @change="supplier_no_change"
                        @clear="supplier_no_change"
                    />
                    <view class="form-info">{{ form.supplier_name }}</view>
                </uni-forms-item>
                <uni-forms-item label="批次号" name="batch_no">
                    <uni-easyinput v-model="form.batch_no" trim="both" />
                </uni-forms-item>
                <uni-forms-item label="数量" name="op_qty">
                    <uni-easyinput v-model="form.op_qty" type="number" :focus="form.op_qty_focus">
                        <template #right>
                            <text class="easyinput-suffix-text">{{ form.base_unit_name }}</text>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
            </uni-forms>
        </view> 
        <button @click="submit_save" type="primary" class="form-btn">
            <uni-icons type="checkmarkempty" color="#fff"></uni-icons> 提交
        </button>
    </uni-section>
    
    <uni-section title="追踪物料列表" type="square"
        v-if="step == 'material'"
        >
        <template #right>
            <view class="uni-section__right">
                <view @click="$refs.log_drawer.open()">
                    <uni-icons type="left" /> 日志
                </view>
            </view>
        </template>
        <uni-list>
            <uni-list-item
                v-for="(material, index) in bill.materials.filter(x => x.checked)"
                :key="index"
                >
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            {{ material.material_no }}
                            <uni-icons type="search" color="#007aff" @click="view_material(material.material_no)" />
                        </view>
                        <view class="note">
                            <view>名称：{{ material.material_name }}</view>
                            <view>规格：{{ material.material_spec }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <text v-if="material.done_qty" class="text-primary">{{ material.done_qty }} {{ material.base_unit_name }}</text>
                        <progress
                            :percent="_calc_percentage(material)" 
                            stroke-width="2"
                            :active-color="_calc_percentage(material) == 100 ? '#4cd964' : '#f0ad4e'"
                            :active="true"
                        />
                        <text>{{ material.base_unit_qty }} {{ material.base_unit_name }}</text>
                    </view>
                </template>
            </uni-list-item>
            <uni-list-item
                v-for="(material, index) in unplanned_materials"
                :key="index"
                >
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            <uni-tag text="计划外" type="warning" size="mini" />
                            {{ material.material_no }}
                            <uni-icons type="search" color="#007aff" @click="view_material(material.material_no)" />
                        </view>
                        <view class="note">
                            <view>名称：{{ material.material_name }}</view>
                            <view>规格：{{ material.material_spec }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <text v-if="material.done_qty" class="text-primary">{{ material.done_qty }} {{ material.base_unit_name }}</text>
                        <progress
                            :percent="_calc_percentage(material)" 
                            stroke-width="2"
                            :active-color="_calc_percentage(material) == 100 ? '#4cd964' : '#f0ad4e'"
                            :active="true"
                        />
                        <text>{{ material.base_unit_qty }} {{ material.base_unit_name }}</text>
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
            @button-click="goods_nav_button_click"
        />
    </view>
    
    <!-- 单据物料明细列表 -->
    <uni-drawer ref="detail_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section :title="['单据明细', bill.bill_no].join(' ')" type="square"
                sub-title="勾选的物料会显示在追踪列表"
                
                >
                <template #right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.detail_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list>
                    <uni-list-item
                        v-for="(material, index) in bill.materials"
                        :key="index"
                        >
                        <template #header>
                            <view class="uni-list-item__head">
                                <checkbox
                                    :checked="material.checked"
                                    @click="checkbox_click(material.material_id)"
                                />
                            </view>
                        </template>
                        <template #body>
                            <view class="uni-list-item__body">
                                <view class="title">
                                    {{ material.material_no }}
                                    <uni-icons type="search" color="#007aff" @click="view_material(material.material_no)" />
                                </view>
                                <view class="note">
                                    <view>名称：{{ material.material_name }}</view>
                                    <view>规格：{{ material.material_spec }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <text v-if="material.done_qty" class="text-primary">{{ material.done_qty }} {{ material.base_unit_name }}</text>
                                <progress
                                    :percent="_calc_percentage(material)" 
                                    stroke-width="2"
                                    :active-color="_calc_percentage(material) == 100 ? '#4cd964' : '#f0ad4e'"
                                    :active="true"
                                />
                                <text>{{ material.base_unit_qty }} {{ material.base_unit_name }}</text>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
    
    <!-- 扫描日志列表 -->
    <uni-drawer ref="log_drawer" mode="right" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section :title="`${{ send: '发料', receive: '用料' }[op_type]}日志`" type="square"
                sub-title="左滑可删除"
                >
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.log_drawer.close()"/>
                    </view>
                </template>
                
                <uni-swipe-action ref="log_swipe">
                    <uni-swipe-action-item
                        v-for="(log, index) in issuemtr_logs"
                        :key="index"
                        :threshold="60"
                        :right-options="swipe_options"
                        @click="submit_delete(log)"
                        >
                        <uni-list-item>
                            <template #body>
                                <view class="uni-list-item__body">
                                    <view class="title">
                                        <uni-tag v-if="_unplanned_material(log)" text="计划外" type="warning" size="mini" />
                                        {{ log['FMaterialId.FNumber'] }}
                                    </view>
                                    <view class="note">
                                        <view>名称：{{ log['FMaterialId.FName'] }}</view>
                                        <view>规格：{{ log['FMaterialId.FSpecification'] }}</view>
                                        <view>供应商：<text class="text-primary">{{ log['FSupplierId.FName'] }}</text></view>
                                        <view>批次：<text class="text-primary">{{ log.FBatchNo }}</text></view>
                                        <view>时间：{{ formatDate(log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                                    </view>
                                </view>
                            </template>
                            <template #footer>
                                <view class="uni-list-item__foot">
                                    <text>{{ log.FOpQTY }} {{ log['FStockUnitId.FName'] }}</text>
                                </view>
                            </template>
                        </uni-list-item>
                    </uni-swipe-action-item>
                </uni-swipe-action>
            </uni-section>
        </scroll-view>
    </uni-drawer>
</template>

<script>
    import store from '@/store'
    import { IssuemtrLog } from '@/utils/model'
    import { get_bd_material, get_bd_supplier, get_prd_issuemtrnotice, get_prd_ppbom } from '@/utils/api'
    import { play_audio_prompt, is_decimal_unit } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif 
    export default {
        data() {
            return {
                step: 'bill',  // bill: '扫描单据', material: '扫描物料' 
                op_type: 'send',  // send: '发料', receive: '用料'
                bd_materials: [], // 缓存计划外的物料
                bd_suppliers: [], // 缓存供应商
                bill_raw_data: {},
                bill: {
                    bill_no: '',
                    materials: [] // cooked data
                },
                issuemtr_logs: [],
                unplanned_materials: [], // 计划外的物料
                no: '',
                form: {},
                form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编码不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (!this.form.material_id)return callback('未找到此物料编码')
                                }
                            }
                        ]
                    },
                    supplier_no: {
                        rules: [
                            { required: true, errorMessage: '供应商编码不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (!this.form.supplier_id)return callback('未找到此供应商编码')
                                }
                            }
                        ]
                    },
                    batch_no: {
                        rules: [
                            { required: true, errorMessage: '批次号不能为空' }
                        ]
                    },
                    op_qty: {
                        rules: [
                            { required: true, errorMessage: '数量不能为空' },
                            { format: 'number', errorMessage: '数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('数量必须大于0')
                                    if (!this.form.decimal_unit && !Number.isInteger(value)) {
                                        return callback('数量必须为整数')
                                    }
                                }
                            }
                        ]
                    }
                },
                swipe_options: [
                    {
                        text: '删除',
                        style: { backgroundColor: '#dd524d' }
                    }
                ],
                goods_nav: {
                    options: [
                        { icon: 'list', text: '明细' },
                        { icon: 'left', text: '日志' }
                    ],
                    button_group: [
                        { text: '返回', color: '#fff', backgroundColor: store.state.goods_nav_color.grey },
                        { text: '扫码', color: '#fff', backgroundColor: store.state.goods_nav_color.red }
                    ]
                }
            }
        },
        mounted() {
            this._init_form()
        },
        methods: {
            formatDate,
            after_scan_code(text) {
                text = text.trim()
                if (!text) return
                if (this.step == 'bill') {
                    if (text.startsWith('SCFLTZD')) {
                        this.load_scfltzd(text) // 生产发料通知单
                    } else if (text.startsWith('PPBOM')) {
                        this.load_ppbom(text) // 用料清单
                    } else {
                        uni.showToast({ icon: 'none', title: '未知格式单据编号' })
                    }
                } 
                if (this.step == 'material') {
                    let arr = text.split('||') // 扫描物料卡(format: material_no||supplier_no||batch_no)
                    this.form.material_no = arr[0]
                    this.form.supplier_no = arr[1]
                    this.form.batch_no = arr[2]
                    this.material_no_change()
                    this.supplier_no_change()
                    this.form.op_qty_focus = true
                }
            },
            checkbox_click(e) {
                let material = this.bill.materials.find(x => x.material_id == e)
                if (material) material.checked = !material.checked 
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.detail_drawer.open() // btn:明细
                if (e.index === 1) this.$refs.log_drawer.open() // btn: 日志
                // console.log(this.$data)
            },
            goods_nav_button_click(e) { 
                if (e.index === 0) this.if_go_back() // btn:返回
                if (e.index === 1) this.scan_code() // btn:扫码
            },
            icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            if_go_back() {
                uni.showModal({
                    title: "返回",
                    content: "确认返回上一步吗？",
                    success: (res) => {
                        if (res.confirm) {
                            play_audio_prompt('delete')
                            if (this.step == 'bill') {
                                uni.navigateBack()
                            }  else if (this.step == 'material') {
                                this.step = 'bill'
                                this.no = '' // 清空手动输入的数据
                            } 
                        }
                    }
                })
            },
            material_no_change() {
                // 0. 设置默认值
                this.form.material_id = ''
                this.form.material_name = ''
                this.form.base_unit_name = 'Pcs'
                this.form.decimal_unit = false
                if (!this.form.material_no) return
                // 1. 查询单据内物料
                let material = this.bill.materials.find(x => x.material_no == this.form.material_no)
                if (material) {
                    this.form.material_id = material.material_id
                    this.form.material_name = material.material_name
                    this.form.base_unit_name = material.base_unit_name
                    this.form.decimal_unit = is_decimal_unit(material.base_unit_name)
                    return
                }
                // 2. 查询缓存的物料数据
                let bd_material = this.bd_materials.find(x => x.FNumber == this.form.material_no)
                if (bd_material) {
                    this.form.material_id = bd_material.FMaterialId
                    this.form.material_name = bd_material.FName
                    this.form.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.form.decimal_unit = is_decimal_unit(bd_material['FBaseUnitId.FName'])
                    return
                }
                // 3. 查询基础数据
                get_bd_material(this.form.material_no, store.state.cur_stock.FUseOrgId).then(res => {
                    if (res.data.length) {
                        this.bd_materials.push(res.data[0])
                        this.form.material_id = res.data[0].FMaterialId
                        this.form.material_name = res.data[0].FName
                        this.form.base_unit_name = res.data[0]['FBaseUnitId.FName']
                        this.form.decimal_unit = is_decimal_unit(res.data[0]['FBaseUnitId.FName'])
                    }
                })
            },
            supplier_no_change() {
                // 0. 设置默认值
                this.form.supplier_id = ''
                this.form.supplier_name = ''
                if (!this.form.supplier_no) return
                // 1. 查询缓存的供应商数据
                let bd_supplier = this.bd_suppliers.find(x => x.FNumber == this.form.supplier_no)
                if (bd_supplier) {
                    this.form.supplier_id = bd_supplier.FSupplierId
                    this.form.supplier_name = bd_supplier.FName
                    return
                }
                // 2. 查询基础数据
                get_bd_supplier(this.form.supplier_no, store.state.cur_stock.FUseOrgId).then(res => {
                    if (res.data.length) {
                        this.bd_suppliers.push(res.data[0])
                        this.form.supplier_id = res.data[0]['FSupplierId']
                        this.form.supplier_name = res.data[0]['FName']
                    }
                })
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') {
                        this.after_scan_code(res.result)
                    }
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        this.after_scan_code(res.result)
                    }
                })
                // #endif
            },
            search() {
                this.after_scan_code(this.no)
            },
            view_material(material_no) {
                if (!material_no) uni.showToast({ icon: 'none', title: '物料编码不能为空' })
                uni.navigateTo({ url: '/pages/operation/manage/material_search?t=' + material_no })
            },
            // async after_save(save_res) {
            //     if (save_res.data.Result.ResponseStatus.IsSuccess) {
            //         this.load_issuemtr_logs()
            //         let find_res = await IssuemtrLog.find(save_res.data.Result.Id)
            //         if (find_res.data[0]) {
            //             this.issuemtr_logs.unshift(find_res.data[0])
            //             uni.showToast({ title: '提交成功' })  
            //         }
            //     } else {
            //         uni.showToast({ title: '提交失败' })
            //     }
            // },
            async load_issuemtr_logs() {
                let options = {
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.bill.bill_no,
                    FOpType: this.op_type
                }
                let meta = { order: 'FID DESC' }
                uni.showLoading({ title: 'Loading' })
                let res = await IssuemtrLog.query(options, meta)
                uni.hideLoading()
                this.issuemtr_logs = res.data
                this._calc_done_qty()
            },
            async load_ppbom(bill_no) {
                try {
                    uni.showLoading({ title: 'Loading' })
                    let res = await get_prd_ppbom(bill_no)
                    uni.hideLoading()
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        let raw_data = res.data.Result.Result
                        // if (raw_data.PrdOrgId_Id != store.state.cur_stock.FUseOrgId) {
                        //     uni.showToast({ icon: 'none', title: '生产组织不一致' })
                        //     return
                        // }
                        let materials = []
                        for (let entity of raw_data.PPBomEntry) {
                            materials.push({
                                material_id: entity.MaterialID.Id,
                                material_no: entity.MaterialID.Number,
                                material_name: entity.MaterialID.Name[0]?.Value,
                                material_spec: entity.MaterialID.Specification[0]?.Value,
                                base_unit_qty: entity.BaseStdQty,
                                base_unit_name: entity.BaseUnitID.Name[0]?.Value,
                                unit_qty: entity.StdQty,
                                unit_name: entity.UnitID.Name[0].Value,
                                checked: false,
                                op_qty: 0
                            })
                        }
                        this.step = 'material'
                        this.op_type = 'receive'
                        this.bill_raw_data = raw_data
                        this.bill = { 
                            bill_no: raw_data.BillNo, 
                            materials: materials,
                        }
                        this.load_issuemtr_logs()
                    } else {
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                } catch (err) { console.log('load_ppbom err', err) }
            },
            async load_scfltzd(bill_no) {
                try {
                    uni.showLoading({ title: 'Loading' })
                    let res = await get_prd_issuemtrnotice(bill_no)
                    uni.hideLoading()
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        let raw_data = res.data.Result.Result
                        if (raw_data.PrdOrgId_Id != store.state.cur_stock.FUseOrgId) {
                            uni.showToast({ icon: 'none', title: '生产组织不一致' })
                            return
                        }
                        let materials = []
                        for (let entity of raw_data.SUMEntity) {
                            materials.push({
                                material_id: entity.ChildMtr.Id,
                                material_no: entity.ChildMtr.Number,
                                material_name: entity.ChildMtr.Name[0]?.Value,
                                material_spec: entity.ChildMtr.Specification[0]?.Value,
                                base_unit_qty: entity.BasePlanIssueQty,
                                base_unit_name: entity.BaseSumUnitId.Name[0]?.Value,
                                unit_qty: entity.PlanIssueQty,
                                unit_name: entity.SumUnitId.Name[0].Value
                            })
                        }
                        this.step = 'material'
                        this.op_type = 'send'
                        this.bill_raw_data = raw_data
                        this.bill = { 
                            bill_no: raw_data.BillNo, 
                            materials: materials,
                        }
                        this.load_issuemtr_logs()
                    } else {
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                } catch (err) { console.log('load_scfltzd err', err) }
            },
            async submit_delete(log) {
                try {
                    uni.showLoading({ title: 'Loading' })
                    return IssuemtrLog.delete([log.FID]).then(res => {
                        uni.hideLoading()
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            play_audio_prompt('delete')
                            this.$refs.log_swipe.closeAll()
                            this.load_issuemtr_logs()
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    })
                } catch (err) { console.log('err', err) }
            },
            async submit_save() {
                try {
                    console.log('submit form', this.form)
                    await this.$refs.form.validate() // 表单验证
                    // await this.validate_existence_of_logs()
                    // let material = this.bill.materials.find(x => x.material_no == this.form.material_no)
                    // let material_id = ''
                    // if (material) {
                    //     material_id = material.material_id
                    // } else {
                    //     let res = await get_bd_material(this.form.material_no, store.state.cur_stock.FUseOrgId)
                    //     material_id = res.data[0].FMaterialId
                    // }
                    let issuemtr_log = new IssuemtrLog({
                        FOpType: this.op_type,
                        FStockId: store.state.cur_stock.FStockId,
                        FMaterialId: this.form.material_id,
                        FSupplierId: this.form.supplier_id,
                        FOpQTY: this.form.op_qty,
                        FBatchNo: this.form.batch_no,
                        FBillNo: this.bill.bill_no,
                        FOpStaffNo: store.state.cur_staff.FNumber 
                    })
                    await issuemtr_log.save()
                    await this.load_issuemtr_logs()
                    // await this.after_save(save_res)
                    this._init_form() // 重置表单
                    play_audio_prompt('success')
                } catch (err) { console.log('err', err) }
            },
            // async validate_existence_of_logs() {
            //     console.log('>>> 重复性验证')
            //     return IssuemtrLog.query({
            //         'FMaterialId.FNumber': this.form.material_no,
            //         FBatchNo: this.form.batch_no,
            //         FStockId: store.state.cur_stock.FStockId,
            //         FBillNo: this.bill.bill_no
            //     }).then(res => {
            //         if (res.data.length) {
            //             console.log('>>> 重复性验证, 不通过')
            //             uni.showToast({ icon: 'none', title: '重复扫码' })
            //             this._init_form()
            //             play_audio_prompt('success')
            //             throw new Error('重复扫码')
            //         }
            //         console.log('>>> 重复性验证, 通过')
            //     })
            // },
            _calc_done_qty() {
                for (let material of this.bill.materials) {
                    material.done_qty = 0
                }
                this.unplanned_materials = []
                for (let log of this.issuemtr_logs) {
                    let material = this.bill.materials.find(x => x.material_no == log['FMaterialId.FNumber'])
                    if (material) {
                        material.done_qty += log.FOpQTY
                        continue
                    }
                    let unplanned_material = this.unplanned_materials.find(x => x.material_no == log['FMaterialId.FNumber'])
                    if (unplanned_material) {
                        unplanned_material.done_qty += log.FOpQTY
                    } else {
                        this.unplanned_materials.push({
                            material_id: log.FMaterialId,
                            material_no: log['FMaterialId.FNumber'],
                            material_name: log['FMaterialId.FName'],
                            material_spec: log['FMaterialId.FSpecification'],
                            base_unit_qty: 0,
                            base_unit_name: log['FStockUnitId.FName'],
                            unit_qty: 0,
                            unit_name: log['FStockUnitId.FName'],
                            done_qty: log.FOpQTY
                        })
                    }
                }
            },
            _calc_percentage(material) {
                return (material.done_qty / material.base_unit_qty) * 100
            },
            _init_form() {
                this.form = {
                    material_id: '',
                    material_no: '',
                    material_name: '',
                    supplier_no: '',
                    supplier_id: '',
                    supplier_name: '',
                    batch_no: '',
                    op_qty: '',
                    op_qty_focus: false,
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                }
            },
            _unplanned_material(log) {
                return !this.bill.materials.some(x => x.material_id == log.FMaterialId)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .form-btn {
        border-radius: 0;
    }
    .form-info {
        height: 0;
        color: $uni-text-color-grey;
        font-size: $uni-font-size-sm;
    }
</style>
