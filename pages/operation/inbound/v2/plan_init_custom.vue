<template>
    <!-- <uni-notice-bar single scrollable text="手工录入物料信息后，下一步新增计划明细" /> -->
    <uni-section title="1. 查询物料" type="square"
        v-if="inbound_task.status == 'init'"
        >
        <view class="container">
            <uni-forms ref="search_form" :model="search_form" labelWidth="70px">
                <uni-forms-item label="编码" name="material_no">
                    <uni-easyinput
                        v-model="search_form.material_no"
                        trim="both"
                        prefix-icon="scan"
                        @icon-click="searchbar_icon_click"
                    />
                </uni-forms-item>
                <uni-forms-item label="名称" name="material_name">
                    <uni-easyinput v-model="search_form.material_name" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="规格" name="material_spec">
                    <uni-easyinput v-model="search_form.material_spec" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="存货类别" name="material_category_id">
                    <uni-data-select v-model="search_form.material_category_id" :localdata="material_categories" />
                </uni-forms-item>
                <uni-row>
                    <uni-col :span="12">
                        <button @click="scan_code" type="warn" class="form-btn left">
                            <uni-icons type="scan" color="#fff"></uni-icons> 扫码
                        </button>
                    </uni-col>
                    <uni-col :span="12">
                        <button @click="search" type="primary" class="form-btn right">
                            <uni-icons type="checkmarkempty" color="#fff"></uni-icons> 搜索
                        </button>
                    </uni-col>
                </uni-row>
            </uni-forms>
        </view>
    </uni-section>
    
    <uni-section title="2. 提交物料数量" type="square"
        v-if="inbound_task.status == 'init'"
        >
        <!-- <template v-slot:right>
            <view class="uni-section__right">
                <uni-data-checkbox multiple
                    v-model="ex_cond"
                    :localdata="[{ text: '只查询成品', value: '3.' }]"
                    @change="ex_cond_change"
                    style="margin-right: -20px;"
                    >
                </uni-data-checkbox>
            </view>
        </template> -->
        <uni-list v-if="form.material_id">
            <uni-list-item
                :title="form.material_no"
                :note="[
                    `名称：${form.material_name}`, 
                    `规格：${form.material_spec}`
                ].join('\n')"
                :thumb="thumbnail_url(form.material_image)"
                thumb-size="lg"
            />
        </uni-list>
        <uni-list v-else>
            <uni-list-item
                :show-extra-icon="true"
                :extra-icon="{ type: 'info', size: '24', color: '#007bff' }"
                title="请先查询获取物料信息"
            />
        </uni-list>
        <view class="container">
            <uni-forms ref="form" :model="form" :rules="form_rules" labelWidth="70px">
                <uni-forms-item name="material_id" style="height: 0;"></uni-forms-item>
                <!-- <uni-forms-item name="material_id">
                    <uni-easyinput
                        v-model="form.no"
                        trim="both"
                        prefix-icon="scan"
                        @icon-click="form_icon_click('scan')"
                        @confirm="search"
                        @clear="search"
                        :styles="{
                            color: '#000',
                            backgroundColor: 'rgb(238, 238, 238)',
                            borderColor: 'rgb(238, 238, 238)'
                        }"
                    />
                    <view class="form-info">编码：{{ form.material_no || '-' }}</view>
                    <view class="form-info">名称：{{ form.material_name || '-' }}</view>
                    <view class="form-info">规格：{{ form.material_spec || '-' }}</view>
                </uni-forms-item> -->
                
                <uni-forms-item label="物料数量" name="base_unit_qty">
                    <uni-easyinput
                        v-model="form.base_unit_qty"
                        type="number" :focus="form.base_unit_qty_focus"
                        @confirm="add_to_inbound_task"
                        >
                        <template #right>
                            <text class="easyinput-suffix-text">{{ form.base_unit_name }}</text>
                        </template>
                    </uni-easyinput>
                </uni-forms-item>
                <button @click="add_to_inbound_task" type="primary">
                    <uni-icons type="checkmarkempty" color="#fff"></uni-icons> 提交
                </button>
            </uni-forms>
        </view>
    </uni-section>
    
    <uni-section title="当前物料信息" type="square"
        v-if="inbound_task.inbound_list?.length"
        :sub-title="inbound_task.bill_no"
        sub-title-color="#007aff"
        class="above-uni-goods-nav">
        <uni-list>
            <uni-list-item 
                v-for="(obj, index) in inbound_task.inbound_list"
                :key="index"
                @click="if_new_plan(obj.material_no)"
                clickable
                show-arrow
                >
                <template v-slot:body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ obj.material_name }}</view>
                            <view>规格：{{ obj.material_spec }}</view>
                            <view v-if="obj.src_stock_name">调出仓库：{{ obj.src_stock_name }}</view>
                            <view>调入仓库：<text class="text-primary">{{ obj.dest_stock_name }}</text></view>
                            <view>批次：{{ obj.batch_no }}</view>
                        </view>
                    </view>
                </template>
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <text>{{ obj.base_unit_qty }} {{ obj.base_unit_name }}</text>
                        <progress
                            :percent="_calc_percentage(obj)" 
                            stroke-width="2"
                            :active-color="_calc_percentage(obj) == 100 ? '#4cd964' : '#f0ad4e'"
                        />
                    </view>
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
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <cover-image
        v-if="is_completed"
        src="/static/icon/yiwancheng_stamp.png"
        class="cover-image">
    </cover-image>
    
    <!-- 搜索候选列表 -->
    <uni-drawer ref="search_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
        <uni-section :title="`模糊匹配：${form.material_no}`" type="square"
            sub-title="最多展示20条匹配结果"
            >
            <template v-slot:right>
                <view class="uni-section__right">
                    <uni-icons type="closeempty" size="24" color="#333" @click="$refs.search_drawer.close()"/>
                </view>
            </template>
            <uni-list>
                <uni-list-item
                    v-for="(material, index) in search_form.candidates"
                    :key="index"
                    :title="material.FNumber"
                    :note="[
                        `名称：${material.FName}`, 
                        `规格：${material.FSpecification}`
                    ].join('\n')"
                    :thumb="thumbnail_url(material.FImageFileServer)"
                    thumb-size="lg"
                    @click="select_material(material)" clickable
                    show-arrow
                    >
                </uni-list-item>
            </uni-list>
        </uni-section>
        </scroll-view>
    </uni-drawer>
    
    <!-- 扫描明细列表 -->
    <uni-drawer ref="detail_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section title="操作明细" type="square"
                :sub-title="inbound_task.status == 'init' && $store.state.device_type == 'app-plus' ? '左滑可删除' : ''"
                >
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.detail_drawer.close()"/>
                    </view>
                </template>
                <uni-swipe-action ref="swipe_action">
                    <uni-swipe-action-item
                        v-for="(obj, index) in inbound_task.inbound_list"
                        :key="index"
                        :threshold="60"
                        :right-options="inbound_task.status == 'init' ? swipe_options : []"
                        @click="swipe_action_click($event, obj._id)"
                        >
                        <uni-list-item>
                            <template v-slot:body>
                                <view class="uni-list-item__body">
                                    <text class="title">{{ obj.material_no }}</text>
                                    <view class="note">
                                        <view>名称：{{ obj.material_name }}</view>
                                        <view>规格：{{ obj.material_spec }}</view>
                                        <view>提交时间：{{ formatDate(obj.created_at, 'yyyy-MM-dd hh:mm:ss') }}</view>
                                    </view>
                                </view>
                            </template>
                            <template v-slot:footer>
                                <view class="uni-list-item__foot flex-row">
                                    <view>{{ obj.base_unit_qty }} {{ obj.base_unit_name }}</view>
                                    <view v-if="$store.state.device_type == 'h5'">
                                        <uni-icons type="trash" size="24" color="#dd524d" @click="delete_inbound_list(obj._id)" class="uni-ml-5" />
                                    </view>
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
    import K3CloudApi from '@/utils/k3cloudapi'
    import { search_bd_materials } from '@/utils/api'
    import { InboundTask, BdMaterial, InvPlan } from '@/utils/model'
    import { is_decimal_unit, play_audio_prompt } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                bd_materials: [],
                ex_cond: uni.getStorageSync('mv_ex_cond') || [], // get
                inbound_task: {},
                inv_plans: [],
                material_categories: [],
                is_completed: false,
                search_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    material_category_id: '',
                    candidates: []
                },
                form: {
                    material_id: '',
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    material_image: '',
                    base_unit_qty: '',
                    base_unit_qty_focus: false,
                    base_unit_name: 'Pcs',
                    decimal_unit: false,
                },
                form_rules: {
                    material_id: {
                        rules: [
                            { required: true, errorMessage: '请先查询获取物料信息' }
                        ]
                    },
                    // material_no: {
                    //     rules: [
                    //         { required: true, errorMessage: '物料编码不能为空' }
                    //     ]
                    // },
                    base_unit_qty: {
                        rules: [
                            { required: true, errorMessage: '物料数量不能为空' },
                            { format: 'number', errorMessage: '物料数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('物料数量必须大于0')
                                    if (!this.form.decimal_unit && !Number.isInteger(value)) {
                                        return callback('物料数量必须为整数')
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
                        { icon: 'list', text: '明细', info: '' }
                    ],
                    button_group: [
                        {
                            text: '结束编辑入库计划',
                            backgroundColor: store.state.goods_nav_color.grey,
                            color: '#fff'
                        },
                        {
                            text: '新增计划明细',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.inbound_task = InboundTask.current() ||
            new InboundTask({ 
                category: 'custom', 
                stock_id: store.state.cur_stock.FStockId, 
                stock_name: store.state.cur_stock.FName,
                staff_no: store.state.cur_staff.FNumber,
                bill_no: 'IC' + formatDate(Date.now(), 'yyyyMMddhhmmss')
            })
            if (this.inbound_task.status == 'ongoing') {
                this.load_inv_plans()
            }
        },
        mounted() {
            this.load_bd_materialcategories()  
        },
        methods: {
            formatDate,
            add_to_inbound_task() {
                this.$refs.form.validate().then(res => {
                    if (this.inbound_task.inbound_list.some(x => x.material_id == this.form.material_id)) {
                        uni.showToast({ icon: 'none', title: '重复提交' })
                        return
                    }
                    let inbound_task = new InboundTask(this.inbound_task)
                    this.inbound_task = inbound_task.add_inbound_list({
                        material_id: this.form.material_id,
                        material_no: this.form.material_no,
                        material_name: this.form.material_name,
                        material_spec: this.form.material_spec,
                        base_unit_qty: Number(this.form.base_unit_qty),
                        base_unit_name: this.form.base_unit_name,
                        created_at: Date.now()
                    })
                    this._init_form()
                    play_audio_prompt('success')
                    uni.showToast({ icon: 'none', title: '提交成功' })
                }).catch(err => {})
            },
            delete_inbound_list(id) {
                let inbound_task = new InboundTask(this.inbound_task)
                this.inbound_task = inbound_task.del_inbound_list(id)
                play_audio_prompt('delete')
            },
            // ex_cond_change(e) {
            //     uni.setStorageSync('mv_ex_cond', e.detail.value) // set
            // },
            // form_icon_click(name) {
            //     if (name == 'scan') this.scan_code()
            // },
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.$refs.detail_drawer.open()
                    this.$logger.info('this.$data', this.$data)
                }
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.if_finish_inbound_task() //btn:结束入库任务
                if (e.index === 1) this.if_new_plan() // btn:新增计划明细
            },
            if_finish_inbound_task() {
                uni.showModal({
                    title: "结束编辑入库计划",
                    content: "结束编辑后，将会清除当前缓存的计划初始化信息，并且无法恢复。请在完成相关计划明细并确认无误后，再确认结束。",
                    success: (res) => {
                        if (res.confirm) {
                            play_audio_prompt('delete')
                            InboundTask.destroy_all()
                            uni.navigateBack()
                        }
                    }
                })
            },
            if_new_plan(material_no) {
                if (this.inbound_task.inbound_list.length === 0) {
                    uni.showToast({ icon: 'none', title: '未添加物料信息' })
                    return
                }
                if (this.inbound_task.status == 'init') {
                    uni.showModal({
                        title: "新增计划明细",
                        content: "开始新增计划明细后，将不能继续录入物料信息。请确认已录完物料信息后，再新增计划明细。",
                        success: (res) => {
                            if (res.confirm) {
                                this.new_plan(material_no)
                            }
                        }
                    })
                } else {
                    this.new_plan(material_no)
                }
            },
            new_plan(material_no) {
                if (this.is_completed) {
                    uni.showToast({ icon: 'none', title: '该计划已完成' })
                    return
                }
                uni.navigateTo({
                    url: '/pages/operation/inbound/v2/plan_new_pallet',
                    success: (res) => {
                        play_audio_prompt('success')
                        let inbound_task = new InboundTask(this.inbound_task)
                        this.inbound_task = inbound_task.update({ status: 'ongoing' })
                        res.eventChannel.emit('sendInboundTask', { material_no: material_no })
                    }
                })
            },
            scan_code() {
                scan_code().then(res => {
                    if (res.result.includes('||')) {
                        let arr = res.result.split('||')
                        this.search_form.material_no = arr[1]
                    } else {
                        this.search_form.material_no = res.result
                    }
                    this.search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            searchbar_icon_click() {
                this.scan_code()
            },
            select_material(bd_material) {
                this._set_form(bd_material)
                this.$refs.search_drawer.close()
            },
            swipe_action_click(e, id) {
                if (e.index === 0 && e.position == 'right') {
                    this.delete_inbound_list(id)
                    this.$refs.swipe_action.closeAll()
                } 
            },
            async load_inv_plans() {
                return InvPlan.query({
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.inbound_task.bill_no,
                    FOpType: 'in',
                }, {}).then(res => { 
                    this.inv_plans = res.data
                    this._calc_progress(res.data) // 判定计划比率和是否已完成
                })
            },
            async load_bd_materialcategories() {
                if (!store.state.bd_materialcategories?.length) {
                    uni.showLoading({ title: 'Loading' })
                    await BdMaterial.categories().then(res => {
                        uni.hideLoading()
                        store.commit('set_bd_materialcategories', res.data)
                    })
                }
                this.material_categories = store.state.bd_materialcategories.map(x => { return { value: x.FMasterId, text: x.FName } })
            },
            // 物料模糊匹配
            async search() {
                this._set_material()
                this.invs = []
                this.inv_plans = []
                if (!this.search_form.material_no && !this.search_form.material_name && !this.search_form.material_spec) return
                let options = {}
                if (store.state.cur_stock.FUseOrgId) options.FUseOrgId = store.state.cur_stock.FUseOrgId
                if (this.search_form.material_no) options.FNumber_lk = this.search_form.material_no
                if (this.search_form.material_name) options.FName_lk = this.search_form.material_name
                if (this.search_form.material_spec) options.FSpecification_lk = this.search_form.material_spec
                if (this.search_form.material_category_id) options.FCategoryId = this.search_form.material_category_id
                let meta = { per_page: 50, order: 'FNumber ASC' }
                uni.showLoading({ title: 'Loading' })
                BdMaterial.query(options, meta).then(res => {
                    uni.hideLoading()
                    this.search_form.candidates = res.data
                    if (res.data.length > 1) this.$refs.search_drawer.open()
                    if (res.data.length === 1) this._set_form(res.data[0])
                    if (res.data.length < 1) uni.showToast({ icon: 'none', title: '无匹配结果' })
                })
            },
            // 物料模糊匹配
            // async search() {
            //     this._init_form()
            //     this.form.no = this.form.no.trim()
            //     if (!this.form.no) return
            //     let options = { 
            //         no: this.form.no, 
            //         FUseOrgId: store.state.cur_stock.FUseOrgId,
            //     }
            //     if (this.ex_cond.includes('3.')) options.FNumber_pre = '3.'
            //     let meta = { per_page: 20, order: 'FMaterialId DESC' }
            //     uni.showLoading({ title: 'Loading' })
            //     search_bd_materials(options, meta).then(res => {
            //         uni.hideLoading()
            //         this.bd_materials = res.data
            //         if (res.data.length > 1) this.$refs.search_drawer.open()
            //         if (res.data.length === 1) this._set_form(res.data[0])
            //         if (res.data.length < 1) uni.showToast({ icon: 'none', title: '无匹配结果' })
            //     })
            // },
            _calc_percentage(obj) {
                let planned_qty = 0
                this.inv_plans.forEach(inv_plan => {
                    if (inv_plan.FMaterialId == obj.material_id) {
                        planned_qty += inv_plan.FOpQTY
                    }
                })
                return (planned_qty / obj.base_unit_qty) * 100
            },
            _calc_progress(inv_plans=[]) {
                if (this.inbound_task.inbound_list.length == 0) {
                    this.goods_nav.options[0].info = ''
                    this.is_completed = false
                    return
                }
                let inbound_qty = this.inbound_task.inbound_list.map(x => x.base_unit_qty).concat([0]).reduce((x,y) => x + y)
                let plan_qty = 0
                let complete_qty = 0
                inv_plans.forEach(x => {
                    plan_qty += x.FOpQTY
                    if (x.FDocumentStatu == 'C') complete_qty += x.FOpQTY
                })
                let plan_percentage = Math.floor(plan_qty / inbound_qty * 100)
                this.goods_nav.options[0].info = `${plan_percentage}%`
                this.is_completed = inbound_qty == complete_qty
            },
            _init_form() {
                this.form.material_id = ''
                this.form.material_no = ''
                this.form.material_name = ''
                this.form.material_spec = ''
                this.form.material_image = ''
                this.form.base_unit_qty = ''
                this.form.base_unit_qty_focus = false
                this.form.base_unit_name = 'Pcs'
                this.form.decimal_unit = false
                
                this.search_form.material_no = ''
                this.search_form.material_name = ''
                this.search_form.material_spec = ''
            },
            _set_form(bd_material) {
                if (bd_material) {
                    this.form.material_id = bd_material.FMaterialId
                    this.form.material_no = bd_material.FNumber
                    this.form.material_name = bd_material.FName
                    this.form.material_spec = bd_material.FSpecification
                    this.form.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.form.decimal_unit = is_decimal_unit(bd_material['FBaseUnitId.FName'])
                    this.form.base_unit_qty_focus = true
                } else {
                    this._init_form()
                }
            },
            _set_material(bd_material) {
                if (bd_material) {
                    this.form.material_id = bd_material.FMaterialId
                    this.form.material_no = bd_material.FNumber
                    this.form.material_name = bd_material.FName
                    this.form.material_spec = bd_material.FSpecification
                    this.form.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.form.material_image = bd_material.FImageFileServer
                } else {
                    this.form.material_id = ''
                    this.form.material_no = ''
                    this.form.material_name = ''
                    this.form.material_spec = ''
                    this.form.base_unit_name = 'Pcs'
                    this.form.material_image = ''
                }
            },
            thumbnail_url(file_id) {
                return K3CloudApi.thumbnail_url(file_id)
            }
        }
    }
</script>

<style lang="scss">
    .form-info {
        font-size: $uni-font-size-sm;
        color: $uni-text-color-grey;
    }
    .form-btn {
        &.left {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
        &.right {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }
    }
    .cover-image {
        position: absolute;
        top: 80px;
        right: 50px;
        width: 128px;
        height: 128px;
    }
    .uni-list-item__foot.flex-row {
        flex-direction: row;
        align-items: center;
    }
</style>
