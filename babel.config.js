module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // HAPUS baris ini jika ada:
      // 'react-native-worklets/plugin',
      'react-native-reanimated/plugin' // Ini saja yang diperlukan
    ]
  };
};