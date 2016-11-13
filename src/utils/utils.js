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

export {
  getRandomNum,
  contains,
}
