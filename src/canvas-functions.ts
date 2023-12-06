import { Division, Line } from './types/stored';

export function findGreenLinesDivisions(path: string): Promise<Division[]> {
    return new Promise((resolve) => {
      const canvas: HTMLCanvasElement = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.src = path; // Set the source to your image
      
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
      
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
      
          const lines: Line[] = [];
      
                // Function to check if a pixel is green
          const isGreen = (index: number) => data[index] === 0 && data[index + 1] === 255 && data[index + 2] === 0;
  
          // Find vertical lines
          for (let x = 0; x < canvas.width; x++) {
              let lineStart = -1;
              for (let y = 0; y < canvas.height; y++) {
                  const index = (y * canvas.width + x) * 4;
                  if (isGreen(index)) {
                     // check if the pixel next column at the same position is green too, split the line if it is:
                      const indexNext = (y * canvas.width + x + 1) * 4;
                      const indexPrev = (y * canvas.width + x - 1) * 4;
                      if (lineStart === -1) {
                        lineStart = y;
                      } else if (isGreen(indexNext) || isGreen(indexPrev)) {
                        lines.push({ x, y: lineStart, height: y - lineStart });
                        lineStart = y;
                      }                    
                  } else if (lineStart !== -1) {
                      if (y - lineStart > 10) {
                        lines.push({ x, y: lineStart, height: y - lineStart });
                      }
                      lineStart = -1;
                  }
              }
              if (lineStart !== -1) lines.push({ x, y: lineStart, height: canvas.height - lineStart });
          }
  
          // Find horizontal lines
          for (let y = 0; y < canvas.height; y++) {
              let lineStart = -1;
              for (let x = 0; x < canvas.width; x++) {
                  const index = (y * canvas.width + x) * 4;
                  if (isGreen(index)) {
                      // check if the pixel next row at the same position is green too, split the line if it is:
                      const indexNext = ((y + 1) * canvas.width + x) * 4;
                      const indexPrev = ((y - 1) * canvas.width + x) * 4;
                      if (lineStart === -1) {
                        lineStart = x;
                      } else if (isGreen(indexNext) || isGreen(indexPrev)) {
                        lines.push({ x: lineStart, y, width: x - lineStart + 1 });
                        lineStart = x;
                      }
                  } else if (lineStart !== -1) {
                      if (x - lineStart > 10) {
                          lines.push({ x: lineStart, y, width: x - lineStart });
                      }
                      lineStart = -1;
                  }
              }
              if (lineStart !== -1) lines.push({ x: lineStart, y, width: canvas.width - lineStart });
          }
          console.log('lines', lines);
          const divisions: Division[] = [];
  
          let lastVerticalLineEnd: number = 0;
          lines.forEach(line => {
              if (line.width) { // Horizontal line
                  lines.forEach(verticalLine => {
                      
                      if (verticalLine.height && verticalLine.x >= line.x && verticalLine.x <= line.x + line.width!
                         && verticalLine.y <= line.y && verticalLine.y + verticalLine.height! >= line.y) {
                          if (verticalLine.y > lastVerticalLineEnd) {
                              divisions.push({ 
                                  x: line.x, 
                                  y: lastVerticalLineEnd, 
                                  width: canvas.width,
                                  height: verticalLine.y - lastVerticalLineEnd,
                                  id: path + '-' + divisions.length
                              });
                          }
                          // check if the division doesnt exist yet:
                          const division = divisions.find(division =>
                            division.x === line.x
                            && division.y === verticalLine.y
                            && division.width === line.width
                            && division.height === verticalLine.height
                          );
                          if (!division) {
                            divisions.push({ 
                              x: line.x, 
                              y: verticalLine.y, 
                              width: line.width!, 
                              height: verticalLine.height,
                              id: path + '-' + divisions.length
                            });
                            lastVerticalLineEnd = verticalLine.y + verticalLine.height!;
                          }
                      }
                  });
              }
          });
          if (lastVerticalLineEnd < canvas.height) {
              divisions.push({ 
                  x: 0, 
                  y: lastVerticalLineEnd, 
                  width: canvas.width,
                  height: canvas.height - lastVerticalLineEnd,
                  id: path + '-' + divisions.length
              });
          }
          resolve(divisions);
      };
    }
  )};
  