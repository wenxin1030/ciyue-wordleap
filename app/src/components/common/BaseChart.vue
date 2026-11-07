<template>
  <div ref="el" class="base-chart" :style="{ height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '260px' }
})
const el = ref(null)
let chart = null
let ro = null

function render() {
  if (!chart || !props.option) return
  chart.setOption(props.option, true)
}

onMounted(async () => {
  await nextTick()
  chart = echarts.init(el.value, null, { renderer: 'canvas' })
  render()
  ro = new ResizeObserver(() => chart && chart.resize())
  ro.observe(el.value)
})

watch(() => props.option, render, { deep: true })

onBeforeUnmount(() => {
  ro && ro.disconnect()
  chart && chart.dispose()
  chart = null
})

defineExpose({ resize: () => chart && chart.resize() })
</script>

<style scoped>
.base-chart { width: 100%; min-height: 120px; }
</style>
