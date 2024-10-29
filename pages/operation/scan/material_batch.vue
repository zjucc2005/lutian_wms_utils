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
                <uni-forms-item label="物料编号" name="material_no">
                    <uni-easyinput 
                        v-model="form.material_no"
                        trim="both"
                        prefix-icon="scan"
                        @icon-click="icon_click"
                    />
                </uni-forms-item>
                <uni-forms-item label="批次号" name="batch_no">
                    <uni-easyinput v-model="form.batch_no" trim="both" />
                </uni-forms-item>
            </uni-forms>
        </view> 
        <button @click="submit_save" type="primary" class="form-btn">
            <uni-icons type="checkmarkempty" color="#fff"></uni-icons> 提交
        </button>
    </uni-section>
    
    <uni-section :title="`${{ send: '发料', receive: '用料' }[op_type]}日志`" type="square"
        sub-title="左滑可删除"
        v-if="step == 'material'"
        >
        <uni-swipe-action ref="log_swipe">
            <uni-swipe-action-item
                v-for="(log, index) in issuemtr_logs"
                :key="index"
                :threshold="60"
                :right-options="swipe_options"
                @click="submit_delete(log)"
                >
                <uni-list-item>
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <view class="title">
                                <uni-tag v-if="_unplanned_material(log)" text="计划外" type="warning" size="mini" />
                                {{ log['FMaterialId.FNumber'] }}
                            </view>
                            <view class="note">
                                <view>名称：{{ log['FMaterialId.FName'] }}</view>
                                <view>规格：{{ log['FMaterialId.FSpecification'] }}</view>
                                <view>批次：<text class="text-primary">{{ log.FBatchNo }}</text></view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <text>{{ formatDate(log.FCreateTime, 'yyyy-MM-dd\nhh:mm:ss') }}</text>
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
    
    <!-- 扫描明细列表 -->
    <uni-drawer ref="detail_drawer" :width="320">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="单据明细" type="square"
                :sub-title="bill.bill_no"
                sub-title-color="#007aff"
                >
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.detail_drawer.close()"/>
                    </view>
                </template>
                
                <uni-list>
                    <uni-list-item
                        v-for="(material, index) in bill.materials"
                        :key="index"
                        >
                        <template v-slot:body>
                            <view class="uni-list-item__body">
                                <text class="title">{{ material.material_no }}</text>
                                <view class="note">
                                    <view>名称：{{ material.material_name }}</view>
                                    <view>规格：{{ material.material_spec }}</view>
                                </view>
                            </view>
                        </template>
                        <template v-slot:footer>
                            <view class="uni-list-item__foot">
                                <text>{{ material.unit_qty }} {{ material.unit_name }}</text>
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
    import { IssuemtrLog } from '@/utils/model'
    import { get_bd_material, get_prd_issuemtrnotice, get_prd_ppbom } from '@/utils/api'
    import { play_audio_prompt } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif 
    export default {
        data() {
            return {
                step: 'bill',  // bill: '扫描单据', material: '扫描物料' 
                op_type: 'send',  // send: '发料', receive: '用料'
                bill_raw_data: {},
                bill: {
                    bill_no: '',
                    materials: [] // cooked data
                },
                issuemtr_logs: [],
                no: '',
                form: {
                    material_no: '',
                    batch_no: ''
                },
                form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编号不能为空'},
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (this.form.material_no && this.form.batch_no) {
                                        
                                    }
                                }
                            }
                        ]
                    },
                    batch_no: {
                        rules: [
                            { required: true, errorMessage: '批次号不能为空' },
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
                        { icon: 'bars', text: '明细' }
                    ],
                    button_group: [
                        { text: '返回', color: '#fff', backgroundColor: store.state.goods_nav_color.grey },
                        { text: '扫码', color: '#fff', backgroundColor: store.state.goods_nav_color.red }
                    ]
                }
            }
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
                    let arr = text.split('||') // 扫描物料卡(format: material_no||batch_no)
                    this.form.material_no = arr[0]
                    this.form.batch_no = arr[1]
                    this.$nextTick(_ => {
                        this.submit_save()
                    })
                }
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.detail_drawer.open() // btn:明细
                console.log(this.$data)
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
                            } 
                        }
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
            async after_save(save_res) {
                if (save_res.data.Result.ResponseStatus.IsSuccess) {
                    let find_res = await IssuemtrLog.find(save_res.data.Result.Id)
                    if (find_res.data[0]) {
                        this.issuemtr_logs.unshift(find_res.data[0])
                        uni.showToast({ title: '提交成功' })  
                    }
                } else {
                    uni.showToast({ title: '提交失败' })
                }
            },
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
                                unit_name: entity.UnitID.Name[0].Value
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
                    await this.validate_existence_of_logs()
                    let material = this.bill.materials.find(x => x.material_no == this.form.material_no)
                    let material_id = ''
                    if (material) {
                        material_id = material.material_id
                    } else {
                        let res = await get_bd_material(this.form.material_no, store.state.cur_stock.FUseOrgId)
                        material_id = res.data[0].FMaterialId
                    }
                    let issuemtr_log = new IssuemtrLog({
                        FOpType: this.op_type,
                        FStockId: store.state.cur_stock.FStockId,
                        FMaterialId: material_id,
                        FBatchNo: this.form.batch_no,
                        FBillNo: this.bill.bill_no,
                        FOpStaffNo: store.state.cur_staff.FNumber
                    })
                    let save_res = await issuemtr_log.save()
                    await this.after_save(save_res)
                    this._init_form() // 重置表单
                    play_audio_prompt('success')
                } catch (err) { console.log('err', err) }
            },
            async validate_existence_of_logs() {
                console.log('>>> 重复性验证')
                return IssuemtrLog.query({
                    'FMaterialId.FNumber': this.form.material_no,
                    FBatchNo: this.form.batch_no,
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.bill.bill_no
                }).then(res => {
                    if (res.data.length) {
                        console.log('>>> 重复性验证, 不通过')
                        uni.showToast({ icon: 'none', title: '重复扫码' })
                        this._init_form()
                        play_audio_prompt('success')
                        throw new Error('重复扫码')
                    }
                    console.log('>>> 重复性验证, 通过')
                })
            },
            _init_form() {
                this.form = { material_no: '', batch_no: '' }
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
</style>
