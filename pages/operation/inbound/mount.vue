<template>
    <view>
        <view class="container">
            <uni-forms ref="mount_form" :model="mount_form" :rules="mount_form_rules" labelWidth="80px">
                <uni-forms-item label="物料编号" name="material_no">
                    <uni-easyinput v-model="mount_form.material_no" />
                </uni-forms-item>
                <uni-forms-item label="仓位号" name="loc_no">
                    <uni-easyinput v-model="mount_form.loc_no" />
                </uni-forms-item>
                <uni-forms-item label="上架数量" name="qty">
                    <uni-easyinput v-model="mount_form.qty" />
                </uni-forms-item>
            </uni-forms>
        </view>
        <uni-section title="最近操作日志" type="line" style="padding-bottom: 60px;">
            <template v-slot:right>
                切换时间
            	<switch checked @change="" style="transform:scale(0.7)"/>
            </template>
            <uni-swipe-action>
                <uni-swipe-action-item
                    v-for="index in 5"
                    :key="index"
                    :threshold="60"
                    :right-options="log_options"
                    @click="swipe_action_click($event, index)"
                >
                    <uni-list-item title="{物料号} 上架 {数量} 到 { 仓位号}" rightText="2024-08-20" />
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
    export default {
        data() {
            return {
                mount_form: {
                    material_no: '',
                    loc_no: '',
                    qty: ''
                },
                mount_form_rules: {
                    material_no: {
                        rules: [{
                            required: true,
                            errorMessage: '物料编号不能为空'
                        }]
                    },
                    loc_no: {
                        rules: [{
                            required: true,
                            errorMessage: '仓位号不能为空'
                        }]
                    },
                    qty: {
                        rules: [{
                            required: true,
                            errorMessage: '上架数量不能为空'
                        }]
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
        methods: {
            swipe_action_click(e, index) {
               console.log('swipe action click e:', e, index) 
            },
            goods_nav_click(e) {
                if (e.index === 0) {
                    // 更多
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
                                console.log(e.content)
                            }
                        }
                    })
                }                         
            },
            goods_nav_buttonClick(e) {
                console.log('goods_nav_buttonClick e:', e)
                // if (e.index === 0) {
                //     if (this.inbound_task_form.f_bill_no) {
                //         console.log(e.content.text, this.inbound_task_form.f_bill_no)
                //         // code here
                //     } else {
                //         uni.showToast({
                //             icon: 'error',
                //             title: '未找到单据编号'
                //         })
                //     }
                // }
                // if (e.index === 1) {
                //     console.log(e.content.text, this.inbound_task_form)
                //     this.$refs['inbound_task_form'].validate().then(e => {
                //         // create inbound task
                //         this.create_inbound_task()  // 生成入库任务
                //         // goto next page
                //         uni.navigateTo({
                //             url: '/pages/operation/inbound/mount'
                //         })
                //     }).catch(err => {
                //         console.log('err', err);
                //     })
                // }
            }
        }
    }
</script>

<style>

</style>
