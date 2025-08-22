<template>
    <uni-list class="uni-mb-5">
        <uni-list-item title="关于" style="padding: 12px 0;">
            <template #header>
                <view class="avatar-thumb" @click="avatar_click">{{ $store.state.cur_staff.FName?.slice(-2) }}</view>
            </template>
            <template #body>
                <view>
                    <view class="avatar-name uni-mb-5">{{ $store.state.cur_staff.FName }}</view>
                    <!-- <view class="avatar-number">{{ $store.state.cur_staff['FDeptId.FName'] }}</view> -->
                </view>
            </template>
        </uni-list-item>
    </uni-list>
    
    <uni-list class="uni-mb-5">
        <uni-list-item title="检查更新"
            :show-extra-icon="true"
            :extra-icon="{ type: 'loop', size: '24', color: '#007bff' }"
            rightText="如果无法在线更新，请联系开发者获取最新安装包"
            @click="check_update" clickable
            show-arrow>
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">检查更新
                        <uni-badge v-if="$store.state.latest_version > $store.state.system_info.appVersionCode"
                            size="small" text="NEW" type="error"></uni-badge>
                    </view>
                </view>
            </template>
        </uni-list-item>
        <uni-list-item title="关于"
            :show-extra-icon="true"
            :extra-icon="{ type: 'info', size: '24', color: '#007bff' }"
            @click="about" clickable
            show-arrow />
        <uni-list-item title="设置"
            :show-extra-icon="true"
            :extra-icon="{ type: 'gear', size: '24', color: '#007bff' }"
            @click="link_to('/pages/my/settings')" clickable
            show-arrow />
        <uni-list-item v-if="door.open" title="全局状态"
            :show-extra-icon="true"
            :extra-icon="{ type: 'settings', size: '24', color: '#007bff' }"
            @click="link_to('/pages/api_utils/store/store')" clickable
            show-arrow />
       <uni-list-item title="调试"
            :show-extra-icon="true"
            :extra-icon="{ type: 'settings', size: '24', color: '#007bff' }"
            @click="debug" clickable
            show-arrow />  
    </uni-list>
    <uni-list>
        <uni-list-item title="退出"
            :show-extra-icon="true"
            :extra-icon="{ color: '#dc3545', size: '24', type: 'close' }"
            @click="logout" clickable
            />
    </uni-list>
</template>

<script>
    import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update'
    import store from '@/store'
    import { link_to, get_latest_version } from '@/utils'
    // #ifdef H5
    import { pdf_template_tydzd } from '@/gen_pdf'
    // #endif
    export default {
        data() {
            return {
                door: {
                    count: 0,
                    last_timestamp: 0,
                    duration: 500,
                    threshold: 7,
                    open: false
                }
            }
        },
        onHide() {
            this.door.open = false
        },
        methods: {
            link_to,
            avatar_click(e) {
                let timestamp = Date.now()
                if (this.door.last_timestamp === 0) {
                    this.door.count = 1
                    this.door.last_timestamp = timestamp
                } else {
                    if (this.door.last_timestamp + this.door.duration >= timestamp) {
                        this.door.count += 1
                        this.door.last_timestamp = timestamp
                    } else {
                        this.door.count = 1
                        this.door.last_timestamp = timestamp
                    }
                }
                if (this.door.count >= this.door.threshold) {
                    this.door.open = true
                } 
            },
            async check_update() {
                this.$logger.info('检查更新')
                // #ifdef APP-PLUS
                checkUpdate()
                // #endif
                // #ifdef H5
                get_latest_version(true)
                // #endif
            },
            about() {
                const base_info = uni.getAppBaseInfo()
                uni.showModal({
                    title: '关于',
                    content: [
                        `名称: ${base_info.appName}`,
                        `版本: ${base_info.appVersion}`,
                        '作者: caichang'
                    ].join('\n'),
                    showCancel: false,
                    confirmText: '关闭',
                    success: (res) => {},
                    fail: (err) => {}
                })
            },
            logout() {
                uni.showActionSheet({
                    itemList: ['退出登录'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            this.$logger.info('>>> 退出登录')
                            store.commit('staff_logout')
                            uni.reLaunch({ url: '/pages/login' })
                        }
                    }
                })
            },
            debug() {
                // #ifdef H5
                let url = pdf_template_tydzd()
                uni.navigateTo({ url: `/pages/my/preview_pdf?url=${url}` }) // 打开预览页面
                // #endif
            }
        }
    }
</script>

<style lang="scss" scoped>
    .avatar-thumb {
        width: 64px;
        height: 64px;
        margin-right: 18px;
        background-color: #007bff;
        border-radius: 5px;
        color: #fff;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .avatar-name {
        font-size: 16px;
    }
    .avatar-number {
        font-size: 14px;
        color: $uni-text-color-grey;
    }
</style>
