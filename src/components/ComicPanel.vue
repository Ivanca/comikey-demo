<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { getTextHeight, splitText } from "canvas-txt";

// accept properties x y width height and Canvas element
const props = defineProps<{
  x: number;
  y: number;
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D | null;
  img: HTMLImageElement | null;
  texts: string[];
  visible?: boolean;
  alreadyShown?: boolean;
}>();

interface Row {
  y: number;
  x: number;
  width: number;
}

interface Square {
  y: number;
  x: number;
  width: number;
  height: number;
  texts?: string[];
  fontSize?: number;
}

let imagedataRef = ref<ImageData | null>(null);
let squaresRef = ref<Square[]>([]);

watchEffect(async (onCleanup) => {
  if (imagedataRef.value) {
    let imgData = imagedataRef.value;
    let currentSquare = 0;
    let copy = props.ctx!.createImageData(imgData.width, imgData.height);
    let textCanvas = document.createElement("canvas");
    let textCtx = textCanvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    textCanvas.width = props.width;
    textCanvas.height = props.height;
    textCtx.putImageData(imgData, 0, 0);

    if (!props.visible) {
      props.ctx!.putImageData(copy, props.x, props.y);
      return;
    }
    let animationStart = Date.now();
    copy.data.set(new Uint8ClampedArray(imgData.data));
    let raf = -1;

    for (var i = 0; i < copy.data.length; i += 4) {
      copy.data[i + 3] = 0;
    }
    props.ctx!.putImageData(copy, props.x, props.y);
    let textImageData: ImageData | null = null;
    let animationStart2 = Date.now() + 600;

    const showSquaresSlowly = () => {
      let opacity = (Date.now() - animationStart2) / 800;
      let square = squaresRef.value[currentSquare];

      if (opacity < 0) {
        return false;
      }

      if (opacity > 1) {
        currentSquare += 1;
        if (currentSquare >= squaresRef.value.length) {
          currentSquare = squaresRef.value.length - 1;
          return true;
        }
        square = squaresRef.value[currentSquare];
        opacity = 0;
        animationStart2 = Date.now();
      }

      if (props.alreadyShown) {
        opacity = 1;
      }

      textCtx.fillStyle = "white";
      textCtx.fillRect(square.x, square.y, square.width, square.height);
      square.texts!.forEach((line, index) => {
        textCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        textCtx.font = `${square.fontSize}px Bangers`;
        textCtx.textAlign = "center";
        textCtx.fillText(
          line,
          square.x + square.width / 2,
          square.y + square.fontSize! * 0.9 + index * (square.fontSize! * 1.1)
        );
      });
      textImageData = textCtx!.getImageData(
        0,
        0,
        textCanvas.width,
        textCanvas.height
      );
      copy.data.set(textImageData.data);
      props.ctx!.putImageData(textImageData, props.x, props.y);
      if (props.alreadyShown) {
        if (currentSquare < squaresRef.value.length - 1) {
          currentSquare += 1;
          showSquaresSlowly();
        }
      }
      return false;
    };

    const fadeFromWhite = () => {
      let opacity = (Date.now() - animationStart) / 600;

      if (opacity > 1) {
        opacity = 1;
        return true;
      }
      for (var i = 0; i < copy.data.length; i += 4) {
        copy.data[i + 3] =
          (props.alreadyShown ? 1 : opacity) *
          (textImageData || imgData).data[i + 3];
      }
      if (opacity !== 1) {
        props.ctx!.putImageData(copy, props.x, props.y);
      }
      return false;
    };
    const tickAllAnimations = () => {
      let done1 = showSquaresSlowly();
      let done2 = fadeFromWhite();
      raf = requestAnimationFrame(tickAllAnimations);
      if (done1 && done2) {
        cancelAnimationFrame(raf);
      }
    };
    raf = requestAnimationFrame(tickAllAnimations);
    onCleanup(() => {
      cancelAnimationFrame(raf);
    });
  }
});

watchEffect(async (onCleanup) => {
  await document.fonts.ready;
  onCleanup(() => {
    props.ctx!.clearRect(props.x, props.y, props.width, props.height);
  });
  if (props.ctx && props.img) {
    props.ctx.drawImage(
      props.img,
      props.x,
      props.y,
      props.width,
      props.height,
      props.x,
      props.y,
      props.width,
      props.height
    );
    var imgData = props.ctx.getImageData(
      props.x,
      props.y,
      props.width,
      props.height
    );
    var data = imgData.data;
    let currentTransRow: Row | null = null;
    let transparentRows = [] as Row[];
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) {
        if (currentTransRow) {
          currentTransRow!.width! += 1;
        } else {
          currentTransRow = {
            y: Math.floor(i / 4 / props.width),
            x: Math.floor((i / 4) % props.width),
            width: 1,
          };
          transparentRows.push(currentTransRow);
        }
      } else {
        currentTransRow = null;
      }
      if (data[i] == 0 && data[i + 1] == 255 && data[i + 2] == 0) {
        // set it to white:
        data[i] = 255;
        data[i + 2] = 255;
      }
    }
    // Create the squares based on continuous transparent rows:
    let squares: Square[] = [];
    let lastSquareByXStart: Record<number, Square> = {};
    transparentRows.forEach((row) => {
      if (
        lastSquareByXStart[row.x]?.y + lastSquareByXStart[row.x]?.height ===
        row.y
      ) {
        lastSquareByXStart[row.x].height += 1;
      } else {
        lastSquareByXStart[row.x] = {
          y: row.y,
          x: row.x,
          width: row.width,
          height: 1,
        };
        squares.push(lastSquareByXStart[row.x]);
      }
    });
    transparentRows = []; // free memory
    // Now we have the squares, we can fill them with the texts:
    props.ctx.putImageData(imgData, props.x, props.y);
    const reduceFontTo = (
      text: string,
      size: number,
      square: Square
    ): [number, boolean, string[]] => {
      props.ctx!.font = `${size}px Bangers`;
      let calcHeight = getTextHeight({
        ctx: props.ctx!,
        text,
        style: `${size}px Bangers`,
      });
      let lines = splitText({
        ctx: props.ctx!,
        text,
        justify: false,
        width: square.width,
      });
      return [size, calcHeight * lines.length < square.height, lines];
    };

    squares.forEach((square) => {
      let text = props.texts.shift() as string;
      props.ctx!.fillStyle = "black";
      let [size, itFits, lines] = reduceFontTo(text, 28, square);
      if (!itFits) {
        [size, itFits, lines] = reduceFontTo(text, 25, square);
        if (!itFits) {
          [size, itFits, lines] = reduceFontTo(text, 20, square);
          if (!itFits) {
            // If it doesnt fit at 15 we are doing something wrong, can't be smaller
            [size, itFits, lines] = reduceFontTo(text, 15, square);
          }
        }
      }
      square.texts = lines;
      square.fontSize = size;
    });
    squaresRef.value = squares;

    imagedataRef.value = props.ctx.getImageData(
      props.x,
      props.y,
      props.width,
      props.height
    );
  }
});

</script>
<template>
</template>