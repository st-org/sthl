module.exports = {
    entry: './dist/mod.js',
    mode: 'production',
    experiments: {
        outputModule: true
    },
    output: {
        filename: 'mod.js',
        path: __dirname,
        library: {
            type: 'module'
        },
        module: true
    }
}