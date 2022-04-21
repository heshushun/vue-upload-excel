import Vue from 'vue'
import App from './App.vue'
import './plugins/element.js'
import AFTableColumn from 'af-table-column'

Vue.use(AFTableColumn);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
