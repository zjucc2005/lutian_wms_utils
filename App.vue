<script>
    import store from '@/store'
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
                    depot: uni.getStorageSync('cur_depot'),
                    staff: uni.getStorageSync('cur_staff')
                })
                this.load_bd_units()
            },
            load_bd_units() {
                store.commit('set_bd_units', uni.getStorageSync('bd_units'))
            }
        }
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	// @import '@/uni_modules/uni-scss/index.scss';
	@import '@/common/css/style.scss';
</style>
