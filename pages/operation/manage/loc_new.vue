<template>
    <view>
        <uni-notice-bar single show-icon scrollable text="可以多次扫码添加库位号，然后一次性点击提交保存" />
        <uni-section 
            title="新增库位"
            :sub-title="`${cur_stock['FGroup.FName']}/${cur_stock.FName}`"
            type="line" 
            style="padding-bottom: 60px;"
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
                        	<text class="uni-list-item-right-text">{{ loc_no.status }}</text>
                        </template>
                    </uni-list-item>
                </uni-swipe-action-item>
            </uni-swipe-action>
            <!-- <view class="container">
                <uni-forms ref="loc_form" :model="loc_form" labelWidth="80px">
                    <uni-forms-item 
                        v-for="(item, index) in loc_form.loc_nos"
                        :key="item.id"
                        :label="`库位号 ${index + 1}`"
                    >
                        <view class="form-item">
                            <uni-easyinput v-model="loc_form.loc_nos[index].value" placeholder="请输入库位号" />
                        </view>
                    </uni-forms-item>
                </uni-forms>
            </view>  -->
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { post_c_stock_locs, exist_c_stock_locs } from '@/utils/api/c_stock_loc'
    export default {
        data() {
            return {
                cur_stock: {},
                loc_nos: [
                    { value: 'T-B01-101', status: '' }
                ],
                loc_form: {
                    loc_nos: [
                        {
                            value: '',
                            rules: [{
                                'required': true,
                                errorMessage: '库位号必填'
                            }]
                        }
                    ]
                },
                swipe_action_options: [
                    {
                        text: '移除',
                        style: {
                            backgroundColor: '#f56c6c'
                        }
                    }
                ],
                goods_nav: {
                    options: [
                        { icon: 'scan', text: '扫码' }
                    ],
                    button_group: [
                        {
                            text: '提交保存',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
        },
        methods: {
            swipe_action_click(e, list_index) {
                console.log('swipe action click e:', e, list_index) 
                if (e.index === 0) {
                    this.loc_nos.splice(list_index, 1) // 删除行
                    this.$refs.loc_no_swipe.closeAll() // 复位滑动操作
                }              
            },
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.handle_scan_code()
                } else if (e.index === 1) {
                    this.form_add()
                } else if (e.index === 2) {
                    this.form_del()
                }                     
            },
            goods_nav_button_click(e) {
                console.log('goods_nav_button_click e:', e)
                if (e.index === 0) {
                    if (this.loc_nos.length === 0) {
                        uni.showToast({
                            icon: 'error',
                            title: '没有新增库位'
                        })
                        return
                    }
                    let loc_nos = this.loc_nos.map(x => x.value)
                    exist_c_stock_locs(loc_nos).then(res => {
                        console.log('exist res', res)
                        if (res.status === 0) {                            
                            const model = this.loc_nos.map(loc_no => {
                                return {
                                    FName: loc_no.value,
                                    FNumber: loc_no.value,
                                    FStockId: {
                                        FStockId: this.cur_stock.FStockId
                                    }  
                                }
                            })
                            post_c_stock_locs(model).then(res => {
                                uni.showToast({
                                    title: '保存成功'
                                })
                                this.loc_nos = []
                            })
                        } else if (res.status === 1) {                            
                            uni.showToast({
                                icon: 'error',
                                title: res.msg
                            })
                            this.loc_nos.forEach(x => {
                                if (res.data.indexOf(x.value) > -1) {
                                    x.status = '已存在' // 库位号已存在，给出提示
                                }
                            })
                        } else if (res.status === -1) {
                            uni.showToast({
                                icon: 'error',
                                title: res.msg
                            })
                        }
                    })                  
                }
            },
            handle_scan_code() {
                let _this_ = this;
                uni.scanCode({
                    success: function (res) {
                        // console.log("uni.scanCode res:", res)                       
                        let text = res.result.trim() // 字符串trim，字符数大于4
                        if (text.length < 4) {
                            uni.showToast({
                                icon: 'error',
                                title: '长度需大于4位'
                            })
                        } else if (_this_.loc_nos.indexOf(text) > -1) {
                            uni.showToast({
                                icon: 'error',
                                title: '重复扫码'
                            })
                        } else {
                            _this_.loc_nos.push({ value: text, status: '' })
                        }
                    }
                });  
            },
            // form_add() {
            //     this.loc_form.loc_nos.push({
            //     	value: '',
            //     	rules: [{
            //     	    'required': true,
            //     	    errorMessage: '库位号必填'
            //     	}],
            //     	id: Date.now()
            //     })
            // },
            // form_del() {
            //     if (this.loc_form.loc_nos.length > 1) {
            //         this.loc_form.loc_nos.pop()
            //     }    
            // }
        }
    }
</script>

<style>
    .uni-list-item-right-text {
        color: #dd524d;
        font-size: 12px;
        display: flex;
        align-items: center;
    }
</style>
