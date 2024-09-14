<template>
    <view>
        <uni-list class="mb-1">
            <uni-list-item title="位置"
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
                clickable showArrow />
        </uni-list>
        <uni-list>
            <uni-list-item title="退出"
                :show-extra-icon="true"
                :extra-icon="{ color: '#dc3545', size: '24', type: 'close' }"
                @click="logout" clickable
                />
        </uni-list>
    </view>
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
            test () {
                console.log('test')
            },
            goTo(path) {
                uni.navigateTo({ url: `/pages/my/${path}` })
            },
            open_location () {
                uni.getLocation({
                    type: 'gcj02', // 国测局数据
                    success: (res) => {
                        console.log('uni.getLocation', res)
                        this.location = {
                            longitude: res.longitude,
                            latitude: res.latitude
                        }
                        uni.openLocation({
                            longitude: res.longitude,
                            latitude: res.latitude,
                            name: '我的位置',
                            // address: value.address
                            success: (res) => {
                                console.log('uni.openLocation', res)
                            }
                        })
                    }
                })
            },
            logout() {
                const that = this
                uni.showActionSheet({
                    title: '',
                    itemList: ['退出登录'],
                    popover: {
                        // 104: navbar + topwindow 高度，暂时 fix createSelectorQuery 在 pc 上获取 top 不准确的 bug
                        // top: that.buttonRect.top + 104  + that.buttonRect.height,
                        // left: that.buttonRect.left + that.buttonRect.width / 2
                    },
                    success: (e) => {
                        console.log(e);
                        if (e.tapIndex === 0) {
                            console.log('logout')
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
