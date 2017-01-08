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
  const randomArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

  //产生一个六位的字符串
  let colorStr = '';
  for (let i = 0; i < 6;i++) {
    //15是范围上限，0是范围下限，两个函数保证产生出来的随机数是整数
    colorStr += randomArr[Math.ceil(Math.random() * (15 - 0) + 0)];
  }
  return `#${colorStr}`;
}



/*
const randomColor = () => {
  const colorStr = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase();
  return `#${"000000".substring(0,  6 - colorStr) + colorStr}`;
}
*/

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
