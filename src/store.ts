// @/store.js
import { createStore } from 'vuex'
import { Division } from './types/stored';


export default createStore({
  state: {
    areEyesOpen: false,
    isPanelVisible: false,
    loading: false,
    divisions: [] as Division[],
    pagePath: '',
    ctx: null as CanvasRenderingContext2D | null,
    image: null as HTMLImageElement | null,
  },
  mutations: {
    openEyes(state) {
      state.areEyesOpen = true;
    },
    closeEyes(state) {
      state.areEyesOpen = false;
    },
    setDivisions(state, divisions: Division[]) {
      state.divisions = divisions;
    },
    setLoading(state, loading: boolean) {
      state.loading = loading;
    },
    setImage(state, image: HTMLImageElement) {
      state.image = image;
    },
    setPage(state, path: string) {
      state.pagePath = path;
    },
    setCanvasContext(state, ctx: CanvasRenderingContext2D) {
      state.ctx = ctx;
    }
  },
  actions: {
    setCanvasContext({ commit }, ctx: CanvasRenderingContext2D) {
      commit('setCanvasContext', ctx);
    },
    setPage({ commit }, path: string) {
      return new Promise<void>((resolve) => {
        const image = new Image();
        image.src = path;
        image.onload = () => {
          commit('setPage', path);
          commit('setImage', image);
          resolve();
        }
      });
    },
    setDivisions({ commit }, divisions: Division[]) {
      commit('setDivisions', divisions);
    },
    setLoading({ commit }, loading: boolean) {
      commit('setLoading', loading);
    }
  },
  getters: {

  }
})