function addParams(url, params = {}) {
  let finalUrl = url;

  Object.keys(params).forEach((key, i) => {
    const value = params[key];

    if (i === 0) {
      finalUrl = `${finalUrl}?${key}=${value}`;
    } else {
      finalUrl = `${finalUrl}&${key}=${value}`;
    }
  });

  return finalUrl;
}

export default {
  beforeFetch({ action }) {
    const { url, params } = action;
    return Promise.resolve({
      action: {
        ...action,
        url: addParams(url, params),
      },
    });
  },
};
