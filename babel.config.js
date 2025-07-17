module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Este plugin es el que permite los alias de ruta como '@'.
      [
        'module-resolver',
        {
          root: ['.'], // Le dice que la raíz del proyecto es el directorio actual.
          alias: {
            // Define el alias: '@' apuntará a la carpeta './app'.
            '@': './*',
          },
        },
      ],
    ],
  };
};