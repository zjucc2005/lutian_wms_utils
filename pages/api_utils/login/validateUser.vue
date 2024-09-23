<template>
    <view>
        <uni-card title="Response" :isFull="true" sub-title="AuthService.ValidateUser.common" extra="store.state.userInfo">
            <text class="text-sm">{{ res }}</text>
        </uni-card>
    </view>
</template>

<script>
    import K3CloudApi from '@/utils/k3cloudapi.js'
    export default {
        data() {
            return {
                res: 'waiting'
            }
        },
        mounted() {
            K3CloudApi.conn().then(res => {
                this.res = res;
            })
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
