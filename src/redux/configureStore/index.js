import dev from './configureStore.dev';
import prod from './configureStore.prod';

if (__DEV__) {
  module.exports = dev;
} else {
  module.exports = prod;
}
