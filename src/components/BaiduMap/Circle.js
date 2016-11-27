import _ from 'lodash';

import { randomColor } from 'utils/utils';

export default function circleLocalSearch(map, nodes, updateClusters) {
  const options = {
    pageCapacity: 100,
    renderOptions: {
      map: map
    },
    onSearchComplete: function(results) {
      const num = results.getCurrentNumPois();
      const nodeList = [];
      for(let i = 0; i < num; i++) {
        const item = results.getPoi(i);
        const id = Number(item.address.split('-')[0]);

        const selectNode = _.find(nodes, { id });

        nodeList.push(selectNode);
      }

      const res = [{
        nodeList,
        color: randomColor(),
      }];

      updateClusters(res);
    },
  };

  const localSearch = new BMap.LocalSearch(map, options);

  const drawingManager = new BMapLib.DrawingManager(map, {
    isOpen: false, //是否开启绘制模式
    enableDrawingTool: true, //是否显示工具栏
    drawingToolOptions: {
      anchor: BMAP_ANCHOR_TOP_RIGHT, //位置
      offset: new BMap.Size(5, 5), //偏离值
      scale: 0.8, //工具栏缩放比例
      drawingModes: [
        BMAP_DRAWING_CIRCLE
      ]
    }
  });
  let circle = null;
  drawingManager.addEventListener('circlecomplete', function(e, overlay) {
    map.clearOverlays();
    circle = e;
    map.addOverlay(overlay);
    const radius = parseInt(e.getRadius());
    const center = e.getCenter();
    drawingManager.close();
    localSearch.searchNearby(' ', center, radius, {
      customData: {
        geotableId: 154106,
      }
    });
  });
}

