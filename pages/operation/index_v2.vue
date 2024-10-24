<template>
    <uni-notice-bar v-if="$store.state.env != 'prod'" text="测试版" single show-icon/>
    <uni-grid :column="3" :highlight="true" :show-border="false">
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('inbound/v2/index')">
            <view class="grid-item-box">
                <image src="/static/icon/ruku.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">入库</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('outbound/v2/index')">
            <view class="grid-item-box">
                <image src="/static/icon/chuku.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">出库</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('move/v2/index')">
            <view class="grid-item-box">
                <image src="/static/icon/kucuntiaozheng.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">库存调整</text>
            </view>
        </uni-grid-item>
        <uni-grid-item @click="inv_search">
            <view class="grid-item-box">
                <image src="/static/icon/saomiao.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">库存查询</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('manage/invs')">
            <view class="grid-item-box">
                <image src="/static/icon/kucun.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">库存总览</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_staff'" @click="goTo('manage/locs')">
            <view class="grid-item-box">
                <image src="/static/icon/kuweibaojing.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">库位报警</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('manage/locs')">
            <view class="grid-item-box">
                <image src="/static/icon/kuwei.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">库位管理</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('list/index')">
            <view class="grid-item-box">
                <image src="/static/icon/liebiao.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">列表</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('statistics/index')">
            <view class="grid-item-box">
                <image src="/static/icon/tongji.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">统计</text>
            </view>
        </uni-grid-item>
        <uni-grid-item v-if="$store.state.role == 'wh_admin'" @click="goTo('manage/index')">
            <view class="grid-item-box">
                <image src="/static/icon/qita.png" mode="widthFix" class="grid-item-icon"></image>
                <text class="grid-item-text">其他功能</text>
            </view>
        </uni-grid-item>
    </uni-grid>
</template>

<script>
    import { play_audio_prompt } from '@/utils'
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
                play_audio_prompt('success')
                uni.navigateTo({ url: `/pages/operation/${path}` })
            },
            inv_search() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') {
                        console.log('scan res', res)
                        uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                    }
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