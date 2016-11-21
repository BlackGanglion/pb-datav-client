import { find } from 'utils/utils';

function initNodes(width, height, nodes, links) {
  let degreeCount = {};
  links.forEach((link, i) => {
    const { source, target } = link;

    if (degreeCount[source]) {
      degreeCount[source] += 1;
    } else {
      degreeCount[source] = 1;
    }

    if (degreeCount[target]) {
      degreeCount[target] += 1;
    } else {
      degreeCount[target] = 1;
    }
  });

  nodes.forEach((node, i) => {
    // 随机节点位置
    let randCx = Math.floor(Math.random() * width);
    let randCy = Math.floor(Math.random() * height);
    const r = 12;

    nodes[i] = {
      ...nodes[i],
      // 起始位置
      ox: randCx - (width / 2),
      oy: randCy - (height / 2),
      // 当前位置
      cx: randCx - (width / 2),
      cy: randCy - (height / 2),
      r,
      // x轴上速度初始化
      dispX: 0,
      // y轴上速度初始化
      dispY: 0,
      // 相对位移储存
      path: [
        { dx: 0,
          dy: 0 },
      ],
      // 从属于哪个社团中心
      clubNodeNumber: -1,
      degree: degreeCount[node.id] || 0,
      degreeCenter: (degreeCount[node.id] || 0) / (nodes.length - 1),
    };
  });
}

function randomClubNodes(nodes, k) {
  const selectedNodes = [];
  const l = nodes.length;

  let count = k;
  while(count--) {
    const id = Math.floor(Math.random() * 100) % l;

    let flag = 1;
    for (let i = 0; i < selectedNodes.length; i++) {
      if (Number(selectedNodes[i].id) === Number(nodes[i].id)) {
        count++;
        flag = 0;
        break;
      }
    }

    if (flag) {
      selectedNodes.push({
        cx: nodes[id].cx,
        cy: nodes[id].cy,
        ox: nodes[id].cx,
        oy: nodes[id].cy,
        path: [{
          dx: 0,
          dy: 0,
        }],
        count: 0,
        degreeCount: 0,
      });
    }
  }

  return selectedNodes;
}

// 计算排斥力
function repulsion(x, k, cr) {
  if(isNaN(k * k / x)) console.warn('repulsion error');
  return k * k / x * cr;
}

// 判断排斥力的方向， 返回-1为负方向的力，1为正方向的力
function calculateRepulsionDisp(curNode, nextNode, k, cr) {
  const { cx: curX, cy: curY } = curNode;
  const { cx: nextX, cy: nextY } = nextNode;

  const x = nextX - curX;
  const y = nextY - curY;

  const l = Math.sqrt(x * x + y * y);

  return l === 0 ? {
    xDisp: 0,
    yDisp: 0,
  } : {
    xDisp: repulsion(l, k, cr) * (x / l),
    yDisp: repulsion(l, k, cr) * (y / l),
  }
}

function calculateRepulsion(nodes, k, cr) {
  const l = nodes.length;
  for(let i = 0; i < l; i++) {
    for(let j = 0; j < l; j++) {
      if (i === j) continue;
      const { xDisp, yDisp } = calculateRepulsionDisp(nodes[i], nodes[j], k, cr);

      nodes[j] = Object.assign({}, nodes[j], {
        dispX: nodes[j].dispX + xDisp,
        dispY: nodes[j].dispY + yDisp,
      });
    }
  }
}

// 计算吸引力
function attraction(x, k, ca, weight = 0) {
  if(isNaN(x * x / k)) console.warn('attraction error');
  return x * x / k * (ca + weight);
}

function calculateAttractionDisp(sourceNode, targetNode, k, ca) {
  const { cx: sourceX, cy: sourceY } = sourceNode;
  const { cx: targetX, cy: targetY } = targetNode;

  const x = sourceX - targetX;
  const y = sourceY - targetY;

  const l = Math.sqrt(x * x + y * y);

  return l === 0 ? {
    sourceXDisp: 0,
    sourceYDisp: 0,
    targetXDisp: 0,
    targetYDisp: 0,
  } : {
    sourceXDisp: (-1) * attraction(l, k, ca) * (x / l),
    sourceYDisp: (-1) * attraction(l, k, ca) * (y / l),
    targetXDisp: attraction(l, k, ca) * (x / l),
    targetYDisp: attraction(l, k, ca) * (y / l),
  }
}

