<template>
    <view>
        <uni-grid :column="3" :highlight="true" :show-border="false">
            <uni-grid-item @click="goTo('inbound/v2/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/ruku.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">入库</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('outbound/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/chuku.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">出库</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('move/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/kucuntiaozheng.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">库存调整</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="inv_search">
                <view class="grid-item-box">
                    <image src="/static/icon/kucunchaxun.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">库存查询</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('manage/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/qita.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">其他功能</text>
                </view>
            </uni-grid-item>
        </uni-grid>
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
                uni.navigateTo({ url: `/pages/operation/${path}` })
            },
            inv_search() {
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
    .grid-item-box {
        flex: 1;
        /* #ifndef APP-NVUE */
        display: flex;
        /* #endif */
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 15px 0;
    }
    .grid-item-text {
        font-size: 14px;
        color: #666;
        font-weight: bold;
        margin-top: 6px;
        
    }
    .grid-item-icon {
        width: 60px;
    }
</style>