import { ComponentCustomProperties } from 'vue'
import { Store } from 'vuex'

declare module '@vue/runtime-core' {
  // Declare your own store states.
  interface State {
    areEyesOpen: boolean,
    loading: boolean,
    divisions: Division[],
    pagePath: string,
    ctx: CanvasRenderingContext2D | null,
    image: HTMLImageElement | null,
  }

  interface ComponentCustomProperties {
    $store: Store<State>
  }
}