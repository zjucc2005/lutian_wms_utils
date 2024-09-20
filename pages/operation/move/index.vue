<template>
    <view>
        <uni-list>
            <uni-list-item title="移库下架"
                :show-extra-icon="true" 
                :extra-icon="{ color: '#28a745', size: '24', type: 'arrow-down' }"
                @click="goTo('/pages/operation/move/move_out')" clickable showArrow />
            <uni-list-item title="移库上架"
                :show-extra-icon="true" 
                :extra-icon="{ color: '#dc3545', size: '24', type: 'arrow-up' }"
                @click="goTo('/pages/operation/move/move_in')" clickable showArrow />
        </uni-list>
        
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
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif 
    export default {
        data() {
            return {
                goods_nav: {
                    options: [
                        { icon: 'cart', text: '移库中', info: 8 }
                    ],
                    button_group: [
                        {
                            text: '库存查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        methods: {
            // >>> component
            goods_nav_click(e) {
                if (e.index === 0) {
                    console.log('click e:', e)
                }  
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.search_inv() // btn:库存查询
            },
            // >>> action
            goTo(url) {
                uni.navigateTo({ url: url })
            },
            search_inv() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                    }
                })
                // #endif
            }
        }
    }
</script>

<style>

</style>
