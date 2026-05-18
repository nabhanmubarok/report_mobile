module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Hapus atau jangan gunakan 'react-native-reanimated/plugin' lagi
      'react-native-worklets/plugin',
      // Plugin lain yang mungkin kamu punya...
    ],
  };
};