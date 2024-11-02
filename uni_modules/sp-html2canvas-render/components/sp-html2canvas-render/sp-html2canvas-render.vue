<template>
  <!-- prop是自定义的数据字段名，要与chang后的保持一致，h2cRender是renderjs的module名称 -->
  <view class="sp-html2canvas-render" :prop="domId" :change:prop="h2cRender.watchDomId">
    <slot></slot>
    <text :prop="expOver" :change:prop="h2cRender.watchExpOver"></text>
  </view>
</template>

<script>
export default {
  props: {
    // 要渲染dom的id
    domId: {
      type: String,
      default: '',
      require: true
    }
  },
  data() {
    return {
      expOver: 0,
      // #ifdef VUE2
      // #ifdef APP
      // 只有在Vue2的APP真机中需要先声明h2cRender，否则会报错，若未报错建议删除此处代码
      h2cRender: null
      // #endif
      // #endif
    }
  },
  methods: {
    renderOver(e) {
      // 监听渲染生成完成
      this.$emit('renderOver', e)
    },
    h2cRenderDom() {
      // #ifdef H5
      this.renderDom()
      // #endif
      // #ifndef H5
      // 控制expOver变量改变以触发RenderJs中渲染方法。
      this.expOver++
      // 处理你自己的逻辑.....
      // #endif
    }
  }
}
</script>

<!-- renderjs目前仅支持内联使用 -->
<script module="h2cRender" lang="renderjs">
import html2canvas from 'html2canvas';
export default {
	data() {
		return {
			domIdValue: ''
		}
	},
	methods: {
		async renderDom() {
			// app无法通过传参获取domId,也无法直接获取到script中data或props数据
			// 必须通过特定的监听方式,与script通信,获取其data
			try {
				const el = document.getElementById(this.domIdValue);
        if(!el) {
          console.error('dom盒子未加载成功，请先确保dom渲染完成，再检查你的domId是否有误');
          return
        }
        /**
         * 配置说明
         * 1. allowTaint:true和useCORS:true都是解决跨域问题的方式(不一定完全能解决跨域)，不同的是使用allowTaint会对canvas造成污染，导致无法使用canvas.toDataURL方法
         * 2. 想要完美解决跨域，还得需要后端服务器设置access-control-allow-origin: *，允许资源跨域访问，前端设置useCORS:true
         * 2. scale通过放大倍率来调整画质清晰度，但是只调整这一个参数可能不是最优解
         */
				const canvas = await html2canvas(el, {
					width: el.offsetWidth,
					height: el.offsetHeight,
          x: 0,
          y: 0,
					logging: true,
					useCORS: true,
          // allowTaint: true,
          // async: false,
					scale: 2, // 2倍，增强清晰度
          // foreignObjectRendering: true, // 兼容性问题，慎用
				});
				const base64 = canvas.toDataURL('image/png', 1);
				this.$ownerInstance.callMethod('renderOver', base64);
			} catch(err) {
				console.log('==== err :', err.message);
			}
		},
		// 监听方式,与script通信,获取其data
		watchDomId(newValue, oldValue, ownerInstance, instance) {
			this.domIdValue = newValue
		},
    watchExpOver(newValue, oldValue, ownerInstance, instance) {
      if(newValue !== 0){
        // 初始不做监听，避免默认第一次就自动渲染
        this.renderDom()
      }
    }
	}
}
</script>

<style>
.sp-html2canvas-render {
  position: relative;
}
</style>
