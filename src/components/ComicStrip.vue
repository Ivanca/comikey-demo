<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import ComicPanel from './ComicPanel.vue';
import { findGreenLinesDivisions } from '../canvas-functions';
import texts from '../texts';

const store = useStore();
const currentPage = ref(0);
const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const currentDivision: Ref<number> = ref(0);

const pages = [
  '/images/0.png',
  '/images/1.png',
  '/images/2.png',
  '/images/3.png'
]
const findDivisions = async (pagePath: string) => {
  await store.dispatch('setLoading', true);
  await store.dispatch('setPage', pagePath);
  canvas.value!.width = store.state.image.width;
  canvas.value!.height = store.state.image.height;
  if (!store.state.ctx) {
    await store.dispatch('setCanvasContext', canvas.value!.getContext('2d', { willReadFrequently: true }));
  }
  const divisions = await findGreenLinesDivisions(store.state.pagePath);
  await store.dispatch('setDivisions', divisions);
  await store.dispatch('setLoading', false);
}

const onClick = async () => {
  let newDivision = currentDivision.value + 1;
  let newCurrPage = currentPage.value;
  
  if (newDivision >= store.state.divisions.length) {
    newDivision = 0;
    newCurrPage = (currentPage.value + 1);
    
    if (newCurrPage >= pages.length) {
      newCurrPage = pages.length - 1;
      newDivision = store.state.divisions.length - 1;
      document.location.href = 'https://www.youtube.com/watch?v=UU2iGcR1Ek8';
    } else {
      currentPage.value = newCurrPage;
      currentDivision.value = newDivision;
      await findDivisions(pages[currentPage.value]);
    }
  }
  if (newCurrPage !== currentPage.value) {
    currentPage.value = newCurrPage;
  }
  if (newDivision !== currentDivision.value) {
    currentDivision.value = newDivision;
  }
}

onMounted(() => {
  document.fonts.ready.then(function () {
    findDivisions(pages[currentPage.value]);
  });

});

</script>

<template>
  <div class="canvas-and-panels-container" @click="onClick">
    <canvas ref="canvas"></canvas>
    <template v-for="(division, index) in store.state.divisions" :key="division.id">
      <ComicPanel
        :x="division.x"
        :y="division.y"
        :img="store.state.image"
        :ctx="store.state.ctx"
        :width="division.width"
        :height="division.height"
        :texts="[...texts[currentPage]][index]"
        :visible="currentDivision >= index"
        :alreadyShown="currentDivision > index"
      />
    </template>
  </div>
</template>

<style scoped>
</style>
