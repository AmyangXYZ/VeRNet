<script lang="ts" setup>
import { ref } from 'vue'
import { Moon } from '@element-plus/icons-vue'
import Light from './icons/IconLightMode.vue'
import IconGithub from './icons/IconGithub.vue'
import { useDark } from '@vueuse/core'

const isDark = useDark()

isDark.value = true

const activeIndex = ref('1-1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>
<template>
  <el-menu :default-active="activeIndex" mode="horizontal" :ellipsis="false" @select="handleSelect">
    <el-menu-item index="0" style="margin: auto">
      <img height="48" src="@/assets/vernet-logo.png" />
    </el-menu-item>
    <div class="flex-grow" />

    <el-sub-menu index="1">
      <template #title>Networks</template>
      <el-menu-item index="1-1">TSCH</el-menu-item>
      <el-menu-item index="1-2">TSN</el-menu-item>
      <el-menu-item index="1-3">5G</el-menu-item>
      <el-menu-item index="1-4">Composite</el-menu-item>
    </el-sub-menu>
    <el-menu-item index="2">About</el-menu-item>
    <el-menu-item style="margin: auto; width: 80px">
      <el-switch
        class="theme-switch"
        v-model="isDark"
        inline-prompt
        :active-icon="Moon"
        active-color="dark"
        :inactive-icon="Light"
      />
    </el-menu-item>
    <el-menu-item style="margin: auto; width: 24px">
      <el-link :underline="false" href="https://github.com/AmyangXYZ/VeRNet" st>
        <el-icon :color="isDark ? 'white' : 'black'" :size="24">
          <IconGithub />
        </el-icon>
      </el-link>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.flex-grow {
  flex-grow: 1;
}
.theme-switch {
  width: 60px;
}
</style>
