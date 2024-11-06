<script>
    import store from '@/store'
    import config from '@/config'
	export default {
		onLaunch: function() {
			// console.log('App Launch')
            this.init_store()  // 加载本地存储的数据到store
            uni.onWindowResize(res => {
                console.log('>>> 窗口尺寸发生变化', res)
                uni.getSystemInfo({
                    success: (gsi_res) => { 
                        store.commit('set_system_info', gsi_res)
                        // console.log('>>> 重新渲染页面')
                    }
                })    
            })
		},
		onShow: function() {
			// console.log('App Show')
		},
		onHide: function() {
			// console.log('App Hide')
		},
        methods: {
            init_store() {
                store.commit('staff_login', {
                    stock: uni.getStorageSync('cur_stock'),
                    staff: uni.getStorageSync('cur_staff')
                })
                store.commit('set_env', config.env)
                this.init_system_info()
            },
            init_system_info() {
                uni.getSystemInfo({
                    success: (res) => { store.commit('set_system_info', res) }
                })
            }
        }
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	@import '@/common/css/style.scss';
</style>
