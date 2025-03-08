<script>
    import store from '@/store'
    export default {
        onLaunch: function() {
            // this.$logger.info('App Launch')
            this.init_store()  // 加载本地存储的数据到store
            uni.onWindowResize(res => {
                this.$logger.info('>>> 窗口尺寸发生变化', res)
                uni.getSystemInfo({
                    success: (gsi_res) => { 
                        store.commit('set_system_info', gsi_res)
                    }
                })    
            })
        },
        onShow: function() {
            // this.$logger.info('App Show')
            // #ifdef H5
            window.addEventListener('keydown', this.keydownEscape);
            // #endif
        },
        onHide: function() {
            // this.$logger.info('App Hide')
            // #ifdef H5
            window.removeEventListener('keydown', this.keydownEscape);
            // #endif
        },
        methods: {
            init_store() {
                store.commit('staff_login', {
                    stock: uni.getStorageSync('cur_stock'),
                    staff: uni.getStorageSync('cur_staff')
                })
                this.init_system_info()
            },
            init_system_info() {
                uni.getSystemInfo({
                    success: (res) => { store.commit('set_system_info', res) }
                })
            },
            keydownEscape(e) {
                // console.log('keydown Escape', e)
                if (e.code == 'Escape') uni.navigateBack()
            }
        }
    }
</script>

<style lang="scss">
    /*每个页面公共css */
    @import '@/uni_modules/uni-scss/index.scss';
    @import '@/common/css/style.scss';
</style>