function calculateAttraction(nodes, links, k, ca) {
  links.forEach((link, i) => {
    const { source, target } = link;
    let { node: sourceNode, index: sourceIndex } = find(nodes, { id: source }, 'id');
    let { node: targetNode, index: targetIndex } = find(nodes, { id: target }, 'id');

    const { sourceXDisp, sourceYDisp,
     targetXDisp, targetYDisp } = calculateAttractionDisp(sourceNode, targetNode, k, ca);

    nodes[sourceIndex] = Object.assign({}, sourceNode, {
      dispX: sourceNode.dispX + sourceXDisp,
      dispY: sourceNode.dispY + sourceYDisp,
    });

    nodes[targetIndex] = Object.assign({}, targetNode, {
      dispX: targetNode.dispX + targetXDisp,
      dispY: targetNode.dispY + targetYDisp,
    });
  });
}

function calculatePos(nodes, temperature, width, height) {
  nodes.forEach((node, i) => {
    const posX = node.dispX;
    const posY = node.dispY;

    const dis = Math.sqrt(posX * posX + posY * posY);

    let finalX = node.cx;
    let finalY = node.cy;
    if (dis !== 0) {
      finalX = finalX + (posX / dis) * Math.min(temperature, dis);
      finalY = finalY + (posY / dis) * Math.min(temperature, dis);
    }

    const cx = Math.min((width / 2 - 20), Math.max(finalX, -(width / 2 - 20)));
    const cy = Math.min((height / 2 - 20), Math.max(finalY, -(height / 2 - 20)));

    // 相对于初始点路径记录
    nodes[i].path.push({
      dx: cx - node.ox,
      dy: cy - node.oy,
    })

    nodes[i] = Object.assign({}, nodes[i], {
      cx,
      cy,
      dispX: 0,
      dispY: 0,
    });
  });
}

function cool(t, ce) {
  if (t > ce)
    return t - ce;
  else if (t > 0)
    return t - 0.01;
  else
    return 0;
}

function updateClubNodes(nodes, clubNodes, gc) {
  if (nodes[0].clubNodeNumber === -1) return;

  for(let i = 0; i < clubNodes.length; i++) {
    clubNodes[i] = {
      count: 0,
      cx: 0,
      cy: 0,
      ox: clubNodes[i].ox,
      oy: clubNodes[i].oy,
      queue: [],
      path: clubNodes[i].path,
      degreeCount: 0,
    }
  }

  nodes.forEach((node) => {
    clubNodes[node.clubNodeNumber].count++;
  });

  nodes.forEach((node) => {
    const { cx, cy, count } = clubNodes[node.clubNodeNumber];
    clubNodes[node.clubNodeNumber].cx = cx + (node.cx / count);
    clubNodes[node.clubNodeNumber].cy = cy + (node.cy / count);
    clubNodes[node.clubNodeNumber].queue.push(node.id);
    clubNodes[node.clubNodeNumber].degreeCount += node.degreeCenter;
  });

  // 社团中心的斥力
  const records = [];
  for(let i = 0; i < clubNodes.length; i++) {
    records[i] = {
      cx: 0,
      cy: 0,
    };
    for(let j = 0; j < clubNodes.length; j++) {
      if (i === j) continue;
      const x = clubNodes[i].cx - clubNodes[j].cx;
      const y = clubNodes[i].cy - clubNodes[j].cy;
      const dis = Math.sqrt(x * x + y * y);

      if (dis !== 0) {
        const f = gc * clubNodes[i].degreeCount * clubNodes[j].degreeCount / dis;
        records[i].cx = records[i].cx + f * (x / dis);
        records[i].cy = records[i].cy + f * (y / dis);
      }
    }
  }

  clubNodes.forEach((node, i) => {
    clubNodes[i].cx = clubNodes[i].cx + records[i].cx;
    clubNodes[i].cy = clubNodes[i].cy + records[i].cy;
    clubNodes[i].path.push({
      dx: node.cx - node.ox,
      dy: node.cy - node.oy,
    })
  });
}

