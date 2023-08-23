const path = require('path');
module.exports = {
  module: {
    rules:[
      {
        test: /\.(ttf|otf|woff|woff2)$/,
        use:[
          {
            loader:'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath:path.resolve(__dirname,'fonts')
            }
          }
        ]
      },
      {
        test: /IBMPlexSans-Light-Latin1.woff2$/,
        use:[
          {
            loader:'url-loader',
            options: {
              limit:10000,
              mimetype:'application/font-woff2'
            }
          }
        ]
      },
      {
        test: /IBMPlexSans-Regular-Latin1.woff2$/,
        use:[
          {
            loader:'url-loader',
            options: {
              limit:10000,
              mimetype:'application/font-woff2'
            }
          }
        ]
      },
      {
        test: /IBMPlexSans-SemiBold-Latin1.woff2$/,
        use:[
          {
            loader:'url-loader',
            options: {
              limit:10000,
              mimetype:'application/font-woff2'
            }
          }
        ]
      },
    ]
  }
}