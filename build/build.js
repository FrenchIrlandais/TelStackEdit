var webpack = require('webpack')
var webpackConfig = require('./build-configuration')

webpack(webpackConfig, function (err, stats) {
  if (err) {
    throw err
  }

  // Output the result of the compilation
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n\n')

  console.log('Build complete.\n');
})
