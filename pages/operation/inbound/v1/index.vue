<template>
    <view v-if="!cur_inbound_task.inbound_date">
        <uni-section title="入库设定" type="line">
            <view class="container">
                <uni-forms ref="inbound_task_form" :model="inbound_task_form" :rules="inbound_task_form_rules" labelWidth="80px">
                    <uni-forms-item label="入库日期" name="inbound_date" required>
                        <uni-datetime-picker 
                            v-model="inbound_task_form.inbound_date" 
                            type="date" return-type="string"
                            @change="handle_inbound_date_change"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="批次号" name="batch_no" required>
                        <uni-data-picker 
                            v-model="inbound_task_form.batch_no" 
                            :localdata="batch_no_opts"
                            :popup-title="inbound_task_form.inbound_date ? '请选择' : '请先选择入库日期'"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="单据编号" name="bill_no" required>
                        <uni-easyinput 
                            v-model="inbound_task_form.bill_no"
                            @change="handle_bill_no_change"
                            @clear="handle_bill_no_change"
                            prefixIcon="search"
                            trim="both"
                        />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-section>
        
        <uni-section 
            v-if="inbound_task_form.inbound_list.length" 
            title="入库物料信息" type="line" style="padding-bottom: 60px;"
        >
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in inbound_task_form.inbound_list"
                    :key="index"
                    :rightText="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                    :disabled="obj.dest_stock_id != cur_stock.FStockId"
                >
                    <template v-slot:body>
                        <view class="uni-list-item__content uni-list-item__content--center">
                            <text class="uni-list-item__content-title">{{ obj.material_no }}</text>
                            <view class="uni-list-item__content-note">
                                <view>{{ obj.material_name }}</view> 
                                <view>{{ obj.material_spec }}</view>
                                <view>
                                    <uni-icons type="home" color="#999"></uni-icons>
                                    <text class="src-stock">{{ obj.src_stock_name }}</text>
                                    <uni-icons type="redo" color="#007bff" style="margin: 0 5px;"></uni-icons> 
                                    <uni-icons type="home" color="#007bff" ></uni-icons>
                                    <text class="dest-stock">{{ obj.dest_stock_name }}</text>
                                </view>
                            </view>
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
    </view>
    
    <view v-else>
        <uni-section title="进行中的入库任务" type="line">
            <uni-list>
                <uni-list-item title="入库日期" :rightText="cur_inbound_task.inbound_date" />
                <uni-list-item title="批次号" :rightText="cur_inbound_task.batch_no" />
                <uni-list-item title="单据编号" :rightText="cur_inbound_task.bill_no" />
            </uni-list>
        </uni-section>
        
        <uni-section
            v-if="cur_inbound_task.inbound_list.length" 
            title="入库物料信息" type="line" style="padding-bottom: 60px;"
        >
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in cur_inbound_task.inbound_list"
                    :key="index"
                    :rightText="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                    :disabled="obj.dest_stock_id != cur_stock.FStockId"
                >
                    <template v-slot:body>
                        <view class="uni-list-item__content uni-list-item__content--center">
                            <text class="uni-list-item__content-title">{{ obj.material_no }}</text>
                            <view class="uni-list-item__content-note">
                                <view>{{ obj.material_name }}</view> 
                                <view>{{ obj.material_spec }}</view>
                                <view>
                                    <uni-icons type="home" color="#999"></uni-icons>
                                    <text class="src-stock">{{ obj.src_stock_name }}</text>
                                    <uni-icons type="redo" color="#007bff" style="margin: 0 5px;"></uni-icons> 
                                    <uni-icons type="home" color="#007bff" ></uni-icons>
                                    <text class="dest-stock">{{ obj.dest_stock_name }}</text>
                                </view>
                            </view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options_2" 
                :button-group="goods_nav.button_group_2"
                @click="goods_nav_click_2"
                @button-click="goods_nav_button_click_2"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { get_transfer_direct } from '@/utils/api'
    import { InboundTask } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif  
    export default {
        data() {
            return {
                cur_stock: {},
                cur_inbound_task: {},
                inbound_task_form: {
                    inbound_date: '',
                    batch_no: '',
                    bill_no: '',
                    inbound_list: []
                },
                inbound_task_form_rules: {
                    inbound_date: {
                        rules: [
                            { required: true, errorMessage: '入库日期不能为空' },
                        ]
                    },
                    batch_no: {
                        rules: [
                            { required: true, errorMessage: '批次号不能为空' },
                        ]
                    },
                    bill_no: {
                        rules: [
                            { required: true, errorMessage: '单据编号不能为空' },
                            // {
                            //     validateFunction: (rule, value, data, callback) => {
                            //         if (!this.inbound_task_form.inbound_list.length) {
                            //             return callback('未找到单据信息')
                            //         }
                            //     }
                            // }           
                        ]
                    }
                },
                batch_no_opts: [],
                goods_nav: {
                    options: [
                        { icon: 'search', text: '查询' }
                    ],
                    button_group: [
                        {
                            text: '扫码',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '新建入库任务',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ],
                    options_2: [
                        { icon: 'bars', text: '详情' }
                    ],
                    button_group_2: [
                        {
                            text: '结束入库任务',
                            backgroundColor: 'linear-gradient(90deg, #AAA, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '继续入库任务',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
            this.cur_inbound_task = InboundTask.current() || {} //读取当前入库任务
            if (this.cur_inbound_task.stock_id && this.cur_inbound_task.stock_id != store.state.cur_stock.FStockId) {
                uni.showModal({
                    title: "注意",
                    content: "本机中有其他仓库的入库任务，不能操作，将终止此入库任务",
                    showCancel: false,
                    success: (res) => {
                        if (res.confirm) this.finish_inbound_task()
                    }
                })
            }
        },
        methods: {
            // component
            goods_nav_click(e) {
                if (e.index === 0) {
                    if (this.inbound_task_form.bill_no) {
                        console.log(e.content.text, this.inbound_task_form.bill_no)
                        this.get_inbound_list_by_bill_no() // icon:查询
                    } else {
                        uni.showToast({ icon: 'none', title: '请输入单据编号' })
                    }
                }                                                        
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.create_inbound_task() // btn:新建入库任务
            },           
            goods_nav_click_2(e) {
                if (e.index === 0) uni.navigateTo({ url: '/pages/operation/inbound/v1/task' }) // btn:详情
            },
            goods_nav_button_click_2(e) {
                if (e.index === 0) this.if_finish_inbound_task() // btn:结束入库任务
                if (e.index === 1) this.continue_inbound_task() // btn:继续入库任务
            },
            // action
            handle_inbound_date_change(e) { 
                const batch_no_opts = []
                if (e) {
                    const t = new Date(e) // 可选批次号范围为，入库日期往前3天                    
                    for (var i=0;i<3;i++) {
                        let batch_no = formatDate(t - 24 * 60 * 60 * 1000 * i , 'yyyyMMdd')
                        batch_no_opts.push({ text: batch_no, value: batch_no })
                    }
                }
                this.inbound_task_form.batch_no = batch_no_opts[0]?.value
                this.batch_no_opts = batch_no_opts
            },
            handle_bill_no_change(e) {
                console.log('bill_no_change e', e)
                this.get_inbound_list_by_bill_no()
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    console.log('myScanCode res:', res)
                    if (res.success == 'true') this.handle_scan_code(res.result)
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        console.log("uni.scanCode res:", res)
                        this.handle_scan_code(res.result)
                    }
                });
                // #endif
            },
            handle_scan_code(text) {
                let arr = text.split(/\|{2}|,|;/)
                if (arr.length === 1) {
                    this.inbound_task_form.bill_no = arr[0]
                    this.get_inbound_list_by_bill_no()
                } else {
                    uni.showActionSheet({
                        title: '扫码结果',
                        itemList: arr,
                        success: (e) => {
                            this.inbound_task_form.bill_no = arr[e.tapIndex]
                            this.get_inbound_list_by_bill_no()
                        }
                    })
                }
            },
            get_inbound_list_by_bill_no() {
                const bill_no = this.inbound_task_form.bill_no
                if (!bill_no) {
                    this.inbound_task_form.inbound_list = []
                    return
                }
                if (bill_no.startsWith('ZJDB')) { // 直接调拨单
                    uni.showLoading({ title: 'Loading' })
                    get_transfer_direct(bill_no).then(res => {
                        this.handle_zjdbd_data(res)
                        uni.hideLoading()
                    })
                } else {
                    this.inbound_task_form.inbound_list = []
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
                }
            },
            handle_zjdbd_data(response) {
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    const data = response.data.Result.Result                   
                    let inbound_list = []
                    data.TransferDirectEntry.forEach(obj => {
                        inbound_list.push({
                            material_no: obj.MaterialId.Number,
                            material_name: obj.MaterialId.Name[0]?.Value,
                            material_spec: obj.MaterialId.Specification[0]?.Value,
                            base_unit_qty: obj.BaseQty,
                            base_unit_name: obj.BaseUnitId.Name[0]?.Value,
                            base_unit_no: obj.BaseUnitId.Number,
                            src_stock_id: obj.SrcStockId.Id,
                            src_stock_name: obj.SrcStockId.Name[0]?.Value,
                            dest_stock_id: obj.DestStockId.Id,
                            dest_stock_name: obj.DestStockId.Name[0]?.Value                            
                        })
                    })
                    this.inbound_task_form.inbound_list = inbound_list
                } else {
                    this.inbound_task_form.inbound_list = []
                    uni.showToast({ icon: 'none', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            },
            create_inbound_task() {
                this.$refs.inbound_task_form.validate().then(e => {
                    play_audio_prompt('success')
                    const options = {
                        stock_id: store.state.cur_stock.FStockId,
                        inbound_date: this.inbound_task_form.inbound_date,
                        batch_no: this.inbound_task_form.batch_no,
                        bill_no: this.inbound_task_form.bill_no,
                        inbound_list: this.inbound_task_form.inbound_list
                    }
                    let inbound_task = new InboundTask(options)
                    inbound_task.save()
                    this.cur_inbound_task = inbound_task  // 赋值cur_inbound_task，解决VUE设置空值对象时console报错
                    // console.log('新建入库任务', inbound_task)
                    uni.navigateTo({ url: '/pages/operation/inbound/v1/mount' })
                }).catch(err => console.log('err', err))
            },
            if_finish_inbound_task() {
                uni.showActionSheet({
                    itemList: ['结束入库任务'],
                    success: (e) => {
                        if (e.tapIndex === 0) this.finish_inbound_task()
                    }
                })
            },
            finish_inbound_task() {
                InboundTask.destroy_all()               
                this.cur_inbound_task = {}
                this.inbound_task_form = { inbound_date: '', batch_no: '', bill_no: '', inbound_list: [] }
                console.log('结束入库任务')
            },
            continue_inbound_task() {
                play_audio_prompt('success')
                uni.navigateTo({ url: '/pages/operation/inbound/v1/mount' })
            }
        }
    }
</script>

<style lang="scss">
    .uni-list-item__content {
        /* #ifndef APP-NVUE */
        display: flex;
        /* #endif */
        padding-right: 8px;
        flex: 1;
        color: #3b4144;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
    }
    
    .uni-list-item__content--center {
        justify-content: center;
    }
    
    .uni-list-item__content-title {
        font-size: $uni-font-size-base;
        color: #3b4144;
        overflow: hidden;
    }
    
    .uni-list-item__content-note {
        margin-top: 6rpx;
        color: $uni-text-color-grey;
        font-size: $uni-font-size-sm;
        overflow: hidden;
        .dest-stock {
            color: $uni-color-primary;
            &.disabled {
                color: $uni-color-error;
            }
        }
        .batch_no {
            color: $uni-color-primary;
        }
    }
</style>
