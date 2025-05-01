const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './src/js/script.js',
    auth: './src/js/auth.js',
    cart: './src/js/cart.js',
    checkout: './src/js/checkout.js',
    orderConfirmation: './src/js/order-confirmation.js',
    profile: './src/js/profile.js',
    admin: './src/js/admin.js'
  },  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/index.html',
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/login.html',
      filename: 'login.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/register.html',
      filename: 'register.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/cart.html',
      filename: 'cart.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/checkout.html',
      filename: 'checkout.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/profile.html',
      filename: 'profile.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/order-confirmation.html',
      filename: 'order-confirmation.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/admin.html',
      filename: 'admin.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
};