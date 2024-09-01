<script>
    import store from '@/store'
    import { get_bd_units } from '@/utils/api'
	export default {
		onLaunch: function() {
			console.log('App Launch')
            this.init_store()  // 加载本地存储的数据到store
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
        methods: {
            init_store() {
                store.commit('staff_login', {
                    stock: uni.getStorageSync('cur_stock'),
                    staff: uni.getStorageSync('cur_staff')
                })
                this.init_system_info()
                this.init_bd_units()
            },
            init_system_info () {
                uni.getSystemInfo({
                    success: (res) => { store.commit('set_system_info', res) }
                })
            },
            init_bd_units() {
                uni.getStorage({
                    key: 'bd_units',
                    success: (res) => { store.commit('set_bd_units', res.data) },
                    fail: (err) => {
                        get_bd_units().then(res => {
                            if (res.statusCode === 200) {
                                store.commit('set_bd_units', res.data)
                                uni.setStorageSync('bd_units', res.data)
                            } 
                        })
                    }
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