function calculateClubForce(node, clubNode, g) {
  const x = clubNode.cx - node.cx;
  const y = clubNode.cy - node.cy;

  const dis = Math.sqrt(x * x + y * y);

  // clubNode与node重合
  if (dis === 0) return {
    dis: 0,
    dispX: 0,
    dispY: 0,
  }

  // 社团引力
  const f = g * node.degreeCenter * dis;

  return {
    dis,
    dispX: f * (x / dis),
    dispY: f * (y / dis),
  }
}

function calculateClubAttraction(nodes, clubNodes, g) {
  let resultForce;

  nodes.forEach((node, i) => {
    let clubNodeNumber;

    resultForce = {
      dis: Number.MAX_VALUE,
      dispX: 0,
      dispY: 0,
    };

    clubNodes.forEach((clubNode, j) => {
      const res = calculateClubForce(node, clubNode, g);

      if (res.dis < resultForce.dis) {
        resultForce = {
          dis: res.dis,
          dispX: res.dispX,
          dispY: res.dispY,
        }
        clubNodeNumber = j;
      }
    });

    // console.log(clubNodes, clubNodeNumber);

    nodes[i] = Object.assign({}, node, {
      clubNodeNumber,
      dispX: node.dispX + resultForce.dispX,
      dispY: node.dispY + resultForce.dispY,
    });
  });
}

function renderClubNodes(parent, clubNodes, lastTime) {
  clubNodes.forEach((node, i) => {
    createNode(parent, {
      ox: node.ox,
      oy: node.oy,
      cx: node.cx,
      cy: node.cy,
      r: 14,
      id: `c${i}`,
      group: 10,
      path: node.path,
      queue: node.queue,
    }, lastTime);
  });
}

function checkClub(nodes, links) {
  let linksMap = {};
  links.forEach((link, i) => {
    const { source, target } = link;
    const key = `${source}-${target}`;
    linksMap[key] = 1;
  });

  const l = nodes.length;
  const m = links.length;

  let result = 0;
  for (let i = 0; i < l; i++) {
    for (let j = 0; j < l; j++) {
      if (i === j) continue;
      const sNode = nodes[i];
      const tNode = nodes[j];

      const ans = ((linksMap[`${sNode.id}-${tNode.id}`] === 1
        || linksMap[`${tNode.id}-${sNode.id}`] === 1 ? 1 : 0) - (sNode.degree * tNode.degree / (2 * m)))
        * (sNode.clubNodeNumber === tNode.clubNodeNumber ? 1 : 0);

      result += ans;
    }
  }

  return (result / (2 * m));
}

// 这里很多直接修改引用，偷懒了，是不正确的
export default function calculateForceChart(width, height, props) {
  const {
    data,
    temperatureMin,
    cr,
    ca,
    lastTime,
    isUseClub,
    clubNumber,
    g,
    gc,
  } = props;

  let count = props.count;
  let temperature = props.temperature;
  let clubNodes = [];

  const { nodes, links } = data;
  const area = width * height;
  const k = Math.sqrt(area / nodes.length);

  initNodes(width, height, nodes, links);

  if (isUseClub) {
    clubNodes = randomClubNodes(nodes, clubNumber);
  }

  while(count--) {
    // 计算排斥力
    calculateRepulsion(nodes, k, cr);

    // 计算吸引力
    calculateAttraction(nodes, links, k, ca);

    // 社团引力
    // 更新社团中心
    if (isUseClub) {
      updateClubNodes(nodes, clubNodes, gc);
      calculateClubAttraction(nodes, clubNodes, g);
    }

    // 计算位置
    calculatePos(nodes, temperature, width, height);

    // 模拟退火
    temperature = cool(temperature, 2);
  }

  if (isUseClub) {
    console.info('社团引力聚类结果:', clubNodes);
    const res = checkClub(nodes, links);
    console.info('当前模块度:', res);
  }

  console.log(props);

  return clubNodes;
}
