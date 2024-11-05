<template>
    <uni-list class="uni-mb-10">
        <uni-list-item title="检查更新"
            :show-extra-icon="true"
            :extra-icon="{ type: 'loop', size: '24', color: '#007bff' }"
            @click="check_update" clickable showArrow />
        <uni-list-item title="关于"
            :show-extra-icon="true"
            :extra-icon="{ type: 'info', size: '24', color: '#007bff' }"
            @click="about" clickable showArrow />
        <!-- <uni-list-item title="位置"
            :show-extra-icon="true" 
            :extra-icon="{ color: '#007bff', size: '24', type: 'location' }"
            @click="open_location" clickable showArrow />
        <uni-list-item title="选项1"
            :show-extra-icon="true" 
            :extra-icon="{ color: '#28a745', size: '24', type: 'paperplane' }"
            clickable showArrow />
        <uni-list-item title="选项2"
            :show-extra-icon="true"
            :extra-icon="{ color: '#007bff', size: '24', type: 'staff' }"
            clickable showArrow />
        <uni-list-item title="选项3"
            :show-extra-icon="true"
            :extra-icon="{ color: '#dc3545', size: '24', type: 'gear' }"
            clickable showArrow /> -->
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
    import store from '@/store'
    export default {
        data() {
            return {
                buttonRect: {}
            }
        },
        methods: {
            async check_update() {
                // #ifdef APP-PLUS
                // console.log('plus', plus)
                let res = await uni.request({
                    url: 'http://61.175.224.118:8664/update.xml',
                    method: 'GET'
                })
                console.log(res)
                let is_latest = true // check latest
                if (res.statusCode === 200) {
                    const { version, url, description } = this.check_update_parse(res.data)
                    is_latest = false
                    if (is_latest) {
                        uni.showModal({
                            title: '检查更新',
                            content: '已经是最新版本',
                            showCancel: false
                        })
                    } else {
                        uni.showModal({
                            title: '检查更新',
                            content: description,
                            confirmText: '立即下载更新',
                            success: (res) => {
                                if (res.cancel) return
                                if (res.confirm) {
                                    // 下载安装包
                                    console.log('下载安装包', url)
                                }
                            }
                        })
                    }
                } else {
                    uni.showModal({
                        title: '检查更新',
                        content: '获取更新信息失败',
                        showCancel: false
                    })
                    return
                }
                // #endif
                // #ifndef APP-PLUS
                uni.showModal({
                    title: '检查更新',
                    content: '本功能仅在APP中使用',
                    showCancel: false
                })
                // #endif
            },
            check_update_parse(data) {
                console.log('check_update_parse data', data)
                let version_match = data.match('<version>(.+)</version>')
                let url_match = data.match('<url>(.+)</url>')
                let description_match = data.match('<description>(.+)</description>')
                return {
                    version: version_match[1],
                    url: url_match[1],
                    description: description_match[1]
                }
            },
            about() {
                // #ifdef APP-PLUS
                uni.showModal({
                    title: '关于',
                    content: `Version: ${plus.runtime.version}`, // app下使用
                    showCancel: false,
                    success: (res) => {},
                    fail: (err) => {}
                })
                // #endif
                // #ifndef APP-PLUS
                uni.showModal({
                    title: '关于',
                    content: '本功能仅在APP中使用',
                    showCancel: false
                })
                // #endif
            },
            test () {
                console.log('test')
            },
            goTo(path) {
                uni.navigateTo({ url: `/pages/my/${path}` })
            },
            // open_location () {
            //     uni.getLocation({
            //         type: 'gcj02', // wgs84/gcj02
            //         success: (res) => {
            //             console.log('uni.getLocation', res)
            //             this.location = {
            //                 longitude: res.longitude,
            //                 latitude: res.latitude
            //             }
            //             uni.openLocation({
            //                 longitude: res.longitude,
            //                 latitude: res.latitude,
            //                 name: '我的位置',
            //                 // address: value.address
            //                 success: (res) => {
            //                     console.log('uni.openLocation', res)
            //                 }
            //             })
            //         }
            //     })
            // },
            logout() {
                const that = this
                uni.showActionSheet({
                    itemList: ['退出登录'],
                    success: (e) => {
                        // console.log(e);
                        if (e.tapIndex === 0) {
                            console.log('退出登录')
                            store.commit('staff_logout')
                            uni.reLaunch({ url: '/pages/login' })
                        } else if (e.tapIndex === 1) {
                            uni.navigateBackMiniProgram({
                                success: (res) => {
                                    console.log('close app succ:', res)
                                },
                                fail: (res) => {
                                    console.log('close app fail:', res)
                                }
                            })
                        }
                    }
                })
            }
        }
    }
</script>

<style>

</style>
