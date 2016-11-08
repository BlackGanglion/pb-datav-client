const URL_ADD = 'http://localhost:8080/endWork/'

const URL_MAP = {
  // 获取全部节点信息
  allNodes: 'allNodes.json',
  nodeConnect: 'nodeConnect.json',
};

const getUrl = (key) => {
  return URL_ADD + URL_MAP[key];
};

export { getUrl };
