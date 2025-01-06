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
            @click="check_update" clickable
            show-arrow />
        <uni-list-item title="关于"
            :show-extra-icon="true"
            :extra-icon="{ type: 'info', size: '24', color: '#007bff' }"
            @click="about" clickable
            show-arrow />
        <uni-list-item v-if="door.open" title="K3Cloud"
            :show-extra-icon="true"
            :extra-icon="{ type: 'pyq', size: '24', color: '#007bff' }"
            @click="link_to('/pages/k3cloud/index')" clickable
            show-arrow />
        <uni-list-item v-if="door.open" title="全局状态"
            :show-extra-icon="true"
            :extra-icon="{ type: 'settings', size: '24', color: '#007bff' }"
            @click="link_to('/pages/api_utils/store/store')" clickable
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
    import { link_to } from '@/utils'
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
                // #ifdef APP-PLUS
                this.$logger.info('检查更新')
                checkUpdate()
                // #endif
                // #ifdef H5
                uni.showModal({
                    title: '检查更新',
                    content: '本功能仅在APP中使用',
                    showCancel: false
                })
                // #endif
                // // #ifdef APP-PLUS
                // // this.$logger.info('plus', plus)
                // let res = await uni.request({
                //     url: 'http://61.175.224.118:8664/update.xml',
                //     method: 'GET'
                // })
                // this.$logger.info(res)
                // let is_latest = true // check latest
                // if (res.statusCode === 200) {
                //     const { version, url, description } = this.check_update_parse(res.data)
                //     is_latest = false
                //     if (is_latest) {
                //         uni.showModal({
                //             title: '检查更新',
                //             content: '已经是最新版本',
                //             showCancel: false
                //         })
                //     } else {
                //         uni.showModal({
                //             title: '检查更新',
                //             content: description,
                //             confirmText: '立即下载更新',
                //             success: (res) => {
                //                 if (res.cancel) return
                //                 if (res.confirm) {
                //                     // 下载安装包
                //                     this.$logger.info('下载安装包', url)
                //                 }
                //             }
                //         })
                //     }
                // } else {
                //     uni.showModal({
                //         title: '检查更新',
                //         content: '获取更新信息失败',
                //         showCancel: false
                //     })
                //     return
                // }
                // // #endif

            },
            // check_update_parse(data) {
            //     this.$logger.info('check_update_parse data', data)
            //     let version_match = data.match('<version>(.+)</version>')
            //     let url_match = data.match('<url>(.+)</url>')
            //     let description_match = data.match('<description>(.+)</description>')
            //     return {
            //         version: version_match[1],
            //         url: url_match[1],
            //         description: description_match[1]
            //     }
            // },
            about() {
                const base_info = uni.getAppBaseInfo()
                uni.showModal({
                    title: '关于',
                    content: [
                        `名称: ${base_info.appName}`,
                        `版本: ${base_info.appVersion}`,
                        '作者: Cai Chang'
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
