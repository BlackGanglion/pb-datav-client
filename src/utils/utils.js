const getRandomNum = (min, max) => {
  const range = max - min;
  const rand = Math.random();
  return (min + Math.floor(rand * range));
}

const contains = (arr, obj) => {
  let i = arr.length;
  while (i--) {
    if (arr[i] === obj)
      return true;
  }
  return false;
}

const randomColor = () => {
  const colorStr = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase();
  return `#${"000000".substring(0, 6 - colorStr) + colorStr}`;
}

function find(arr, obj, key) {
  for(let i = 0; i < arr.length; i++) {
    if (arr[i][key] === obj[key]) {
      return { node: arr[i], index: i };
    }
  }
}

export {
  getRandomNum,
  contains,
  randomColor,
  find,
}
