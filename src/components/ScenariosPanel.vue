<script setup lang="ts">
import { SignalShowScenarios, SelectedScenario } from '@/hooks/useStates'

const updateSelectedScenario = (val: any) => {
  SelectedScenario.value = val
}
</script>

<template>
  <el-row justify="space-even" v-show="SignalShowScenarios" :gutter="50" style="margin-left: 0px">
    <el-col :span="6">
      <el-card class="card" :body-style="{ padding: '0px' }">
        <img
          src="@/assets/scenarios-6tisch-logo.png"
          class="image"
          @click="updateSelectedScenario('6TiSCH')"
        />
        <div style="padding: 14px">
          <span>6TiSCH</span>
          <div class="bottom">
            <div class="description">IPv6 over the TSCH mode of IEEE 802.15.4e</div>
            <el-button text class="button">Go</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="card" :body-style="{ padding: '0px' }">
        <img
          src="@/assets/scenarios-802.1-logo.png"
          class="image"
          @click="updateSelectedScenario('TSN')"
        />
        <div style="padding: 14px">
          <span>TSN</span>
          <div class="bottom">
            <div class="description">IEEE 802.1 Time-Sensitive Networking</div>
            <el-button text class="button">Go</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="card" :body-style="{ padding: '0px' }">
        <img
          src="@/assets/scenarios-5G-logo_500px.jpg"
          class="image"
          @click="updateSelectedScenario('5G')"
        />
        <div style="padding: 14px">
          <span>5G</span>
          <div class="bottom">
            <div class="description">5G New Radio</div>
            <el-button text class="button">Go</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="card" :body-style="{ padding: '0px' }">
        <img
          src="https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
          class="image"
          @click="updateSelectedScenario('Composite')"
        />
        <div style="padding: 14px">
          <span>Composite</span>
          <div class="bottom">
            <div class="description">Composite network with different technologies</div>
            <el-button text class="button">Go</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
.card {
  background-color: rgba(0, 0, 0, 0.66);
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}
.description {
  font-size: 12px;
  color: #999;
}

.bottom {
  margin-top: 13px;
  line-height: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button {
  padding: 0;
  min-height: auto;
}

.image {
  width: 100%;
  display: block;
}
</style>
