<template>
    <view>
        <uni-list class="mb-1">
            <uni-list-item title="库存查询"
                :show-extra-icon="true"
                :extra-icon="{ color: '#007bff', size: '24', type: 'search' }"
                @click="handle_inv_search" clickable showArrow />
            <uni-list-item title="库位管理"
                :show-extra-icon="true" 
                :extra-icon="{ color: '#28a745', size: '24', type: 'list' }"
                @click="goTo('locs')" clickable showArrow />         
   <!--         <uni-list-item title="选项3"
                :show-extra-icon="true"
                :extra-icon="{ color: '#dc3545', size: '24', type: 'gear' }"
                clickable showArrow /> -->
        </uni-list>
    </view>
</template>

<script>
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        data() {
            return {
                
            }
        },
        methods: {
            goTo(path) {
                uni.navigateTo({ url: `./${path}` })
            },
            handle_inv_search() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    // console.log('myScanCode res:', res)
                    if (res.success == 'true') uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        // console.log("uni.scanCode res:", res)
                        uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                    }
                });
                // #endif
            }
        }
    }
</script>

<style>

</style>
