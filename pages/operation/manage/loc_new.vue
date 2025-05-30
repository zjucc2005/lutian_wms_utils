<template>
    <uni-notice-bar single scrollable text="可以扫码或批量新增库位号，然后一次性点击提交保存" />
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        class="above-uni-goods-nav"
        >
        <uni-swipe-action ref="loc_no_swipe">
            <uni-swipe-action-item
                v-for="(loc_no, index) in loc_nos"
                :key="index"
                :threshold="60"
                :right-options="swipe_action_options"
                @click="swipe_action_click($event, index)"
                >
                <uni-list-item :title="loc_no.value">
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <text class="status disabled">{{ loc_no.status }}</text>
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
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <uni-popup ref="new_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="批量新增"
            @close="close_new_dialog"
            @confirm="confirm_new_dialog"
            :beforeClose="true"
            style="width: 360px;"
            >
            <view class="new-form">
                <uni-data-checkbox
                    v-model="new_form.type" 
                    :localdata="[
                        { text: '标准库位', value: 'standard' },
                        { text: '独立库位', value: 'special' },
                    ]"
                    class="uni-mb-10"
                    >
                </uni-data-checkbox>
                <uni-forms ref="new_form" :model="new_form" :rules="new_form_rules">
                    <uni-forms-item label="仓库编号" name="depot">
                        <uni-easyinput v-model="new_form.depot" trim="both" />
                    </uni-forms-item>
                    <uni-forms-item label="货架编号" name="shelf">
                        <uni-easyinput v-model="new_form.shelf" trim="both" />
                    </uni-forms-item>
                    <template v-if="new_form.type != 'special'">
                        <uni-forms-item label="总行数" name="row">
                            <uni-number-box v-model="new_form.row" :min="1" :max="9" />
                        </uni-forms-item>
                        <uni-forms-item label="总列数" name="column">
                            <uni-number-box v-model="new_form.column" :min="1" :max="99" />
                        </uni-forms-item>
                    </template>
                    <uni-forms-item label="示例">
                        <text class="example">{{ loc_no_example }}</text>
                    </uni-forms-item>
                </uni-forms>
            </view>
            
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { StockLoc } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                loc_nos: [
                ],
                new_form: {
                    type: 'standard', // standard/special
                    depot: '',
                    shelf: '',
                    row: 1,
                    column: 1
                },
                new_form_rules: {
                    depot: {
                        rules: [
                            { required: true, errorMessage: '仓库编号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value.length > 4) {
                                        return callback('仓库编号不能大于4位')
                                    }
                                }
                            }
                        ]
                    },
                    shelf: {
                        rules: [
                            { required: true, errorMessage: '货架编号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value.length > 8) {
                                        return callback('货架编号不能大于8位')
                                    }
                                }
                            }
                        ]
                    }
                },
                swipe_action_options: [
                    {
                        text: '删除',
                        style: {
                            backgroundColor: '#dd524d'
                        }
                    }
                ],
                goods_nav: {
                    options: [
                        { icon: 'trash', text: '清空' }
                    ],
                    button_group: [
                        {
                            text: '扫码新增',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        },
                        {
                            text: '批量新增',
                            backgroundColor: store.state.goods_nav_color.green,
                            color: '#fff'
                        },
                        {
                            text: '提交保存',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            // this.gen_loc_nos('DS', 'A01', 20, 3).forEach(x => {
            //     this.loc_nos.push({ value: x, status: '' })
            // })
            // this.gen_loc_nos('DS', 'A02', 20, 3).forEach(x => {
            //     this.loc_nos.push({ value: x, status: '' })
            // })
        },
        computed: {
            loc_no_example() {
                let obj = {
                    depot: this.new_form.depot || '*',
                    shelf: this.new_form.shelf || '*',
                    column: this.new_form.column || '*',
                    row: this.new_form.row || '*'
                }
                if (this.new_form.type == 'special') {
                    return `${obj.depot.toUpperCase()}-${obj.shelf.toUpperCase()}`
                }
                if (this.new_form.column && this.new_form.column < 10) {
                    obj.column = `0${this.new_form.column}`
                }
                return `${obj.depot.toUpperCase()}-${obj.shelf.toUpperCase()}-101 ~ ${obj.row}${obj.column}`
            }
        },
        methods: {
            swipe_action_click(e, list_index) {
                if (e.index === 0) {
                    this.loc_nos.splice(list_index, 1) // 删除行
                    this.$refs.loc_no_swipe.closeAll() // 复位滑动操作
                }              
            },
            goods_nav_click(e) {
                if (e.index === 0) this.if_clear_loc_nos()                
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code()
                if (e.index === 1) this.open_new_dialog()
                if (e.index === 2) this.if_submit_batch_save()
            },
            if_clear_loc_nos() {
                uni.showActionSheet({
                    itemList: ['清空库位号'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            this.loc_nos = []
                        }
                    }
                })
            },
            close_new_dialog() {
                this.new_form = { type: 'standard', depot: '', shelf: '', column: 1, row: 1 }
                this.$refs.new_dialog.close()
            },
            confirm_new_dialog() {
                this.$refs.new_form.validate().then(_ => {
                    this.gen_loc_nos(this.new_form.type, this.new_form.depot, this.new_form.shelf, this.new_form.column, this.new_form.row).forEach(x => {
                        if (!this.loc_nos.find(loc_no => loc_no.value == x)) {
                            this.loc_nos.push({ value: x, status: '' })
                        }
                    })
                    this.close_new_dialog()
                }).catch(err => {})
            },
            open_new_dialog() {
                this.$refs.new_dialog.open()
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(text) {
                text = text.trim().toUpperCase()
                if (text.length < 4) {
                    uni.showToast({ icon: 'none', title: '长度需大于4位' })
                } else if (this.loc_nos.find(x => x.value === text)) {
                    uni.showToast({ icon: 'none', title: '重复扫码' })
                } else {
                    this.loc_nos.push({ value: text, status: '' })
                }
            },
            if_submit_batch_save() {
                uni.showModal({
                    title: "提交保存注意事项",
                    content: '请仔细核对新增库位号，确认提交后，将会批量提交数据并保存。',
                    success: (res) => {
                        if (res.confirm) this.submit_batch_save()
                    },
                    fail: (err) => {
                    }
                })
            },
            // 提交批量保存，之后自动提交和审核
            async submit_batch_save() {
                try {
                    if (this.loc_nos.length === 0) {
                        uni.showToast({ icon: 'none', title: '没有新增库位' })
                        return
                    }
                    let loc_nos = this.loc_nos.map(x => x.value)
                    uni.showLoading({ title: 'Loading' })
                    let validate_res = await StockLoc.exist_loc_nos(loc_nos)
                    uni.hideLoading()
                    if (validate_res.status === 0) {
                        const stock_locs = this.loc_nos.map(loc_no => {
                            return new StockLoc({
                                FStockId: store.state.cur_stock.FStockId,
                                FNumber: loc_no.value
                            })
                        })
                        uni.showLoading({ title: 'Loading' })
                        await StockLoc.batch_save(stock_locs)
                        await StockLoc.submit(loc_nos)
                        await StockLoc.audit(loc_nos)
                        uni.showToast({ title: '保存成功' })
                        play_audio_prompt('success')
                        this.loc_nos = []
                    } else if (validate_res.status === 1) {
                        uni.showToast({ icon: 'none', title: validate_res.msg })
                        this.loc_nos.forEach(x => {
                            if (validate_res.data.indexOf(x.value) > -1) x.status = '已存在' // 库位号已存在，给出提示
                        })
                    } else if (validate_res.status === -1) {
                        uni.showToast({ icon: 'none', title: validate_res.msg })
                    }
                } catch (err) { }
            },
            gen_loc_nos(type, depot, shelf, col, row) {
                let loc_nos = []
                depot = depot.toUpperCase()
                shelf = shelf.toUpperCase()
                if (type == 'special') {
                    loc_nos.push(`${depot}-${shelf}`)
                    return loc_nos
                }
                if (col < 1 || col > 99) {
                    throw new Error('列数只能在1~99')
                }
                if (row < 1 || row > 9) {
                    throw new Error('行数只能在1~9')
                }
                for (let i = 0; i < row; i++) {
                    for (let j = 0; j < col; j++) {
                        loc_nos.push(`${depot}-${shelf}-${(i + 1) * 100 + j + 1}`)
                    }
                }
                return loc_nos
            }
        }
    }
</script>

<style lang="scss">
    .new-form {
        flex: 1;
        .example {
            line-height: 35px;
            font-weight: bold;
        }
    }
</style>
