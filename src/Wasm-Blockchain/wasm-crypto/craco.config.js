import path from 'path-browserify';
import crypto from 'crypto-browserify';

export default {
    webpack: {
        configure: {
            experiments: {
                asyncWebAssembly: true,
                layers: true,
                lazyCompilation: true,
                topLevelAwait: true,
            },
            resolve: {
                fallback: {
                    path: path,
                    crypto: crypto
                }
            }
        },
    },
}; 