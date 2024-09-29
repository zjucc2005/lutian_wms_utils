<template>
    <view v-if="$store.state.role == 'admin'">
        <uni-section title="进行中的出库计划" type="square" class="above-uni-goods-nav">
            
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.admin_button_group"
                @click="goods_nav_click"
                @button-click="goods_nav_admin_button_click"
            />
        </view>
    </view>
    
    <view v-if="$store.state.role == 'staff'">
        
    </view>
</template>

<script>
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    export default {
        data() {
            return {
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' }
                    ],
                    admin_button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '新增出库计划',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ],
                    staff_button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        methods: {
            // >>> binding
            goods_nav_click(e) {
                if (e.index === 0) {
                    // this.refresh() // btn:刷新
                    console.log('this', this)
                }
            },
            goods_nav_admin_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) {
                    play_audio_prompt('success')
                    uni.navigateTo({ url: '/pages/operation/outbound/v2/plan_new' }) // btn:新建出库计划
                }
            },
            goods_nav_staff_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
            },
            scan_code() {
                
            }
        }
    }
</script>

<style>

</style>
