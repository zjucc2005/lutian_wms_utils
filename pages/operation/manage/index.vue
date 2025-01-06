<template>
    <view>
        <uni-list>
            <uni-list-item title="期初库存录入"
                :show-extra-icon="true"
                :extra-icon="{ color: '#007aff', size: '24', type: 'location' }"
                @click="link_to('/pages/operation/manage/inv_init')" clickable show-arrow />
            <uni-list-item title="库存盘点"
                :show-extra-icon="true"
                :extra-icon="{ color: '#007aff', size: '24', type: 'location' }"
                @click="link_to('/pages/operation/manage/inv_check')" clickable show-arrow />
<!--            <uni-list-item title="库位管理"
                :show-extra-icon="true" 
                :extra-icon="{ color: '#28a745', size: '24', type: 'list' }"
                @click="goTo('locs')" clickable showArrow />    -->     
   <!--         <uni-list-item title="选项3"
                :show-extra-icon="true"
                :extra-icon="{ color: '#dc3545', size: '24', type: 'gear' }"
                clickable showArrow /> -->
        </uni-list>
    </view>
</template>

<script>
    import { play_audio_prompt, link_to } from '@/utils'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                
            }
        },
        methods: {
            link_to,
            goTo(path) {
                play_audio_prompt('success')
                uni.navigateTo({ url: `/pages/operation/manage/${path}` })
            },
            handle_inv_search() {
                scan_code().then(res => {
                    uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            }
        }
    }
</script>

<style>

</style>
