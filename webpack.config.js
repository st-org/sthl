module.exports = {
    entry: './dist/mod.js',
    experiments: {
        outputModule: true
    },
    mode: 'production',
    output: {
        filename: 'mod.js',
        library: {
            type: 'module'
        },
        module: true,
        path: __dirname
    }
}